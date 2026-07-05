// HeyGen LiveAvatar client hook for the Witness Stand practice person.
//
// PATTERN: mirrors useGeminiLive's surface (status / connect / disconnect /
// interrupt) so the session screen choreographs both media the same way.
//
// The avatar is OPT-IN and Witness-Stand-only. Its only brain is our
// RAG-locked shim (advocate-defense-llm) — registered server-side with
// LiveAvatar, selected by advocate-avatar-session when the token is minted.
// The person's SHAREABLE-only statements ride into the session as a
// sentinel-prefixed first message, which the shim lifts into source
// material; the avatar can only ask about what the person already said.
//
// SAFETY INVARIANTS:
//   - No LiveAvatar API key in the browser — only a session-scoped token.
//   - interrupt() is local-first: the media element is muted synchronously,
//     then the network interrupt/stop follows. A stop word cuts the voice
//     mid-word without waiting on anything.
//   - The deterministic tripwire runs on the person's live transcription
//     (chunk events for low latency, full events as the safety net).
//   - No transcript array is kept; fragments flow through the rolling window.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AgentEventsEnum,
  LiveAvatarSession,
  SessionEvent,
  SessionInteractivityMode,
  SessionState,
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
  onDistress?: (sig: DistressSignal) => void;
}

async function fetchAvatarToken(): Promise<
  | {
      token: string;
      practiceCapSec: number | null;
      interactivity: "PUSH_TO_TALK" | "CONVERSATIONAL";
    }
  | "unavailable"
> {
  const supabase = getSupabase();
  const { data, error } = await supabase.functions.invoke<{
    token: string;
    practiceCapSec?: number;
    interactivity?: string;
  }>("advocate-avatar-session", { body: {} });
  if (error || !data?.token) {
    // 503 = deliberately unconfigured → the caller falls back to voice-only.
    return "unavailable";
  }
  return {
    token: data.token,
    practiceCapSec: data.practiceCapSec ?? null,
    interactivity: data.interactivity === "CONVERSATIONAL" ? "CONVERSATIONAL" : "PUSH_TO_TALK",
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
  // PUSH_TO_TALK: the mic transmits only while the person holds "answer".
  const [pushToTalk, setPushToTalk] = useState(true);
  const [isAnswering, setIsAnswering] = useState(false);

  const sessionRef = useRef<LiveAvatarSession | null>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const streamReadyRef = useRef(false);
  const transcriptTripRef = useRef(makeTranscriptTripwire());

  const onUserTextRef = useRef(opts.onUserText);
  const onDistressRef = useRef(opts.onDistress);
  useEffect(() => {
    onUserTextRef.current = opts.onUserText;
    onDistressRef.current = opts.onDistress;
  }, [opts.onUserText, opts.onDistress]);

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
    onUserTextRef.current?.(text);
    const sig = transcriptTripRef.current.push(text);
    if (sig) onDistressRef.current?.(sig);
  }, []);

  const connect = useCallback(async (): Promise<AvatarConnectResult> => {
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
      const tokenResult = await fetchAvatarToken();
      if (tokenResult === "unavailable") return "unavailable";
      setPracticeCapSec(tokenResult.practiceCapSec);
      const ptt = tokenResult.interactivity === "PUSH_TO_TALK";
      setPushToTalk(ptt);
      setIsAnswering(false);

      const session = new LiveAvatarSession(tokenResult.token, {
        voiceChat: ptt ? { mode: SessionInteractivityMode.PUSH_TO_TALK } : { defaultMuted: false },
      });
      sessionRef.current = session;

      session.on(SessionEvent.SESSION_STREAM_READY, () => {
        streamReadyRef.current = true;
        if (videoElRef.current) {
          videoElRef.current.muted = false;
          session.attach(videoElRef.current);
        }
        setStatus("open");
      });
      // Hand the practice its source material only once the session state
      // machine is CONNECTED — commands sent at STREAM_READY throw ("Session
      // needs to be connected") and the throw tears the session down. The
      // try/catch is belt-and-braces: context delivery may never kill video.
      let contextSent = false;
      session.on(SessionEvent.SESSION_STATE_CHANGED, (state) => {
        if (state !== SessionState.CONNECTED || contextSent) return;
        contextSent = true;
        try {
          session.message(`${ACCOUNT_SENTINEL}\n${account}`);
        } catch {
          /* the shim then sees no context and asks warm-up questions only */
        }
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
      session.on(AgentEventsEnum.AVATAR_SPEAK_STARTED, () => setAvatarSpeaking(true));
      session.on(AgentEventsEnum.AVATAR_SPEAK_ENDED, () => setAvatarSpeaking(false));
      // Chunks give the stop word its lowest latency; full transcriptions are
      // the safety net when a pipeline emits only one of the two.
      session.on(AgentEventsEnum.USER_TRANSCRIPTION_CHUNK, (e) => pushTranscript(e.text));
      session.on(AgentEventsEnum.USER_TRANSCRIPTION, (e) => pushTranscript(e.text));

      await session.start();
      return "open";
    };

    try {
      // Account context is fetched by the AUTHENTICATED client (RLS-scoped).
      const account = await buildAccountContext();
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
  }, [pushTranscript, tearDown]);

  /** Typed practice answers — text-or-voice everywhere. */
  const sendText = useCallback((text: string) => {
    const session = sessionRef.current;
    if (!session) return;
    const sig = transcriptTripRef.current.push(text);
    if (sig) {
      onDistressRef.current?.(sig);
      return; // a stop is a stop — don't also send it to the practice
    }
    try {
      session.message(text);
    } catch {
      /* not connected yet — dropping a turn beats crashing the session */
    }
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

  /** PUSH_TO_TALK: open the mic while the person answers. */
  const startAnswer = useCallback(async () => {
    const session = sessionRef.current;
    if (!session) return;
    try {
      await session.voiceChat.startPushToTalk();
      setIsAnswering(true);
    } catch {
      /* stays closed — the person can try again */
    }
  }, []);

  /** PUSH_TO_TALK: close the mic; their side finalizes the utterance. */
  const endAnswer = useCallback(async () => {
    const session = sessionRef.current;
    if (!session) return;
    try {
      await session.voiceChat.stopPushToTalk();
    } catch {
      /* already closed */
    }
    setIsAnswering(false);
  }, []);

  useEffect(() => () => tearDown(), [tearDown]);

  return {
    status,
    avatarSpeaking,
    micMuted,
    practiceCapSec,
    lastError,
    pushToTalk,
    isAnswering,
    connect,
    disconnect,
    interrupt,
    attachVideo,
    sendText,
    toggleMic,
    startAnswer,
    endAnswer,
  };
}
