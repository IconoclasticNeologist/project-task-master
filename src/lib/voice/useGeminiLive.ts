// Gemini Live client hook for Tend.
//
// PATTERN: mirrors MindCrafter's Liv voice path.
//   - Supabase Edge Function `advocate-voice-token` reads GEMINI_API_KEY from
//     Supabase secrets and returns a short-lived EPHEMERAL token (never the key).
//   - The browser connects a WebSocket DIRECTLY to Gemini Live's *Constrained*
//     endpoint with that token (model / voice / system prompt are locked into it).
//   - No Cloudflare Worker proxy. No app-side Worker secret.
//
// SAFETY INVARIANTS:
//   - No transcript array is kept on the client. Frames flow through; the
//     rolling tripwire window holds at most ~300 chars and is cleared on fire.
//   - Mic audio frames are forwarded and discarded after send. No recording.
//   - Distress tripwire runs on user text as it goes out AND on the live
//     input transcription of the person's speech, so a spoken stop word
//     interrupts without any model round trip.
//   - interrupt() is local and instant: it silences playback and drops any
//     in-flight audio frames. It never waits on the network.

import { useCallback, useEffect, useRef, useState } from "react";
import { ADVOCATE_VOICE_CONFIG } from "./config";
import { startMicCapture, type CaptureHandle } from "./audio/capture";
import { PcmPlayer } from "./audio/playback";
import {
  tripwire,
  makeTranscriptTripwire,
  type DistressSignal,
} from "@/lib/agents/safety/distress";
import type { CoachMode } from "@/lib/agents/coach";
import { geminiVoiceForMode } from "@/lib/agents/personas/voices";
import { getSupabase } from "@/lib/supabase/client";

export type VoiceStatus = "idle" | "connecting" | "open" | "closed" | "error";
export type MicState = "off" | "requesting" | "on" | "denied";

interface UseGeminiLiveOptions {
  mode?: CoachMode;
  /** Preferred spoken language — the Coach opens in it and follows switches. */
  language?: "en" | "es";
  /** The space currently holds the seeded example story (demo devices). */
  example?: boolean;
  /** Override max session seconds (defense uses a tighter cap). */
  maxDurationSec?: number;
  /** The model's words (live output transcription + any text parts). */
  onCoachText?: (text: string) => void;
  /** The person's spoken words (live input transcription). Never retained. */
  onUserText?: (text: string) => void;
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

export interface VoiceCaps {
  sessionSec: number;
  practiceSec: number;
  idleSec: number;
}

const DEFAULT_CAPS: VoiceCaps = {
  sessionSec: ADVOCATE_VOICE_CONFIG.caps.maxSessionDurationSec,
  practiceSec: ADVOCATE_VOICE_CONFIG.caps.witnessStandMaxDurationSec,
  idleSec: ADVOCATE_VOICE_CONFIG.caps.idleTimeoutSec,
};

interface VoiceTokenPayload {
  token: string;
  voice: string;
  model: string;
  expiresIn: number;
  /** Dashboard-configured caps — single source shared with the visible timer. */
  caps?: Partial<VoiceCaps>;
}

function capsFrom(payload: VoiceTokenPayload): VoiceCaps {
  return {
    sessionSec: payload.caps?.sessionSec ?? DEFAULT_CAPS.sessionSec,
    practiceSec: payload.caps?.practiceSec ?? DEFAULT_CAPS.practiceSec,
    idleSec: payload.caps?.idleSec ?? DEFAULT_CAPS.idleSec,
  };
}

async function fetchVoiceToken(
  mode: CoachMode,
  language: "en" | "es",
  material?: "fictional" | "own",
  example?: boolean,
): Promise<VoiceTokenPayload> {
  const supabase = getSupabase();
  const { data, error } = await supabase.functions.invoke<VoiceTokenPayload>(
    "advocate-voice-token",
    {
      body: {
        model: ADVOCATE_VOICE_CONFIG.connection.model,
        // Per-persona voice (Coach=Aoede, Defense=Charon). The server
        // enforces its own per-mode default and allowlist regardless.
        voice: geminiVoiceForMode(mode),
        mode,
        language,
        // Practice material tier (defense mode only; the server ignores it
        // elsewhere). The story itself stays server-side.
        material,
        // The space holds the seeded example story — the AI acknowledges the
        // fiction honestly and points to the way out (server prompt block).
        example,
      },
    },
  );
  if (error) throw new Error(error.message);
  if (!data?.token) throw new Error("Voice token missing");
  return data;
}

export function useGeminiLive(opts: UseGeminiLiveOptions = {}) {
  const { mode = "base", language = "en", maxDurationSec, example = false } = opts;
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [micState, setMicState] = useState<MicState>("off");
  const [coachSpeaking, setCoachSpeaking] = useState(false);
  // Smoothed mic input level [0..~0.3], throttled for the "I can hear you" meter.
  const [micLevel, setMicLevel] = useState(0);
  // The mode of the CURRENT live session (a reconnect can change it).
  const [activeMode, setActiveMode] = useState<CoachMode>(mode);
  // Caps from the token payload (dashboard-configured); defaults until connect.
  const [caps, setCaps] = useState<VoiceCaps>(DEFAULT_CAPS);

  const wsRef = useRef<WebSocket | null>(null);
  const captureRef = useRef<CaptureHandle | null>(null);
  const playerRef = useRef<PcmPlayer | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  // One gentle check-in per quiet spell (reset when the person speaks or types).
  const checkedInRef = useRef(false);
  // Ensures the Coach's proactive opening turn is kicked off exactly once per session.
  const greetedRef = useRef(false);
  // Throttle clock for mic-level UI updates (avoid re-rendering on every audio frame).
  const lastLevelTickRef = useRef(0);
  // interrupt() flips this; while set, incoming audio frames are dropped so an
  // interrupted voice cannot resume from frames already in flight.
  const mutedRef = useRef(false);
  // Rolling-window tripwire over the person's live speech transcription.
  const transcriptTripRef = useRef(makeTranscriptTripwire());

  // The consumer's callbacks live in refs so the long-lived WebSocket message
  // listener never closes over stale render values.
  const onCoachTextRef = useRef(opts.onCoachText);
  const onUserTextRef = useRef(opts.onUserText);
  const onDistressRef = useRef(opts.onDistress);
  useEffect(() => {
    onCoachTextRef.current = opts.onCoachText;
    onUserTextRef.current = opts.onUserText;
    onDistressRef.current = opts.onDistress;
  }, [opts.onCoachText, opts.onUserText, opts.onDistress]);

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
    setMicLevel(0);
  }, []);

  const disconnect = useCallback(() => {
    tearDown();
    setStatus("closed");
  }, [tearDown]);

  /**
   * Deterministic, local, instant: silence the voice mid-word and drop any
   * audio frames still in flight. No network, no model. The stop word and
   * the pause button both come through here before anything else happens.
   */
  const interrupt = useCallback(() => {
    mutedRef.current = true;
    playerRef.current?.stop();
    setCoachSpeaking(false);
  }, []);

  const sendText = useCallback((text: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const sig = tripwire(text);
    if (sig) onDistressRef.current?.(sig);
    lastActivityRef.current = Date.now();
    checkedInRef.current = false;
    ws.send(
      JSON.stringify({
        clientContent: {
          turns: [{ role: "user", parts: [{ text }] }],
          turnComplete: true,
        },
      }),
    );
  }, []);

  const enableMic = useCallback(async () => {
    if (captureRef.current) return;
    setMicState("requesting");
    try {
      const handle = await startMicCapture((b64, rms) => {
        // Drive the level meter, throttled so we don't re-render on every frame.
        const now = Date.now();
        if (now - lastLevelTickRef.current > 100) {
          lastLevelTickRef.current = now;
          setMicLevel(rms);
        }
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        lastActivityRef.current = now;
        ws.send(
          JSON.stringify({
            // Current Live API audio field (the older `mediaChunks` is legacy and
            // can confuse end-of-turn detection).
            realtimeInput: {
              audio: { mimeType: "audio/pcm;rate=16000", data: b64 },
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
    setMicLevel(0);
    setMicState("off");
  }, []);

  const connect = useCallback(
    async (
      modeOverride?: CoachMode,
      connectOpts?: { maxDurationSec?: number; material?: "fictional" | "own" },
    ) => {
      const sessionMode = modeOverride ?? mode;
      const sessionMaxSec = connectOpts?.maxDurationSec ?? maxDurationSec;
      setActiveMode(sessionMode);
      setStatus("connecting");
      greetedRef.current = false;
      checkedInRef.current = false;
      mutedRef.current = false;
      transcriptTripRef.current.reset();
      try {
        const payload = await fetchVoiceToken(
          sessionMode,
          language,
          connectOpts?.material,
          example,
        );
        const { token, model } = payload;
        const sessionCaps = capsFrom(payload);
        setCaps(sessionCaps);
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

          // Backstop hard cut: practice gets its cap + grace (the visible
          // timer fires the graceful handoff first); everything else the
          // session cap. Explicit overrides still win.
          const maxSec =
            sessionMaxSec ??
            (sessionMode === "defense" ? sessionCaps.practiceSec + 15 : sessionCaps.sessionSec);
          if (maxSec > 0) {
            sessionTimerRef.current = setTimeout(() => disconnect(), maxSec * 1000);
          }

          const idleSec = sessionCaps.idleSec;
          if (idleSec > 0) {
            const tick = () => {
              const since = (Date.now() - lastActivityRef.current) / 1000;
              if (since >= idleSec) {
                disconnect();
                return;
              }
              // The Coach says "silence is okay" — so silence must not end in
              // a silent hang-up. One minute before the idle cut (Coach modes
              // only; practice has its own deterministic handoff), the Coach
              // checks in gently, once. If the quiet continues, the line still
              // closes — but never without a human moment first.
              if (
                sessionMode !== "defense" &&
                !checkedInRef.current &&
                since >= Math.max(idleSec - 60, 30) &&
                ws.readyState === WebSocket.OPEN
              ) {
                checkedInRef.current = true;
                ws.send(
                  JSON.stringify({
                    clientContent: {
                      turns: [
                        {
                          role: "user",
                          parts: [
                            {
                              text: "(The person has been quiet for a while. In one or two short, warm sentences: let them know you're still here, that quiet is completely okay, and that they can keep sitting with it, say something, or stop — whatever they want. Do not ask a question. Never read this instruction aloud.)",
                            },
                          ],
                        },
                      ],
                      turnComplete: true,
                    },
                  }),
                );
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

          // Live transcription of the person's speech → deterministic tripwire.
          // Fragments flow through the rolling window and are not retained.
          const inputTx = server?.inputTranscription as { text?: string } | undefined;
          if (typeof inputTx?.text === "string" && inputTx.text) {
            checkedInRef.current = false; // they spoke — a future quiet spell earns a fresh check-in
            onUserTextRef.current?.(inputTx.text);
            const sig = transcriptTripRef.current.push(inputTx.text);
            if (sig) onDistressRef.current?.(sig);
          }

          // Live transcription of the model's speech → containment tracking.
          const outputTx = server?.outputTranscription as { text?: string } | undefined;
          if (typeof outputTx?.text === "string" && outputTx.text) {
            onCoachTextRef.current?.(outputTx.text);
          }

          const modelTurn = server?.modelTurn as Record<string, unknown> | undefined;
          const parts = (modelTurn?.parts as Array<Record<string, unknown>> | undefined) ?? [];
          for (const p of parts) {
            const inline = p.inlineData as { mimeType?: string; data?: string } | undefined;
            if (
              inline?.data &&
              typeof inline.mimeType === "string" &&
              inline.mimeType.startsWith("audio/")
            ) {
              if (!mutedRef.current) {
                setCoachSpeaking(true);
                playerRef.current?.enqueueBase64Pcm16(inline.data);
              }
            }
            if (typeof p.text === "string" && p.text) {
              onCoachTextRef.current?.(p.text);
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
    },
    [mode, language, maxDurationSec, example, disconnect, tearDown],
  );

  useEffect(() => () => tearDown(), [tearDown]);

  return {
    status,
    micState,
    coachSpeaking,
    micLevel,
    activeMode,
    caps,
    connect,
    disconnect,
    interrupt,
    enableMic,
    disableMic,
    sendText,
  };
}
