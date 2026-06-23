import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { requireSurvivor } from "@/lib/auth/guard";
import { Shell } from "@/components/Shell";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { VoiceOrb } from "@/components/session/VoiceOrb";
import { MicSetup } from "@/components/session/MicSetup";
import { AftercareCard } from "@/components/AftercareCard";
import { copy } from "@/lib/copy";
import { useGeminiLive } from "@/lib/voice/useGeminiLive";
import {
  generateContainmentClose,
  requiresContainment,
  type SessionState,
} from "@/lib/agents/safety/containment";
import type { DistressSignal } from "@/lib/agents/safety/distress";
import type { CoachMode } from "@/lib/agents/coach";
import { ADVOCATE_VOICE_CONFIG } from "@/lib/voice/config";
import { useSurvivorSettings } from "@/lib/data/useSurvivorSettings";

export const Route = createFileRoute("/session")({
  beforeLoad: requireSurvivor,
  head: () => ({ meta: [{ title: "Session — The Advocate" }] }),
  component: SessionScreen,
});

type ScreenMode = "voice" | "type";

function SessionScreen() {
  const [screenMode, setScreenMode] = useState<ScreenMode>("voice");
  const [coachMode, setCoachMode] = useState<CoachMode>("base");
  const [composer, setComposer] = useState("");
  const [closing, setClosing] = useState<string | null>(null);
  const [distress, setDistress] = useState<DistressSignal>(null);
  const [sessionState, setSessionState] = useState<SessionState>({
    hardMaterialTouched: false,
    aftercare: null,
    notableMoments: [],
  });
  const [witnessStand, setWitnessStand] = useState(false);

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

  const { status, micState, coachSpeaking, micLevel, connect, disconnect, enableMic, disableMic, sendText } =
    useGeminiLive({
      mode: coachMode,
      maxDurationSec: witnessStand
        ? ADVOCATE_VOICE_CONFIG.caps.witnessStandMaxDurationSec
        : undefined,
      onCoachText: (text) => {
        setSessionState((s) =>
          text.length > 40 ? { ...s, hardMaterialTouched: true } : s,
        );
      },
      onDistress: (sig) => {
        setDistress(sig);
        setCoachMode("regulator");
        setSessionState((s) => ({ ...s, hardMaterialTouched: true }));
      },
    });

  useEffect(() => {
    return () => disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const endSession = () => {
    if (requiresContainment(sessionState)) {
      setClosing(generateContainmentClose(sessionState));
    }
    disconnect();
  };

  const onSendText = () => {
    if (!composer.trim()) return;
    sendText(composer.trim());
    setSessionState((s) => ({
      ...s,
      notableMoments: [...s.notableMoments, composer.trim().slice(0, 80)],
    }));
    setComposer("");
  };

  const orbState: "idle" | "listening" | "speaking" =
    coachSpeaking ? "speaking" : micState === "on" ? "listening" : "idle";

  return (
    <Shell hideNav={status === "open"}>
      <div className="flex flex-1 flex-col gap-6">
        {/* Closing / containment overlay — wins over the rest */}
        {closing ? (
          <Card>
            <CardContent className="space-y-4 py-6">
              <h2 className="text-xl font-normal">{copy.session.closingTitle}</h2>
              <p className="leading-relaxed text-foreground">{closing}</p>
              <AftercareCard plan={sessionState.aftercare} title="Your care plan" />
              <button
                type="button"
                onClick={() => {
                  setClosing(null);
                  setSessionState((s) => ({ ...s, hardMaterialTouched: false, notableMoments: [] }));
                }}
                className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
              >
                Done
              </button>
            </CardContent>
          </Card>
        ) : (
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

            {status === "idle" || status === "closed" ? (
              <Card>
                <CardContent className="space-y-3 py-6 text-center">
                  <p className="text-base leading-relaxed text-foreground">{copy.session.coachIntro}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setCoachMode("base");
                      setWitnessStand(false);
                      void connect();
                    }}
                    className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
                  >
                    Begin
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCoachMode("defense");
                      setWitnessStand(true);
                      void connect();
                    }}
                    className="w-full rounded-md border border-border px-4 py-3 text-xs text-muted-foreground"
                  >
                    Practice (Witness Stand)
                  </button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex flex-col items-center gap-4">
                  <VoiceOrb state={orbState} />
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {status === "connecting" ? "Connecting…" : orbState}
                    {witnessStand && " · practice"}
                  </p>
                </div>

                {distress && (
                  <Card>
                    <CardContent className="space-y-3 py-4">
                      <p className="text-sm leading-relaxed text-foreground">{copy.safety.tripwireDetected}</p>
                      <AftercareCard plan={sessionState.aftercare} title="Your care plan" />
                      <button
                        type="button"
                        onClick={() => setDistress(null)}
                        className="rounded-md border border-border px-3 py-2 text-xs text-muted-foreground"
                      >
                        Continue when ready
                      </button>
                    </CardContent>
                  </Card>
                )}

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

                <button
                  type="button"
                  onClick={endSession}
                  className="mt-auto w-full rounded-md border border-destructive/40 px-4 py-3 text-sm text-destructive"
                >
                  {copy.session.stop}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </Shell>
  );
}
