// Gemini Live client hook for The Advocate.
//
// PATTERN: mirrors MindCrafter's Liv voice path.
//   - Supabase Edge Function `advocate-voice-token` reads GEMINI_API_KEY from
//     Supabase secrets and returns a short-lived EPHEMERAL token (never the key).
//   - The browser connects a WebSocket DIRECTLY to Gemini Live's *Constrained*
//     endpoint with that token (model / voice / system prompt are locked into it).
//   - No Cloudflare Worker proxy. No app-side Worker secret.
//
// SAFETY INVARIANTS:
//   - No transcript array is kept on the client. Frames flow through.
//   - Mic audio frames are forwarded and discarded after send. No recording.
//   - Distress tripwire runs on user text as it goes out so the Coach can
//     shift to regulator mode without a server roundtrip.

import { useCallback, useEffect, useRef, useState } from "react";
import { ADVOCATE_VOICE_CONFIG } from "./config";
import { startMicCapture, type CaptureHandle } from "./audio/capture";
import { PcmPlayer } from "./audio/playback";
import { tripwire, type DistressSignal } from "@/lib/agents/safety/distress";
import type { CoachMode } from "@/lib/agents/coach";
import { getSupabase } from "@/lib/supabase/client";

export type VoiceStatus = "idle" | "connecting" | "open" | "closed" | "error";
export type MicState = "off" | "requesting" | "on" | "denied";

interface UseGeminiLiveOptions {
  mode?: CoachMode;
  /** Override max session seconds (defense uses a tighter cap). */
  maxDurationSec?: number;
  onCoachText?: (text: string) => void;
  onDistress?: (sig: DistressSignal) => void;
}

// Ephemeral (constrained) tokens MUST use the *Constrained* method. The plain
// BidiGenerateContent endpoint rejects an access_token with close code 1008
// ("Method doesn't allow unregistered callers"). The token already locks
// model / voice / AUDIO modality / system instruction (minted in the
// advocate-voice-token edge function via bidiGenerateContentSetup), so the
// setup frame below only re-sends the model id.
const GEMINI_WS_BASE =
  "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained";

interface VoiceTokenPayload {
  token: string;
  voice: string;
  model: string;
  expiresIn: number;
}

async function fetchVoiceToken(mode: CoachMode): Promise<VoiceTokenPayload> {
  const supabase = getSupabase();
  const { data, error } = await supabase.functions.invoke<VoiceTokenPayload>(
    "advocate-voice-token",
    {
      body: {
        model: ADVOCATE_VOICE_CONFIG.connection.model,
        voice: ADVOCATE_VOICE_CONFIG.connection.voice,
        mode,
      },
    },
  );
  if (error) throw new Error(error.message);
  if (!data?.token) throw new Error("Voice token missing");
  return data;
}

export function useGeminiLive(opts: UseGeminiLiveOptions = {}) {
  const { mode = "base", maxDurationSec, onCoachText, onDistress } = opts;
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [micState, setMicState] = useState<MicState>("off");
  const [coachSpeaking, setCoachSpeaking] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const captureRef = useRef<CaptureHandle | null>(null);
  const playerRef = useRef<PcmPlayer | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  // Ensures the Coach's proactive opening turn is kicked off exactly once per session.
  const greetedRef = useRef(false);

  const tearDown = useCallback(() => {
    captureRef.current?.stop();
    captureRef.current = null;
    playerRef.current?.stop();
    playerRef.current = null;
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    idleTimerRef.current = null;
    sessionTimerRef.current = null;
    try {
      wsRef.current?.close();
    } catch {
      /* ignore */
    }
    wsRef.current = null;
    setMicState("off");
    setCoachSpeaking(false);
  }, []);

  const disconnect = useCallback(() => {
    tearDown();
    setStatus("closed");
  }, [tearDown]);

  const sendText = useCallback(
    (text: string) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      const sig = tripwire(text);
      if (sig) onDistress?.(sig);
      lastActivityRef.current = Date.now();
      ws.send(
        JSON.stringify({
          clientContent: {
            turns: [{ role: "user", parts: [{ text }] }],
            turnComplete: true,
          },
        }),
      );
    },
    [onDistress],
  );

  const enableMic = useCallback(async () => {
    if (captureRef.current) return;
    setMicState("requesting");
    try {
      const handle = await startMicCapture((b64) => {
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        lastActivityRef.current = Date.now();
        ws.send(
          JSON.stringify({
            realtimeInput: {
              mediaChunks: [{ mimeType: "audio/pcm;rate=16000", data: b64 }],
            },
          }),
        );
      });
      captureRef.current = handle;
      setMicState("on");
    } catch {
      setMicState("denied");
    }
  }, []);

  const disableMic = useCallback(() => {
    captureRef.current?.stop();
    captureRef.current = null;
    setMicState("off");
  }, []);

  const connect = useCallback(async () => {
    setStatus("connecting");
    greetedRef.current = false;
    try {
      const { token, model } = await fetchVoiceToken(mode);
      // v1alpha + ?access_token=<ephemeral>. The token has model, voice,
      // AUDIO modality, and system instruction locked into its constraints,
      // so we MUST NOT resend those in the setup frame.
      const wsUrl = `${GEMINI_WS_BASE}?access_token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      playerRef.current = new PcmPlayer(24000);

      ws.addEventListener("open", () => {
        setStatus("open");
        // Minimal setup frame. If on first real session audio is missing,
        // add back: generationConfig: { responseModalities: ["AUDIO"] }
        // (non-sensitive, redundant with the token constraint).
        // If the upstream rejects the model id, drop the "models/" prefix
        // here AND in the edge function constraint so they still match.
        ws.send(
          JSON.stringify({
            setup: { model: `models/${model}` },
          }),
        );

        const maxSec = maxDurationSec ?? ADVOCATE_VOICE_CONFIG.caps.maxSessionDurationSec;
        if (maxSec > 0) {
          sessionTimerRef.current = setTimeout(() => disconnect(), maxSec * 1000);
        }

        const idleSec = ADVOCATE_VOICE_CONFIG.caps.idleTimeoutSec;
        if (idleSec > 0) {
          const tick = () => {
            const since = (Date.now() - lastActivityRef.current) / 1000;
            if (since >= idleSec) {
              disconnect();
              return;
            }
            idleTimerRef.current = setTimeout(tick, 5000);
          };
          idleTimerRef.current = setTimeout(tick, 5000);
        }
      });

      ws.addEventListener("message", async (evt) => {
        lastActivityRef.current = Date.now();
        let raw: string | null = null;
        if (typeof evt.data === "string") {
          raw = evt.data;
        } else if (evt.data instanceof Blob) {
          raw = await evt.data.text();
        }
        if (!raw) return;
        let parsed: unknown;
        try {
          parsed = JSON.parse(raw);
        } catch {
          return;
        }
        if (!parsed || typeof parsed !== "object") return;
        const msg = parsed as Record<string, unknown>;
        // Coach speaks first: as soon as setup is acknowledged, send the opening
        // signal so the model greets before the person has to say anything. The
        // locked system prompt treats "BEGIN" as the session-open cue (and never
        // reads it aloud). Guarded so it fires once per session.
        if (msg.setupComplete && !greetedRef.current) {
          greetedRef.current = true;
          ws.send(
            JSON.stringify({
              clientContent: {
                turns: [{ role: "user", parts: [{ text: "BEGIN" }] }],
                turnComplete: true,
              },
            }),
          );
          return;
        }
        const server = msg.serverContent as Record<string, unknown> | undefined;
        const modelTurn = server?.modelTurn as Record<string, unknown> | undefined;
        const parts = (modelTurn?.parts as Array<Record<string, unknown>> | undefined) ?? [];
        for (const p of parts) {
          const inline = p.inlineData as { mimeType?: string; data?: string } | undefined;
          if (inline?.data && typeof inline.mimeType === "string" && inline.mimeType.startsWith("audio/")) {
            setCoachSpeaking(true);
            playerRef.current?.enqueueBase64Pcm16(inline.data);
          }
          if (typeof p.text === "string" && p.text) {
            onCoachText?.(p.text);
          }
        }
        if (server?.turnComplete) {
          setCoachSpeaking(false);
        }
      });

      ws.addEventListener("close", () => {
        tearDown();
        setStatus("closed");
      });
      ws.addEventListener("error", () => {
        tearDown();
        setStatus("error");
      });
    } catch {
      tearDown();
      setStatus("error");
    }
  }, [mode, maxDurationSec, onCoachText, disconnect, tearDown]);

  useEffect(() => () => tearDown(), [tearDown]);

  return {
    status,
    micState,
    coachSpeaking,
    connect,
    disconnect,
    enableMic,
    disableMic,
    sendText,
  };
}
