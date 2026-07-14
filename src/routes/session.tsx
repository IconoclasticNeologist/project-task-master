// The session surface — the demo's center and the product's soul.
//
// Choreography rules (structural, not persona goodwill):
//   - The Witness Stand is consent-gated EVERY time, before any practice
//     voice speaks. The person is told who they will hear, how to stop,
//     and that the Coach stays nearby.
//   - The stop word, the pause button, and the crisis tripwire all take the
//     same deterministic path: silence playback instantly (local), close the
//     connection, then signpost on screen who speaks next. No model round trip.
//   - A practice segment can never be the end of a session: every exit from
//     the Defense voice lands on the handoff screen, where the Coach either
//     returns (regulator mode) or the session closes with containment.
//   - The 8-minute practice cap is a visible, calm timer enforced in code,
//     with a hard backstop in the voice layer.

import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { requireSurvivor } from "@/lib/auth/guard";
import { Shell } from "@/components/Shell";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { VoiceOrb } from "@/components/session/VoiceOrb";
import { MicSetup } from "@/components/session/MicSetup";
import { PracticeTimer } from "@/components/session/PracticeTimer";
import { AftercareCard } from "@/components/AftercareCard";
import { HotlineLinks } from "@/components/CrisisCard";
import { copy } from "@/lib/copy";
import { useGeminiLive } from "@/lib/voice/useGeminiLive";
import { useLiveAvatarPractice } from "@/lib/voice/useLiveAvatarPractice";
import { makeCaptionStream } from "@/lib/voice/captions";
import {
  generateContainmentClose,
  requiresContainment,
  type SessionState,
} from "@/lib/agents/safety/containment";
import type { DistressSignal } from "@/lib/agents/safety/distress";
import { sendAgentTelemetry, type TelemetryAgent } from "@/lib/agents/telemetry";
import { useSurvivorSettings } from "@/lib/data/useSurvivorSettings";
import { pageTitle } from "@/lib/product";

export const Route = createFileRoute("/session")({
  beforeLoad: requireSurvivor,
  head: () => ({ meta: [{ title: pageTitle("Session") }] }),
  component: SessionScreen,
});

type ScreenMode = "voice" | "type";
type Stage = "start" | "consent" | "live" | "handoff" | "paused" | "closing";
type HandoffReason = "stopped" | "crisis" | "timer" | "dropped";
/** What is carrying the live audio/video right now. */
type Medium = "gemini" | "avatar";

// The person has to have SAID something substantive before a close is owed —
// a one-word reply to the greeting shouldn't trigger the containment ritual.
const HARD_MATERIAL_USER_CHARS = 80;

function SessionScreen() {
  const [stage, setStage] = useState<Stage>("start");
  const [screenMode, setScreenMode] = useState<ScreenMode>("voice");
  const [witnessStand, setWitnessStand] = useState(false);
  const [handoff, setHandoff] = useState<{ reason: HandoffReason; fromPractice: boolean } | null>(
    null,
  );
  const [composer, setComposer] = useState("");
  const [closing, setClosing] = useState<string | null>(null);
  const [connectFailed, setConnectFailed] = useState(false);
  const [medium, setMedium] = useState<Medium>("gemini");
  const [avatarFellBack, setAvatarFellBack] = useState(false);
  const [sessionState, setSessionState] = useState<SessionState>({
    hardMaterialTouched: false,
    aftercare: null,
    notableMoments: [],
  });

  // Refs mirror the state the long-lived voice callbacks need, so a distress
  // signal arriving between renders always sees the current stage.
  const stageRef = useRef(stage);
  const witnessRef = useRef(witnessStand);
  const mediumRef = useRef(medium);
  const micWasOnRef = useRef(false);
  const intentionalStopRef = useRef(false);
  const everOpenedRef = useRef(false);
  const userCharsRef = useRef(0);
  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);
  useEffect(() => {
    witnessRef.current = witnessStand;
  }, [witnessStand]);
  useEffect(() => {
    mediumRef.current = medium;
  }, [medium]);
  useEffect(() => {
    screenModeRef.current = screenMode;
  }, [screenMode]);

  const settings = useSurvivorSettings();
  useEffect(() => {
    const data = settings.query.data;
    if (data) {
      setSessionState((s) => ({
        ...s,
        aftercare: {
          supportPerson: data.supportPerson,
          calmingThing: data.calmingAnchor,
        },
      }));
    }
  }, [settings.query.data]);

  const markUserContent = useCallback((text: string) => {
    userCharsRef.current += text.length;
    if (userCharsRef.current >= HARD_MATERIAL_USER_CHARS) {
      setSessionState((s) => (s.hardMaterialTouched ? s : { ...s, hardMaterialTouched: true }));
    }
  }, []);

  // Both media route distress through this ref so the handler below can use
  // whichever hook is live without a use-before-declare cycle.
  const handleDistressRef = useRef<(sig: DistressSignal) => void>(() => {});

  // Ephemeral caption of the words being spoken right now — a rolling line so a
  // muted phone (or a person who can't play audio out loud) can still follow.
  // Never a transcript: capped, per-turn, wiped by the same local-first path
  // that silences playback.
  const captionsRef = useRef(makeCaptionStream());
  const [caption, setCaption] = useState("");

  // The CURRENT typed exchange only — what you sent, and the Coach's full
  // reply to it. Replaced on the next send, wiped with the captions. Still
  // never a transcript: one turn, in memory, gone on end/stop.
  const [typedTurn, setTypedTurn] = useState<{ you: string; coach: string } | null>(null);
  const screenModeRef = useRef<ScreenMode>("voice");

  const {
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
  } = useGeminiLive({
    mode: "base",
    language: settings.query.data?.language ?? "en",
    onUserText: markUserContent,
    onCoachText: (t) => {
      setCaption(captionsRef.current.push(t));
      // In Type mode the same words also build the full, readable reply.
      if (screenModeRef.current === "type") {
        setTypedTurn((turn) => (turn ? { ...turn, coach: turn.coach + t } : turn));
      }
    },
    onDistress: (sig) => handleDistressRef.current(sig),
  });

  const avatar = useLiveAvatarPractice({
    onUserText: markUserContent,
    // We author every practice line, so the caption is verbatim — shown under
    // the video so the question can be read as (or instead of) heard.
    onAvatarText: (t) => {
      captionsRef.current.clear();
      setCaption(t);
    },
    onDistress: (sig) => handleDistressRef.current(sig),
  });

  const activeModeRef = useRef(activeMode);
  useEffect(() => {
    activeModeRef.current = activeMode;
  }, [activeMode]);

  /** Which agent/medium the aggregate telemetry should attribute to, right now. */
  const telemetryTarget = (): { agent: TelemetryAgent; medium: "voice" | "avatar" } => ({
    agent: witnessRef.current ? "defense" : (activeModeRef.current as TelemetryAgent),
    medium: mediumRef.current === "avatar" ? "avatar" : "voice",
  });

  /** Silence and close whichever medium is carrying the session. Local-first. */
  const stopActiveMedia = () => {
    captionsRef.current.clear();
    setCaption("");
    setTypedTurn(null);
    if (mediumRef.current === "avatar") {
      avatar.interrupt();
      avatar.disconnect();
    } else {
      interrupt();
      disconnect();
    }
  };

  handleDistressRef.current = (sig: DistressSignal) => {
    if (!sig) return;
    if (stageRef.current !== "live") return; // one transition per signal
    // Deterministic first: silence and close, before any UI or model work.
    intentionalStopRef.current = true;
    micWasOnRef.current = micState === "on";
    stopActiveMedia();
    const t = telemetryTarget();
    sendAgentTelemetry(t.agent, t.medium, "tripwire_stops");
    setSessionState((s) => ({ ...s, hardMaterialTouched: true }));
    setHandoff({
      reason: sig.kind === "crisis" ? "crisis" : "stopped",
      fromPractice: witnessRef.current,
    });
    setStage("handoff");
  };

  useEffect(() => {
    if (status === "open") everOpenedRef.current = true;
  }, [status]);

  // A connection that drops on its own (network, idle timeout, backstop cap)
  // must never leave the person on a dead screen: offer the Coach back.
  useEffect(() => {
    if (stage !== "live" || medium !== "gemini") return;
    if (status !== "closed" && status !== "error") return;
    if (intentionalStopRef.current) return;
    if (!everOpenedRef.current) {
      // Never connected at all — go back to the start with a gentle note.
      setConnectFailed(true);
      setWitnessStand(false);
      setStage("start");
      return;
    }
    const t = telemetryTarget();
    sendAgentTelemetry(t.agent, t.medium, "errors");
    setHandoff({ reason: "dropped", fromPractice: witnessRef.current });
    setStage("handoff");
  }, [status, stage, medium]);

  // Same guarantee for the practice person: if its stream drops mid-practice
  // (network, LiveAvatar cap), land on the handoff with the Coach offered.
  useEffect(() => {
    if (stage !== "live" || medium !== "avatar") return;
    if (avatar.status !== "closed" && avatar.status !== "error") return;
    if (intentionalStopRef.current) return;
    sendAgentTelemetry("defense", "avatar", "errors");
    setHandoff({ reason: "dropped", fromPractice: true });
    setStage("handoff");
  }, [avatar.status, stage, medium]);

  useEffect(() => {
    return () => {
      disconnect();
      avatar.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetToStart = () => {
    setStage("start");
    setWitnessStand(false);
    setMedium("gemini");
    setAvatarFellBack(false);
    setHandoff(null);
    setClosing(null);
    setComposer("");
    userCharsRef.current = 0;
    setSessionState((s) => ({ ...s, hardMaterialTouched: false, notableMoments: [] }));
  };

  const beginBase = () => {
    intentionalStopRef.current = false;
    everOpenedRef.current = false;
    setConnectFailed(false);
    setWitnessStand(false);
    setMedium("gemini");
    setStage("live");
    void connect("base");
  };

  const beginPractice = async () => {
    intentionalStopRef.current = false;
    everOpenedRef.current = false;
    setConnectFailed(false);
    setWitnessStand(true);
    setAvatarFellBack(false);
    // Practice is heavy by definition: it always earns a containment close.
    setSessionState((s) => ({ ...s, hardMaterialTouched: true }));
    setStage("live");
    // The practice person (LiveAvatar) is the preferred medium; the voice-only
    // practice path is the automatic, quietly-noted fallback.
    setMedium("avatar");
    const result = await avatar.connect();
    if (result !== "open") {
      if (stageRef.current !== "live") return; // person already stopped/left
      setMedium("gemini");
      setAvatarFellBack(true);
      void connect("defense"); // backstop cap comes from the token payload
    }
  };

  const pauseFromLive = () => {
    intentionalStopRef.current = true;
    micWasOnRef.current = micState === "on";
    stopActiveMedia();
    if (witnessRef.current) {
      // A pause during practice ends the practice — the person never has to
      // step back in front of the practice voice to finish their session.
      setHandoff({ reason: "stopped", fromPractice: true });
      setStage("handoff");
    } else {
      setStage("paused");
    }
  };

  const finishSession = () => {
    intentionalStopRef.current = true;
    stopActiveMedia();
    const t = telemetryTarget();
    sendAgentTelemetry(t.agent, t.medium, "ended_clean");
    if (requiresContainment(sessionState)) {
      setClosing(generateContainmentClose(sessionState));
      setHandoff(null);
      setStage("closing");
    } else {
      resetToStart();
    }
  };

  const endFromLive = () => {
    if (witnessRef.current) {
      // Sessions never end in the Defense voice: route through the handoff.
      pauseFromLive();
    } else {
      finishSession();
    }
  };

  const continueWithCoach = () => {
    intentionalStopRef.current = false;
    everOpenedRef.current = false;
    setWitnessStand(false);
    setMedium("gemini"); // the Coach is always the still voice, never the avatar
    setHandoff(null);
    setStage("live");
    void connect("regulator");
    if (micWasOnRef.current) void enableMic();
  };

  const resumeFromBreak = () => {
    intentionalStopRef.current = false;
    everOpenedRef.current = false;
    setStage("live");
    void connect("base");
    if (micWasOnRef.current) void enableMic();
  };

  const onSendText = () => {
    if (!composer.trim()) return;
    const text = composer.trim();
    // A send starts a new model turn — the previous caption must not bleed
    // into the reply that answers this message.
    captionsRef.current.clear();
    setCaption("");
    if (mediumRef.current === "avatar") {
      avatar.sendText(text);
    } else {
      sendText(text);
    }
    setTypedTurn({ you: text, coach: "" });
    markUserContent(text);
    setSessionState((s) => ({
      ...s,
      notableMoments: [...s.notableMoments, text.slice(0, 80)],
    }));
    setComposer("");
  };

  const orbState: "idle" | "listening" | "speaking" = coachSpeaking
    ? "speaking"
    : micState === "on"
      ? "listening"
      : "idle";
  const personaLine = witnessStand
    ? copy.session.persona.practice
    : activeMode === "regulator"
      ? copy.session.persona.regulator
      : copy.session.persona.coach;
  const mediumConnecting =
    medium === "avatar" ? avatar.status === "connecting" : status === "connecting";
  const mediumOpen = medium === "avatar" ? avatar.status === "open" : status === "open";
  // Today's practice cap — null until the session mint actually reports it, so
  // the timer can never promise minutes the tier won't grant (audit P0-1). The
  // voice fallback's cap comes with its token, which has arrived by "open".
  const practiceCapKnownSec =
    medium === "avatar" ? avatar.practiceCapSec : mediumOpen ? caps.practiceSec : null;

  const sessionActive = stage === "live" || stage === "handoff" || stage === "paused";

  return (
    <Shell hideNav={sessionActive}>
      <div className="flex flex-1 flex-col gap-6">
        {stage === "closing" && closing && (
          <Card>
            <CardContent className="space-y-4 py-6">
              <h2 className="text-xl font-normal">{copy.session.closingTitle}</h2>
              <p className="leading-relaxed text-foreground">{closing}</p>
              <AftercareCard plan={sessionState.aftercare} title="Your care plan" />
              <button
                type="button"
                onClick={resetToStart}
                className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
              >
                Done
              </button>
            </CardContent>
          </Card>
        )}

        {stage === "start" && (
          <>
            <header>
              <h1 className="text-xl font-normal tracking-tight">{copy.session.title}</h1>
            </header>
            <Card>
              <CardContent className="space-y-3 py-6 text-center">
                <p className="text-base leading-relaxed text-foreground">
                  {copy.session.coachIntro}
                </p>
                {connectFailed && (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {copy.session.connectError}
                  </p>
                )}
                <button
                  type="button"
                  onClick={beginBase}
                  className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
                >
                  Begin
                  <span className="mt-0.5 block text-xs font-normal text-primary-foreground/85">
                    {copy.session.beginSubtitle}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setStage("consent")}
                  className="w-full rounded-md border border-border px-4 py-3 text-xs text-muted-foreground"
                >
                  Practice (Witness Stand)
                  <span className="mt-0.5 block text-xs text-muted-foreground/90">
                    {copy.session.practiceSubtitle}
                  </span>
                </button>
              </CardContent>
            </Card>
          </>
        )}

        {stage === "consent" && (
          <Card>
            <CardContent className="space-y-4 py-6">
              <h2 className="text-xl font-normal">{copy.session.witness.consentTitle}</h2>
              <p className="leading-relaxed text-foreground">{copy.session.witness.consentBody}</p>
              <ul className="space-y-2 text-sm leading-relaxed text-foreground">
                {copy.session.witness.consentPoints.map((point) => (
                  <li key={point} className="flex gap-2">
                    <span aria-hidden className="text-muted-foreground">
                      —
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={beginPractice}
                  className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
                >
                  {copy.session.witness.begin}
                </button>
                <button
                  type="button"
                  onClick={() => setStage("start")}
                  className="w-full rounded-md border border-border px-4 py-3 text-sm text-muted-foreground"
                >
                  {copy.session.witness.notNow}
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {stage === "live" && (
          <>
            <header className="flex items-center justify-between">
              <h1 className="text-xl font-normal tracking-tight">{copy.session.title}</h1>
              <div className="flex gap-1 rounded-md border border-border p-1 text-xs">
                {(["voice", "type"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setScreenMode(m)}
                    className={
                      screenMode === m
                        ? "rounded bg-foreground/10 px-2 py-1 text-foreground"
                        : "px-2 py-1 text-muted-foreground"
                    }
                  >
                    {m === "voice" ? copy.session.voice : copy.session.type}
                  </button>
                ))}
              </div>
            </header>

            <div className="flex flex-col items-center gap-4">
              {medium === "avatar" ? (
                <div className="w-full max-w-xs space-y-2">
                  {/* The practice person. Named plainly as not real — a design
                      choice, not a disclaimer: honesty lowers the startle. */}
                  <video
                    ref={avatar.attachVideo}
                    autoPlay
                    playsInline
                    className="paper-shadow-lg aspect-[3/4] w-full rounded-lg bg-secondary object-cover"
                  />
                  {avatar.needsSoundTap && (
                    <button
                      type="button"
                      onClick={avatar.enableSound}
                      className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
                    >
                      {copy.session.witness.soundOn}
                    </button>
                  )}
                  <p className="text-center text-xs leading-relaxed text-muted-foreground">
                    {copy.session.witness.avatarNote}
                  </p>
                </div>
              ) : (
                <VoiceOrb state={orbState} tone={witnessStand ? "practice" : "coach"} />
              )}
              <p className="text-center text-sm text-muted-foreground" role="status">
                {mediumConnecting ? "Connecting…" : personaLine}
              </p>
              {caption && (medium === "avatar" || screenMode === "voice") && (
                <p
                  aria-live="polite"
                  className="mx-auto max-w-md text-center text-sm leading-relaxed text-foreground/80"
                >
                  {caption}
                </p>
              )}
              {witnessStand && avatarFellBack && (
                <p className="text-center text-xs leading-relaxed text-muted-foreground">
                  {copy.session.witness.voiceFallback}
                </p>
              )}
              {witnessStand && (
                <PracticeTimer
                  capSec={practiceCapKnownSec}
                  mediaLive={mediumOpen}
                  onElapsed={() => {
                    if (stageRef.current !== "live") return;
                    intentionalStopRef.current = true;
                    micWasOnRef.current = micState === "on";
                    stopActiveMedia();
                    setHandoff({ reason: "timer", fromPractice: true });
                    setStage("handoff");
                  }}
                />
              )}
            </div>

            {medium === "avatar" ? (
              screenMode === "voice" &&
              (avatar.pushToTalk ? (
                <div className="mx-auto w-full max-w-xs space-y-2 text-center">
                  <button
                    type="button"
                    onClick={() =>
                      void (avatar.isAnswering ? avatar.endAnswer() : avatar.startAnswer())
                    }
                    className={
                      avatar.isAnswering
                        ? "w-full rounded-md bg-primary px-4 py-4 text-sm font-medium text-primary-foreground"
                        : "w-full rounded-md border border-border px-4 py-4 text-sm text-foreground"
                    }
                  >
                    {avatar.isAnswering
                      ? copy.session.witness.answerDone
                      : copy.session.witness.answer}
                  </button>
                  <p className="text-xs leading-relaxed text-muted-foreground" aria-live="polite">
                    {avatar.isAnswering
                      ? copy.session.witness.answering
                      : copy.session.witness.answerHint}
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => void avatar.toggleMic()}
                  className="mx-auto rounded-md border border-border px-4 py-2 text-sm text-muted-foreground"
                >
                  {avatar.micMuted ? copy.session.mic.unmute : copy.session.mic.mute}
                </button>
              ))
            ) : screenMode === "voice" ? (
              <MicSetup
                micState={micState}
                micLevel={micLevel}
                onEnable={enableMic}
                onMute={disableMic}
                onUseTyping={() => setScreenMode("type")}
              />
            ) : null}
            {screenMode === "type" && (
              <Card>
                <CardContent className="space-y-3 py-4">
                  {typedTurn && medium !== "avatar" && (
                    <div aria-live="polite" className="space-y-2 border-b border-border pb-3">
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        <span className="font-medium">{copy.session.youSaid}: </span>
                        {typedTurn.you}
                      </p>
                      {typedTurn.coach && (
                        <p className="text-sm leading-relaxed text-foreground">{typedTurn.coach}</p>
                      )}
                    </div>
                  )}
                  <Textarea
                    value={composer}
                    onChange={(e) => setComposer(e.target.value)}
                    placeholder={copy.session.typePlaceholder}
                    className="min-h-24"
                  />
                  <button
                    type="button"
                    onClick={onSendText}
                    className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
                  >
                    {copy.session.send}
                  </button>
                </CardContent>
              </Card>
            )}

            <div className="mt-auto flex flex-col gap-2">
              <button
                type="button"
                onClick={pauseFromLive}
                className="w-full rounded-md border border-border px-4 py-3 text-sm text-foreground"
              >
                {copy.session.pause}
              </button>
              <button
                type="button"
                onClick={endFromLive}
                className="w-full rounded-md border border-border px-4 py-3 text-sm text-muted-foreground"
              >
                {copy.session.end}
              </button>
            </div>
          </>
        )}

        {stage === "handoff" && handoff && (
          <Card>
            <CardContent className="space-y-4 py-6">
              <h2 className="text-xl font-normal">
                {handoff.reason === "crisis"
                  ? copy.safety.crisisTitle
                  : handoff.reason === "timer"
                    ? copy.session.witness.capReached
                    : handoff.reason === "dropped"
                      ? copy.safety.droppedTitle
                      : copy.safety.stoppedTitle}
              </h2>
              <p className="leading-relaxed text-foreground">
                {handoff.reason === "crisis"
                  ? copy.safety.crisisBody
                  : handoff.reason === "dropped"
                    ? copy.safety.droppedBody
                    : handoff.fromPractice
                      ? copy.safety.practiceOver
                      : copy.safety.coachStepsIn}
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {copy.safety.takeABreath}
              </p>
              {handoff.reason === "crisis" && <HotlineLinks />}
              <AftercareCard plan={sessionState.aftercare} title="Your care plan" />
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={continueWithCoach}
                  className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
                >
                  {copy.safety.continueWithCoach}
                </button>
                <button
                  type="button"
                  onClick={finishSession}
                  className="w-full rounded-md border border-border px-4 py-3 text-sm text-muted-foreground"
                >
                  {copy.session.end}
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {stage === "paused" && (
          <Card>
            <CardContent className="space-y-4 py-6">
              <h2 className="text-xl font-normal">{copy.safety.breakTitle}</h2>
              <p className="leading-relaxed text-foreground">{copy.safety.breakBody}</p>
              <AftercareCard plan={sessionState.aftercare} title="Your care plan" />
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={resumeFromBreak}
                  className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
                >
                  {copy.safety.resume}
                </button>
                <button
                  type="button"
                  onClick={finishSession}
                  className="w-full rounded-md border border-border px-4 py-3 text-sm text-muted-foreground"
                >
                  {copy.session.end}
                </button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Shell>
  );
}
