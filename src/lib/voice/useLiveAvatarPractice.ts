// HeyGen LiveAvatar client hook for the Witness Stand practice person.
//
// OWNED CONVERSATION LOOP (why the avatar is just a face here):
//   LiveAvatar's browser auto-voice loop reliably GENERATES a reply to the
//   person's speech but never VOICES it (verified over many tests + the shim
//   health record). So we own the loop end to end:
//     input  → their ASR (accurate) → user.transcription, captured per answer
//     brain  → WE generate the line via advocate-agent `defense_turn`
//              (JWT-gated, RAG-locked to the person's shareable-only account)
//     output → session.repeat(text) = avatar.speak_text = speak VERBATIM,
//              the one command proven reliable (2/2 headless, no generation)
//   The avatar never generates; it only speaks text we hand it.
//
// SAFETY INVARIANTS:
//   - No LiveAvatar API key in the browser — only a session-scoped token.
//   - interrupt() is local-first: the media element is muted synchronously,
//     then the network interrupt/stop follows. A stop word cuts the voice
//     mid-word without waiting on anything.
//   - The deterministic tripwire runs on the person's live transcription
//     (chunk events for low latency, full events as the safety net).
//   - Conversation history is module-local (in-memory ref), cleared on
//     teardown; nothing persisted.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AgentEventsEnum,
  LiveAvatarSession,
  SessionEvent,
  SessionInteractivityMode,
  SessionState,
  VoiceChatState,
} from "@heygen/liveavatar-web-sdk";
import { getSupabase } from "@/lib/supabase/client";
import { listStatements } from "@/lib/data/statements";
import { makeTranscriptTripwire, type DistressSignal } from "@/lib/agents/safety/distress";

export type AvatarStatus = "idle" | "connecting" | "open" | "closed" | "error";
export type AvatarConnectResult = "open" | "unavailable" | "error";

// Must match ACCOUNT_SENTINEL in supabase/functions/advocate-defense-llm.
const ACCOUNT_SENTINEL = "[[PRACTICE_ACCOUNT]]";
const MAX_ACCOUNT_CHARS = 3500;

interface UseLiveAvatarPracticeOptions {
  /** The person's spoken words (live transcription). Never retained. */
  onUserText?: (text: string) => void;
  /**
   * The exact line the practice person is about to speak — we generate every
   * line ourselves, so captions are known-verbatim, not transcribed. Ephemeral:
   * same lifecycle as the caption stream, never persisted.
   */
  onAvatarText?: (text: string) => void;
  onDistress?: (sig: DistressSignal) => void;
  /** Preferred language — the practice questioner follows it. */
  language?: "en" | "es";
  /** The space currently holds the seeded example story (demo devices). */
  example?: boolean;
}

async function fetchAvatarToken(language: "en" | "es"): Promise<
  | {
      token: string;
      practiceCapSec: number | null;
      interactivity: "PUSH_TO_TALK" | "CONVERSATIONAL";
    }
  | "unavailable"
> {
  const supabase = getSupabase();
  // language reaches the mint so LiveAvatar's ASR hears (and its voice
  // pronounces) the same language we generate the practice lines in.
  const { data, error } = await supabase.functions.invoke<{
    token: string;
    practiceCapSec?: number;
    interactivity?: string;
  }>("advocate-avatar-session", { body: { language } });
  if (error || !data?.token) {
    // 503 = deliberately unconfigured → the caller falls back to voice-only.
    return "unavailable";
  }
  return {
    token: data.token,
    practiceCapSec: data.practiceCapSec ?? null,
    interactivity: data.interactivity === "PUSH_TO_TALK" ? "PUSH_TO_TALK" : "CONVERSATIONAL",
  };
}

/** Shareable-only statements, oldest first, capped — the practice source material. */
async function buildAccountContext(): Promise<string> {
  try {
    const statements = await listStatements();
    const shareable = statements
      .filter((s) => s.visibility === "shareable")
      .reverse() // listStatements is newest-first; practice reads in order
      .map((s) => s.text.trim())
      .filter(Boolean);
    return shareable.join("\n\n").slice(0, MAX_ACCOUNT_CHARS);
  } catch {
    // No context is a safe state: the shim asks warm-up questions only.
    return "";
  }
}

export function useLiveAvatarPractice(opts: UseLiveAvatarPracticeOptions = {}) {
  const [status, setStatus] = useState<AvatarStatus>("idle");
  const [avatarSpeaking, setAvatarSpeaking] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  // Dashboard-configured practice cap, from the session mint (null = unknown).
  const [practiceCapSec, setPracticeCapSec] = useState<number | null>(null);
  // Why the last connect failed, in plain words (dev surfaces show this).
  const [lastError, setLastError] = useState<string | null>(null);
  // The answer gate: the mic transmits ONLY while the person is answering,
  // in both underlying modes (muted-conversational or push-to-talk).
  const pushToTalk = true; // the answer button is always the interaction
  const pttRef = useRef(false); // which underlying mechanism the session uses
  const [isAnswering, setIsAnswering] = useState(false);
  // Safari can refuse un-muted playback outside a tap; when that happens the
  // UI shows an explicit "turn sound on" affordance instead of silent video.
  const [needsSoundTap, setNeedsSoundTap] = useState(false);
  // Content-free event trail (event names + outcomes only) for dev surfaces.
  const [events, setEvents] = useState<string[]>([]);
  const logEvent = useCallback((line: string) => {
    const stamp = new Date().toISOString().slice(11, 19);
    setEvents((prev) => [...prev.slice(-14), `${stamp} ${line}`]);
  }, []);

  const sessionRef = useRef<LiveAvatarSession | null>(null);
  // The person's spoken answer, accumulated from live transcription between
  // "Tap to answer" and "I'm done" — the input to our own reply generation.
  const answerBufRef = useRef("");
  // OWNED CONVERSATION LOOP: we generate every line and the avatar speaks it
  // VERBATIM (their auto-voice loop never speaks user-triggered replies).
  const accountRef = useRef("");
  const materialRef = useRef<"fictional" | "own">("fictional");
  const languageRef = useRef<"en" | "es">(opts.language ?? "en");
  languageRef.current = opts.language ?? "en";
  const exampleRef = useRef(opts.example ?? false);
  exampleRef.current = opts.example ?? false;
  const historyRef = useRef<Array<{ role: "user" | "avatar"; text: string }>>([]);
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const streamReadyRef = useRef(false);
  const transcriptTripRef = useRef(makeTranscriptTripwire());

  const onUserTextRef = useRef(opts.onUserText);
  const onAvatarTextRef = useRef(opts.onAvatarText);
  const onDistressRef = useRef(opts.onDistress);
  useEffect(() => {
    onUserTextRef.current = opts.onUserText;
    onAvatarTextRef.current = opts.onAvatarText;
    onDistressRef.current = opts.onDistress;
  }, [opts.onUserText, opts.onAvatarText, opts.onDistress]);

  /** Bind the <video> element; attaches now or when the stream is ready. */
  const attachVideo = useCallback((el: HTMLVideoElement | null) => {
    videoElRef.current = el;
    if (el && streamReadyRef.current) {
      sessionRef.current?.attach(el);
    }
  }, []);

  const tearDown = useCallback(() => {
    const session = sessionRef.current;
    sessionRef.current = null;
    streamReadyRef.current = false;
    setAvatarSpeaking(false);
    setMicMuted(false);
    setIsAnswering(false);
    if (session) {
      session.removeAllListeners();
      void session.stop().catch(() => {
        /* already stopped */
      });
    }
  }, []);

  /**
   * Deterministic, local, instant: mute the media element synchronously so
   * the practice voice cuts mid-word, then best-effort network interrupt.
   */
  const interrupt = useCallback(() => {
    if (videoElRef.current) videoElRef.current.muted = true;
    setAvatarSpeaking(false);
    try {
      sessionRef.current?.interrupt();
    } catch {
      /* socket already down — the local mute already did the job */
    }
  }, []);

  const disconnect = useCallback(() => {
    tearDown();
    setStatus("closed");
  }, [tearDown]);

  const pushTranscript = useCallback((text: string) => {
    if (!text || text.startsWith(ACCOUNT_SENTINEL)) return; // never tripwire our own context
    answerBufRef.current += (answerBufRef.current ? " " : "") + text;
    onUserTextRef.current?.(text);
    const sig = transcriptTripRef.current.push(text);
    if (sig) onDistressRef.current?.(sig);
  }, []);

  /**
   * Generation only — no session interaction, so the opener can be produced
   * IN PARALLEL with WebRTC setup and spoken the moment the room connects.
   * JWT-gated advocate-agent defense_turn, RAG-locked to the person's
   * shareable-only account. Returns null on any failure.
   */
  const generateLine = useCallback(async (opening: boolean): Promise<string | null> => {
    try {
      const { data, error } = await getSupabase().functions.invoke<{ text?: string }>(
        "advocate-agent",
        {
          body: {
            agent: "defense_turn",
            input: {
              account: accountRef.current,
              turns: historyRef.current,
              opening,
              // The material tier: the made-up story (server-side text) is
              // the standard; "own" is the consent-heavy tier.
              material: materialRef.current,
              language: languageRef.current,
              example: exampleRef.current,
            },
          },
        },
      );
      const text = data?.text?.trim();
      return error || !text ? null : text;
    } catch {
      return null;
    }
  }, []);

  /**
   * The owned conversation loop: WE generate the line and the avatar speaks it
   * VERBATIM via speak_text. Never routed through their auto-voice loop, which
   * generates but never voices a user-triggered reply. `pregenerated` carries
   * the opener started at mint time; if it failed, generate fresh here.
   */
  const generateAndSpeak = useCallback(
    async (opening: boolean, pregenerated?: Promise<string | null>) => {
      const session = sessionRef.current;
      if (!session) return;
      logEvent(opening ? "generating opener…" : "generating reply…");
      let text = pregenerated ? await pregenerated : null;
      if (!text) text = await generateLine(opening);
      if (!text) {
        logEvent("generate FAILED");
        setLastError("The practice questioner couldn’t think of a line just now.");
        return;
      }
      if (sessionRef.current !== session) return; // stopped while generating
      historyRef.current.push({ role: "avatar", text });
      onAvatarTextRef.current?.(text); // caption first — deaf/HoH read as it speaks
      try {
        session.repeat(text); // avatar.speak_text — VERBATIM, proven reliable
        logEvent(`speaking (${text.length} chars)`);
      } catch (e) {
        logEvent(`speak error: ${e instanceof Error ? e.message.slice(0, 40) : "err"}`);
      }
    },
    [logEvent, generateLine],
  );
  const generateAndSpeakRef = useRef(generateAndSpeak);
  useEffect(() => {
    generateAndSpeakRef.current = generateAndSpeak;
  }, [generateAndSpeak]);

  const connect = useCallback(
    async (material: "fictional" | "own" = "fictional"): Promise<AvatarConnectResult> => {
      materialRef.current = material;
      setStatus("connecting");
      setLastError(null);
      transcriptTripRef.current.reset();

      // Mic preflight: the SDK requests the microphone during start(), and a
      // blocked mic surfaces there as an opaque failure. Checking first turns
      // it into a precise, fixable message. Permission stays granted, so the
      // SDK's own request is instant afterwards.
      try {
        const probe = await navigator.mediaDevices.getUserMedia({ audio: true });
        probe.getTracks().forEach((t) => t.stop());
      } catch (e) {
        setLastError(
          `Microphone unavailable (${e instanceof Error ? e.name : "unknown"}) — allow the mic for this site and try again`,
        );
        setStatus("error");
        return "error";
      }

      const attempt = async (account: string): Promise<AvatarConnectResult> => {
        const tokenResult = await fetchAvatarToken(languageRef.current);
        if (tokenResult === "unavailable") return "unavailable";
        setPracticeCapSec(tokenResult.practiceCapSec);
        const ptt = tokenResult.interactivity === "PUSH_TO_TALK";
        pttRef.current = ptt;
        setIsAnswering(false);
        accountRef.current = account;
        historyRef.current = [];
        answerBufRef.current = "";

        // Start writing the opener NOW, in parallel with WebRTC setup — the
        // person shouldn't watch a silent face while the first line generates.
        logEvent("pre-generating opener…");
        const openerPromise = generateLine(true);

        // CONVERSATIONAL + muted-by-default: the working turn pipeline, with
        // the mic gated by the answer button (unmute → speak → mute). PTT mode
        // remains available via config for when their PTT pipeline works.
        const session = new LiveAvatarSession(tokenResult.token, {
          voiceChat: ptt ? { mode: SessionInteractivityMode.PUSH_TO_TALK } : { defaultMuted: true },
        });
        sessionRef.current = session;

        session.on(SessionEvent.SESSION_STREAM_READY, () => {
          streamReadyRef.current = true;
          logEvent("stream ready");
          const el = videoElRef.current;
          if (el) {
            session.attach(el);
            el.muted = false;
            void el.play().then(
              () => {
                if (el.muted) {
                  setNeedsSoundTap(true);
                  logEvent("audio blocked (muted) — needs sound tap");
                } else {
                  logEvent("playing with sound");
                }
              },
              () => {
                // Autoplay-with-sound refused: fall back to muted playback and
                // ask for one tap. Silent video is worse than an honest button.
                el.muted = true;
                void el.play().catch(() => undefined);
                setNeedsSoundTap(true);
                logEvent("audio blocked (autoplay) — needs sound tap");
              },
            );
          }
          setStatus("open");
        });
        // OWNED LOOP: once CONNECTED, WE generate the opener and the avatar
        // speaks it verbatim. We never hand a turn to their auto-voice loop
        // (it generates but never speaks user-triggered replies). Commands sent
        // before CONNECTED throw and tear the session down, so we wait for it.
        let openerDriven = false;
        session.on(SessionEvent.SESSION_STATE_CHANGED, (state) => {
          if (state !== SessionState.CONNECTED || openerDriven) return;
          openerDriven = true;
          void generateAndSpeakRef.current(true, openerPromise);
        });
        session.on(SessionEvent.SESSION_DISCONNECTED, () => {
          if (sessionRef.current !== session) return; // our own teardown
          tearDown();
          setStatus("closed");
        });
        session.on(AgentEventsEnum.SESSION_STOPPED, () => {
          if (sessionRef.current !== session) return;
          tearDown();
          setStatus("closed");
        });
        session.on(AgentEventsEnum.AVATAR_SPEAK_STARTED, () => {
          setAvatarSpeaking(true);
          logEvent("avatar speaking");
        });
        session.on(AgentEventsEnum.AVATAR_SPEAK_ENDED, () => {
          setAvatarSpeaking(false);
          logEvent("avatar finished");
        });
        // Chunks give the stop word its lowest latency; full transcriptions are
        // the safety net when a pipeline emits only one of the two.
        session.on(AgentEventsEnum.USER_TRANSCRIPTION_CHUNK, (e) => pushTranscript(e.text));
        session.on(AgentEventsEnum.USER_TRANSCRIPTION, (e) => {
          if (!e.text.startsWith(ACCOUNT_SENTINEL)) {
            logEvent(`heard you (${e.text.length} chars)`);
          }
          pushTranscript(e.text);
        });

        await session.start();
        return "open";
      };

      try {
        // "own" material only: shareable excerpts fetched by the AUTHENTICATED
        // client (RLS-scoped). The fictional story lives server-side — nothing
        // personal is read or sent on the standard tier.
        const account = material === "own" ? await buildAccountContext() : "";
        try {
          return await attempt(account);
        } catch {
          // One bounded retry: a fresh token + session covers transient start
          // failures (network blip, expired start window). No retry loops.
          tearDown();
          return await attempt(account);
        }
      } catch (e) {
        tearDown();
        setLastError(e instanceof Error ? `${e.name}: ${e.message}` : "Unknown failure");
        setStatus("error");
        return "error";
      }
    },
    [pushTranscript, tearDown, logEvent, generateLine],
  );

  /** Typed practice answers — text-or-voice everywhere. */
  const sendText = useCallback((text: string) => {
    const session = sessionRef.current;
    if (!session) return;
    const sig = transcriptTripRef.current.push(text);
    if (sig) {
      onDistressRef.current?.(sig);
      return; // a stop is a stop — don't also send it to the practice
    }
    // OWNED LOOP for typed turns too. session.message() hands the turn to
    // their auto-voice loop, which generates but never voices — typed answers
    // in avatar mode used to vanish into it without a reply.
    historyRef.current.push({ role: "user", text });
    void generateAndSpeakRef.current(false);
  }, []);

  const toggleMic = useCallback(async () => {
    const session = sessionRef.current;
    if (!session) return;
    try {
      if (session.voiceChat.isMuted) {
        await session.voiceChat.unmute();
        setMicMuted(false);
      } else {
        await session.voiceChat.mute();
        setMicMuted(true);
      }
    } catch {
      /* mic state unchanged */
    }
  }, []);

  /** Open the mic while the person answers (unmute, or PTT start). */
  const startAnswer = useCallback(async () => {
    const session = sessionRef.current;
    if (!session) return;
    try {
      if (session.voiceChat.state !== VoiceChatState.ACTIVE) {
        await session.voiceChat.start(
          pttRef.current ? { mode: SessionInteractivityMode.PUSH_TO_TALK } : { defaultMuted: true },
        );
        logEvent("voice chat started");
      }
      answerBufRef.current = ""; // fresh capture for this answer
      if (pttRef.current) {
        await session.voiceChat.startPushToTalk();
      } else {
        await session.voiceChat.unmute();
        // Explicit turn-bracketing: tell the agent the user has the floor.
        session.startListening();
      }
      setIsAnswering(true);
      logEvent("answer mic OPEN");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "could not open the mic";
      setLastError(`Answer failed: ${msg}`);
      logEvent(`answer FAILED: ${msg.slice(0, 60)}`);
    }
  }, [logEvent]);

  /** End the answer: release the floor, then mute after a grace period. */
  const endAnswer = useCallback(async () => {
    const session = sessionRef.current;
    if (!session) return;
    try {
      // Close the floor so their ASR stops (mechanism differs per mode).
      if (pttRef.current) {
        await session.voiceChat.stopPushToTalk();
      } else {
        session.stopListening();
        await session.voiceChat.mute();
      }
      logEvent("answer mic closed");
    } catch {
      /* already closed */
    }
    // OWNED LOOP in EVERY mode: their pipelines never voice a reply (the PTT
    // one never even calls the LLM), so the reply is always generated and
    // spoken by us. An empty answer still earns a line — during the 2026-07-14
    // incident the old silent no-op here read as "the avatar never responds".
    const answer = answerBufRef.current.trim();
    answerBufRef.current = "";
    if (answer) {
      historyRef.current.push({ role: "user", text: answer });
      logEvent(`your answer (${answer.length} chars)`);
    } else {
      logEvent("no answer captured — the questioner carries the turn");
    }
    void generateAndSpeak(false);
    setIsAnswering(false);
  }, [logEvent, generateAndSpeak]);

  /** One tap turns sound on when the browser refused autoplay with audio. */
  const enableSound = useCallback(() => {
    const el = videoElRef.current;
    if (!el) return;
    el.muted = false;
    void el.play().catch(() => undefined);
    setNeedsSoundTap(false);
    logEvent("sound enabled by tap");
  }, [logEvent]);

  useEffect(() => () => tearDown(), [tearDown]);

  return {
    status,
    avatarSpeaking,
    micMuted,
    practiceCapSec,
    lastError,
    pushToTalk,
    isAnswering,
    needsSoundTap,
    events,
    connect,
    disconnect,
    interrupt,
    attachVideo,
    sendText,
    toggleMic,
    startAnswer,
    endAnswer,
    enableSound,
  };
}
