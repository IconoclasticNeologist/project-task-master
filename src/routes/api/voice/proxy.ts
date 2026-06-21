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

  // Bridge: upstream -> client.
  upstream.addEventListener("message", (e) => {
    if (server.readyState === WebSocket.OPEN) server.send(e.data);
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
