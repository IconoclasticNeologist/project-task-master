import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { Card, CardContent } from "@/components/ui/card";
import { copy } from "@/lib/copy";
import { accessMode } from "@/lib/auth/config";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Welcome — The Advocate" },
      { name: "description", content: "A calm, private space — at your own pace." },
    ],
  }),
  component: WelcomeScreen,
});

function WelcomeScreen() {
  return (
    <Shell hideNav>
      <div className="flex flex-1 flex-col justify-between py-6">
        <div className="space-y-8 pt-12">
          <h1 className="text-3xl font-normal leading-tight tracking-tight">
            {copy.appName}.
          </h1>
          <p className="text-base leading-relaxed text-foreground">
            A quiet place. You set the pace. You can stop at any time.
          </p>
          <Card className="paper-shadow">
            <CardContent className="space-y-3 py-5 text-sm leading-relaxed text-muted-foreground">
              <p>You can talk or type.</p>
              <p>Nothing is recorded.</p>
              <p>Your words belong to you.</p>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-3 pb-4">
          <Link
            to={accessMode === "gated" ? "/enter" : "/onboarding"}
            className="block w-full rounded-md bg-primary px-4 py-3 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Begin
          </Link>
          <Link
            to="/home"
            className="block w-full rounded-md border border-border px-4 py-3 text-center text-sm text-muted-foreground hover:text-foreground"
          >
            I’ve been here before
          </Link>
        </div>
      </div>
    </Shell>
  );
}
