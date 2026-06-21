// WebSocket proxy: browser <-> this Worker <-> Gemini Live.
//
// SAFETY INVARIANTS:
//   - Gemini API key stays server-side; the browser never sees it.
//   - No frame logging.
//   - No transcript persistence.
//   - No IP capture.
//   - Bearer validated by HMAC signature only; no session row is consulted
//     or created.
//
// Implementation note: WebSocket upgrade on Cloudflare Workers uses the
// WebSocketPair API. TanStack Start passes the raw Request through, so we
// short-circuit before the framework tries to render a response body.

import { createFileRoute } from "@tanstack/react-router";
import { verifyToken } from "@/lib/voice/session-token";
import { ADVOCATE_VOICE_CONFIG } from "@/lib/voice/config";
import { isUnderCap, recordSpendCents } from "@/lib/voice/cost-breaker";

/**
 * Estimate cost in cents from a Gemini Live usageMetadata block.
 * Reads only token counts by modality — never touches transcript content.
 * Returns 0 when pricing is unset (all-zero config = breaker disabled).
 */
function estimateCostCents(usage: unknown): number {
  if (!usage || typeof usage !== "object") return 0;
  const u = usage as Record<string, unknown>;
  const pricing = ADVOCATE_VOICE_CONFIG.pricing;

  // Gemini reports per-modality token counts in arrays like
  // promptTokensDetails: [{ modality: "AUDIO", tokenCount: N }, ...]
  const sumByModality = (key: string): { audio: number; text: number } => {
    const arr = u[key];
    let audio = 0;
    let text = 0;
    if (Array.isArray(arr)) {
      for (const d of arr) {
        if (!d || typeof d !== "object") continue;
        const det = d as Record<string, unknown>;
        const n = typeof det.tokenCount === "number" ? det.tokenCount : 0;
        if (det.modality === "AUDIO") audio += n;
        else text += n;
      }
    }
    return { audio, text };
  };

  const inTok = sumByModality("promptTokensDetails");
  const outTok = sumByModality("responseTokensDetails");

  const usd =
    (inTok.audio / 1_000_000) * pricing.audioInputPerMTokens +
    (outTok.audio / 1_000_000) * pricing.audioOutputPerMTokens +
    (inTok.text / 1_000_000) * pricing.textInputPerMTokens +
    (outTok.text / 1_000_000) * pricing.textOutputPerMTokens;

  return Math.round(usd * 100);
}

const GEMINI_WS_BASE =
  "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent";

async function handleUpgrade(request: Request): Promise<Response> {
  if (request.headers.get("upgrade") !== "websocket") {
    return new Response("Expected WebSocket upgrade", { status: 426 });
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("t");
  const secret = process.env.VOICE_BEARER_SECRET;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!secret || !apiKey) {
    return new Response("Voice not configured", { status: 503 });
  }
  if (!token || !(await verifyToken(secret, token))) {
    return new Response("Unauthorized", { status: 401 });
  }
  // Aggregate daily $ cap check at connection time only. No mid-session kill.
  if (!isUnderCap(ADVOCATE_VOICE_CONFIG.caps.dailyDollarCap)) {
    return new Response("Voice service temporarily unavailable", { status: 503 });
  }

  // WebSocketPair is a Cloudflare Workers global.
  const PairCtor = (globalThis as unknown as { WebSocketPair?: new () => Record<string, WebSocket> })
    .WebSocketPair;
  if (!PairCtor) {
    return new Response("WebSocket not supported in this runtime", { status: 500 });
  }
  const pair = new PairCtor();
  const client = pair[0];
  const server = pair[1];

  // Open upstream connection to Gemini Live with server-held key.
  const upstreamUrl = `${GEMINI_WS_BASE}?key=${encodeURIComponent(apiKey)}`;
  const upstream = new WebSocket(upstreamUrl);

  // Accept client side. accept() is a Workers extension.
  (server as unknown as { accept?: () => void }).accept?.();

  const closeBoth = (code = 1000, reason = "") => {
    try { server.close(code, reason); } catch { /* ignore */ }
    try { upstream.close(code, reason); } catch { /* ignore */ }
  };

  // Bridge: client -> upstream (no logging of frames).
  server.addEventListener("message", (e) => {
    if (upstream.readyState === WebSocket.OPEN) upstream.send(e.data);
  });
  server.addEventListener("close", () => closeBoth());
  server.addEventListener("error", () => closeBoth(1011, "client error"));

  // Bridge: upstream -> client. Forward frame unchanged FIRST, then peek
  // only at usageMetadata to feed the aggregate cost breaker. No logging,
  // no per-session state, no transcript fields touched.
  upstream.addEventListener("message", (e) => {
    if (server.readyState === WebSocket.OPEN) server.send(e.data);
    const data = e.data;
    if (typeof data !== "string") return;
    if (data.indexOf('"usageMetadata"') === -1) return;
    try {
      const parsed = JSON.parse(data) as Record<string, unknown>;
      const usage = (parsed.usageMetadata ??
        (parsed.serverContent as Record<string, unknown> | undefined)?.usageMetadata) as unknown;
      if (usage) recordSpendCents(estimateCostCents(usage));
    } catch {
      // Intentionally empty: malformed/non-JSON frames are ignored.
    }
  });
  upstream.addEventListener("close", () => closeBoth());
  upstream.addEventListener("error", () => closeBoth(1011, "upstream error"));

  // Per-session hard cap (config-driven; 0 = disabled).
  const maxSec = ADVOCATE_VOICE_CONFIG.caps.maxSessionDurationSec;
  if (maxSec > 0) {
    setTimeout(() => closeBoth(1000, "max duration"), maxSec * 1000);
  }

  return new Response(null, { status: 101, webSocket: client } as ResponseInit & {
    webSocket: WebSocket;
  });
}

export const Route = createFileRoute("/api/voice/proxy")({
  server: {
    handlers: {
      GET: async ({ request }) => handleUpgrade(request),
    },
  },
});
