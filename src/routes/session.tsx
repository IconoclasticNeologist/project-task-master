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
import { PlaceholderTag } from "@/components/PlaceholderTag";
import { copy } from "@/lib/copy";
import { useGeminiLive } from "@/lib/voice/useGeminiLive";
import {
  generateContainmentClose,
  requiresContainment,
  type SessionState,
} from "@/lib/agents/safety/containment";
import type { DistressSignal } from "@/lib/agents/safety/distress";
import { ADVOCATE_VOICE_CONFIG } from "@/lib/voice/config";
import { useSurvivorSettings } from "@/lib/data/useSurvivorSettings";

export const Route = createFileRoute("/session")({
  beforeLoad: requireSurvivor,
  head: () => ({ meta: [{ title: "Session — The Advocate" }] }),
  component: SessionScreen,
});

type ScreenMode = "voice" | "type";
type Stage = "start" | "consent" | "live" | "handoff" | "paused" | "closing";
type HandoffReason = "stopped" | "crisis" | "timer" | "dropped";

const PRACTICE_CAP_SEC = ADVOCATE_VOICE_CONFIG.caps.witnessStandMaxDurationSec;
// The person has to have SAID something substantive before a close is owed —
// a one-word reply to the greeting shouldn't trigger the containment ritual.
const HARD_MATERIAL_USER_CHARS = 80;

function HotlineLinks() {
  return (
    <div className="space-y-2">
      {copy.resources.crisis.map((entry) => {
        const dial = entry.number.replace(/[^0-9]/g, "");
        return (
          <div key={entry.name} className="rounded-md border border-border px-3 py-2">
            <p className="text-sm text-foreground">{entry.name}</p>
            <a
              href={`tel:${dial}`}
              className="text-base font-medium text-foreground underline underline-offset-2"
            >
              {entry.number}
            </a>
            <p className="text-xs text-muted-foreground">{entry.hours}</p>
          </div>
        );
      })}
    </div>
  );
}

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
  const [sessionState, setSessionState] = useState<SessionState>({
    hardMaterialTouched: false,
    aftercare: null,
    notableMoments: [],
  });

  // Refs mirror the state the long-lived voice callbacks need, so a distress
  // signal arriving between renders always sees the current stage.
  const stageRef = useRef(stage);
  const witnessRef = useRef(witnessStand);
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

  const {
    status,
    micState,
    coachSpeaking,
    micLevel,
    activeMode,
    connect,
    disconnect,
    interrupt,
    enableMic,
    disableMic,
    sendText,
  } = useGeminiLive({
    mode: "base",
    onUserText: markUserContent,
    onDistress: (sig: DistressSignal) => {
      if (!sig) return;
      if (stageRef.current !== "live") return; // one transition per signal
      // Deterministic first: silence and close, before any UI or model work.
      intentionalStopRef.current = true;
      micWasOnRef.current = micState === "on";
      interrupt();
      disconnect();
      setSessionState((s) => ({ ...s, hardMaterialTouched: true }));
      setHandoff({
        reason: sig.kind === "crisis" ? "crisis" : "stopped",
        fromPractice: witnessRef.current,
      });
      setStage("handoff");
    },
  });

  useEffect(() => {
    if (status === "open") everOpenedRef.current = true;
  }, [status]);

  // A connection that drops on its own (network, idle timeout, backstop cap)
  // must never leave the person on a dead screen: offer the Coach back.
  useEffect(() => {
    if (stage !== "live") return;
    if (status !== "closed" && status !== "error") return;
    if (intentionalStopRef.current) return;
    if (!everOpenedRef.current) {
      // Never connected at all — go back to the start with a gentle note.
      setConnectFailed(true);
      setWitnessStand(false);
      setStage("start");
      return;
    }
    setHandoff({ reason: "dropped", fromPractice: witnessRef.current });
    setStage("handoff");
  }, [status, stage]);

  useEffect(() => {
    return () => disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetToStart = () => {
    setStage("start");
    setWitnessStand(false);
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
    setStage("live");
    void connect("base");
  };

  const beginPractice = () => {
    intentionalStopRef.current = false;
    everOpenedRef.current = false;
    setConnectFailed(false);
    setWitnessStand(true);
    // Practice is heavy by definition: it always earns a containment close.
    setSessionState((s) => ({ ...s, hardMaterialTouched: true }));
    setStage("live");
    void connect("defense", { maxDurationSec: PRACTICE_CAP_SEC + 15 });
  };

  const pauseFromLive = () => {
    intentionalStopRef.current = true;
    micWasOnRef.current = micState === "on";
    interrupt();
    disconnect();
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
    interrupt();
    disconnect();
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
    sendText(text);
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
                </button>
                <button
                  type="button"
                  onClick={() => setStage("consent")}
                  className="w-full rounded-md border border-border px-4 py-3 text-xs text-muted-foreground"
                >
                  Practice (Witness Stand)
                </button>
              </CardContent>
            </Card>
          </>
        )}

        {stage === "consent" && (
          <Card>
            <CardContent className="space-y-4 py-6">
              <h2 className="text-xl font-normal">
                {copy.session.witness.consentTitle}
                <PlaceholderTag />
              </h2>
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
              <VoiceOrb state={orbState} tone={witnessStand ? "practice" : "coach"} />
              <p className="text-center text-sm text-muted-foreground" role="status">
                {status === "connecting" ? "Connecting…" : personaLine}
              </p>
              {witnessStand && (
                <PracticeTimer
                  totalSec={PRACTICE_CAP_SEC}
                  running={status === "open"}
                  onElapsed={() => {
                    if (stageRef.current !== "live") return;
                    intentionalStopRef.current = true;
                    micWasOnRef.current = micState === "on";
                    interrupt();
                    disconnect();
                    setHandoff({ reason: "timer", fromPractice: true });
                    setStage("handoff");
                  }}
                />
              )}
            </div>

            {screenMode === "voice" ? (
              <MicSetup
                micState={micState}
                micLevel={micLevel}
                onEnable={enableMic}
                onMute={disableMic}
                onUseTyping={() => setScreenMode("type")}
              />
            ) : (
              <Card>
                <CardContent className="space-y-3 py-4">
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
                    : copy.safety.stoppedTitle}
              </h2>
              <p className="leading-relaxed text-foreground">
                {handoff.reason === "crisis"
                  ? copy.safety.crisisBody
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
