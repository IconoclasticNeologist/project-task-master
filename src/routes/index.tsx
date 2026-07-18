import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { Shell } from "@/components/Shell";
import { Card, CardContent } from "@/components/ui/card";
import { ReviewerFooter } from "@/components/ReviewerFooter";
import { copy } from "@/lib/copy";
import { accessMode, selfServeEnabled } from "@/lib/auth/config";
import { pageTitle } from "@/lib/product";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: pageTitle("Welcome") },
      { name: "description", content: "A calm, private space — at your own pace." },
    ],
  }),
  component: WelcomeScreen,
});

function WelcomeScreen() {
  // "Coming back?" folds the two returning paths (same device / recovery
  // words) behind one quiet door — first-time visitors see one primary
  // action and two clearly-named choices, nothing that needs explaining.
  const [returning, setReturning] = useState(false);
  return (
    <Shell hideNav judgesLink>
      <div className="flex flex-1 flex-col justify-between gap-10 py-6">
        <div className="space-y-8 pt-6 welcome-tight">
          {/* Demo button at the very top — owner-requested, judge-facing. A real
              button, above the fold, linking the interactive tour. */}
          {/* Deep warm amber — the one non-sage control on the page, so a
              reviewer's eye lands here first. From the paper palette's ochre
              family; calm, not alarm. Text/fill pass AA. */}
          <Link
            to="/tour"
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[oklch(0.5_0.09_70)] px-4 py-3 text-center text-sm font-medium text-[oklch(0.985_0.01_85)] paper-shadow hover:bg-[oklch(0.45_0.09_70)]"
          >
            <Play className="h-4 w-4" aria-hidden strokeWidth={2} fill="currentColor" />
            {copy.begin.demoButton}
          </Link>
          {/* The written pitch + reviewer tools — visible from the front door
              (owner call: nobody finds /judges by guessing). */}
          <Link
            to="/judges"
            className="-mt-4 block w-full rounded-md border border-border px-4 py-2.5 text-center text-sm text-muted-foreground hover:text-foreground"
          >
            {copy.begin.judgesButton}
          </Link>
          <h1 className="text-3xl font-normal leading-tight tracking-tight">{copy.appName}.</h1>
          <p className="text-base leading-relaxed text-foreground">{copy.begin.welcomeTagline}</p>
          <Card className="paper-shadow">
            <CardContent className="space-y-3 py-5 text-sm leading-relaxed text-muted-foreground">
              {copy.begin.welcomePoints.map((point) => (
                <p key={point}>{point}</p>
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="pb-4">
          <div className="space-y-3">
            {/* A person who found this on their own needs no code — the primary
                door is self-serve. Code-holders were sent by someone who can
                also tell them which button to press. */}
            <Link
              to={selfServeEnabled ? "/begin" : accessMode === "gated" ? "/enter" : "/onboarding"}
              className="block w-full rounded-md bg-primary px-4 py-3 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {copy.begin.beginCta}
            </Link>
            {selfServeEnabled && accessMode === "gated" && (
              <Link
                to="/enter"
                className="block w-full rounded-md border border-border px-4 py-3 text-center text-sm text-muted-foreground hover:text-foreground"
              >
                {copy.begin.haveCodeLink}
              </Link>
            )}
            {!returning ? (
              <button
                type="button"
                onClick={() => setReturning(true)}
                className="block w-full rounded-md border border-border px-4 py-3 text-center text-sm text-muted-foreground hover:text-foreground"
              >
                {copy.begin.comingBack}
              </button>
            ) : (
              <div className="space-y-3 rounded-md border border-border p-3">
                <Link
                  to="/home"
                  className="block w-full rounded-md border border-border px-4 py-3 text-center text-sm text-muted-foreground hover:text-foreground"
                >
                  {copy.begin.openOnDevice}
                </Link>
                <Link
                  to="/recover"
                  className="block w-full rounded-md border border-border px-4 py-3 text-center text-sm text-muted-foreground hover:text-foreground"
                >
                  {copy.recovery.entryLink}
                </Link>
              </div>
            )}
            <Link
              to="/resources"
              className="block w-full rounded-md border border-border px-4 py-3 text-center text-sm text-foreground hover:bg-secondary/40"
            >
              {copy.begin.welcomeSupport}
            </Link>
          </div>
          {/* Reviewer-only wayfinding, framed so a survivor reads past it. */}
          <ReviewerFooter lead="Reviewing this project?" />
        </div>
      </div>
    </Shell>
  );
}
