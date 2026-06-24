import { useState } from "react";
import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { requireSurvivor } from "@/lib/auth/guard";
import { getSurvivor } from "@/lib/auth/session";
import { saveAftercare, markOnboarded } from "@/lib/data/settings";
import { Shell } from "@/components/Shell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProgressDots } from "@/components/ProgressDots";
import { copy } from "@/lib/copy";

export const Route = createFileRoute("/onboarding")({
  beforeLoad: async () => {
    await requireSurvivor();            // A's guard: SSR-skip, redirect to "/" on clean no-survivor, no eviction on transient error
    if (typeof document === "undefined") return;
    const survivor = await getSurvivor().catch(() => null);
    if (survivor?.onboarded_at) {
      throw redirect({ to: "/home" });  // already onboarded → skip the emotional flow
    }
  },
  head: () => ({ meta: [{ title: "Begin — The Advocate" }] }),
  component: OnboardingScreen,
});

const STEPS = ["welcome", "feelings", "care", "aftercare", "how", "rules"] as const;

function OnboardingScreen() {
  const navigate = useNavigate();
  const [stepIdx, setStepIdx] = useState(0);
  const [supportPerson, setSupportPerson] = useState("");
  const [calmingThing, setCalmingThing] = useState("");

  const step = STEPS[stepIdx];
  const next = () => {
    if (stepIdx === STEPS.length - 1) {
      void markOnboarded();
      void navigate({ to: "/home" });
      return;
    }
    setStepIdx((i) => i + 1);
  };
  const back = () => setStepIdx((i) => Math.max(0, i - 1));

  let body: { title: string; copy: string; cta: string; node?: React.ReactNode };
  let extra: React.ReactNode = null;

  switch (step) {
    case "welcome":
      body = { title: copy.onboarding.welcome.title, copy: copy.onboarding.welcome.body, cta: copy.onboarding.welcome.cta };
      extra = (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {copy.onboarding.emergencyNote}
        </p>
      );
      break;
    case "feelings":
      body = { title: copy.onboarding.feelings.title, copy: copy.onboarding.feelings.body, cta: copy.onboarding.feelings.cta };
      break;
    case "care":
      body = { title: copy.onboarding.care.title, copy: copy.onboarding.care.body, cta: copy.onboarding.care.cta };
      break;
    case "aftercare":
      body = { title: copy.onboarding.aftercare.title, copy: copy.onboarding.aftercare.body, cta: copy.onboarding.aftercare.cta };
      extra = (
        <Card>
          <CardContent className="space-y-4 py-5">
            <div className="space-y-2">
              <Label htmlFor="sp" className="text-xs uppercase tracking-wide text-muted-foreground">
                {copy.onboarding.aftercare.supportLabel}
              </Label>
              <Input
                id="sp"
                value={supportPerson}
                onChange={(e) => setSupportPerson(e.target.value)}
                placeholder={copy.onboarding.aftercare.supportPlaceholder}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ct" className="text-xs uppercase tracking-wide text-muted-foreground">
                {copy.onboarding.aftercare.calmLabel}
              </Label>
              <Input
                id="ct"
                value={calmingThing}
                onChange={(e) => setCalmingThing(e.target.value)}
                placeholder={copy.onboarding.aftercare.calmPlaceholder}
              />
            </div>
          </CardContent>
        </Card>
      );
      break;
    case "how":
      body = { title: copy.onboarding.how.title, copy: copy.onboarding.how.body, cta: copy.onboarding.how.cta };
      break;
    case "rules":
      body = { title: copy.onboarding.rules.title, copy: copy.onboarding.rules.body, cta: copy.onboarding.rules.cta };
      break;
  }

  const onCta = () => {
    if (step === "aftercare") void saveAftercare({ supportPerson, calmingAnchor: calmingThing }).catch(() => {});
    next();
  };

  return (
    <Shell hideNav>
      <div className="flex flex-1 flex-col justify-between gap-8 py-6">
        <div className="space-y-6 pt-6">
          <ProgressDots step={stepIdx} total={STEPS.length} />
          <h1 className="text-2xl font-normal leading-snug tracking-tight">{body.title}</h1>
          <p className="text-base leading-relaxed text-foreground">{body.copy}</p>
          {extra}
        </div>
        <div className="space-y-3">
          <button
            type="button"
            onClick={onCta}
            className="block w-full rounded-md bg-primary px-4 py-3 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {body.cta}
          </button>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={back}
              disabled={stepIdx === 0}
              className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-40"
            >
              Back
            </button>
            <button
              type="button"
              onClick={next}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    </Shell>
  );
}
