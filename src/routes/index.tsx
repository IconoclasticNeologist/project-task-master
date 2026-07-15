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
  return (
    <Shell hideNav>
      <div className="flex flex-1 flex-col justify-between py-6">
        <div className="space-y-8 pt-12 welcome-tight">
          <h1 className="text-3xl font-normal leading-tight tracking-tight">{copy.appName}.</h1>
          <p className="text-base leading-relaxed text-foreground">
            A quiet place. You set the pace. You can stop at any time.
          </p>
          <Card className="paper-shadow">
            <CardContent className="space-y-3 py-5 text-sm leading-relaxed text-muted-foreground">
              <p>You can talk or type.</p>
              <p>You choose what to save.</p>
              <p>Your words belong to you.</p>
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
              Begin
            </Link>
            {selfServeEnabled && accessMode === "gated" && (
              <Link
                to="/enter"
                className="block w-full rounded-md border border-border px-4 py-3 text-center text-sm text-muted-foreground hover:text-foreground"
              >
                {copy.begin.haveCodeLink}
              </Link>
            )}
            <Link
              to="/home"
              className="block w-full rounded-md border border-border px-4 py-3 text-center text-sm text-muted-foreground hover:text-foreground"
            >
              I’ve been here before
            </Link>
            <Link
              to="/recover"
              className="block w-full rounded-md border border-border px-4 py-3 text-center text-sm text-muted-foreground hover:text-foreground"
            >
              {copy.recovery.entryLink}
            </Link>
            <Link
              to="/tour"
              className="block w-full rounded-md border border-border px-4 py-3 text-center text-sm text-muted-foreground hover:text-foreground"
            >
              <span className="flex items-center justify-center gap-1.5">
                <Play className="h-3.5 w-3.5" aria-hidden strokeWidth={2} />
                {copy.begin.tourCta}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {copy.begin.tourCtaSub}
              </span>
            </Link>
            <Link
              to="/resources"
              className="block w-full px-4 py-2 text-center text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
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
