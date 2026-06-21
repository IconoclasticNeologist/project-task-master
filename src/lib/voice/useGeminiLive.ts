// Trimmed Gemini Live client hook.
//
// SAFETY INVARIANTS:
//   - Never holds or sees the Gemini API key. Connects only to the in-app
//     proxy at /api/voice/proxy with a short-lived bearer.
//   - No transcript persistence, no analytics, no upload.
//   - Mic audio frames are forwarded to the proxy and discarded by the client
//     after send; no local recording.
//
// This is intentionally minimal scaffolding. Audio capture, RMS VAD, idle
// timer, and tool-call plumbing are TODO and will be ported from
// MindCrafter's useGeminiLive when the UI screen lands.

import { useCallback, useEffect, useRef, useState } from "react";
import { startAdvocateVoiceSession } from "./advocate-voice-session.functions";

export type VoiceStatus = "idle" | "connecting" | "open" | "closed" | "error";

export function useGeminiLive() {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(async () => {
    setStatus("connecting");
    try {
      const { token, proxyPath } = await startAdvocateVoiceSession();
      const wsUrl = new URL(proxyPath, window.location.origin);
      wsUrl.protocol = wsUrl.protocol === "https:" ? "wss:" : "ws:";
      wsUrl.searchParams.set("t", token);
      const ws = new WebSocket(wsUrl.toString());
      wsRef.current = ws;
      ws.addEventListener("open", () => setStatus("open"));
      ws.addEventListener("close", () => setStatus("closed"));
      ws.addEventListener("error", () => setStatus("error"));
    } catch {
      setStatus("error");
    }
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setStatus("closed");
  }, []);

  useEffect(() => () => wsRef.current?.close(), []);

  return { status, connect, disconnect };
}
