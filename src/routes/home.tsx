import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { Card, CardContent } from "@/components/ui/card";
import { copy } from "@/lib/copy";
import { loadAftercare } from "@/lib/data/local-store";
import { AftercareCard } from "@/components/AftercareCard";

export const Route = createFileRoute("/home")({
  head: () => ({ meta: [{ title: "Home — The Advocate" }] }),
  component: HomeScreen,
});

function HomeScreen() {
  const plan = typeof window !== "undefined" ? loadAftercare() : null;
  return (
    <Shell>
      <div className="space-y-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-normal tracking-tight">{copy.home.title}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{copy.home.subtitle}</p>
        </header>

        <div className="grid grid-cols-1 gap-4">
          <Tile to="/session" label={copy.home.startSession} hint="Talk or type. At your pace." />
          <Tile to="/account" label={copy.home.continueWhereLeft} hint="Your words and pieces." />
          <Tile to="/account" label={copy.home.seeTimeline} hint="What happened, in your order." />
          <Tile to="/resources" label={copy.home.findSupport} hint="People you can talk to now." />
        </div>

        <AftercareCard plan={plan} title="Your care plan" />
      </div>
    </Shell>
  );
}

function Tile({ to, label, hint }: { to: string; label: string; hint: string }) {
  return (
    <Link to={to}>
      <Card className="paper-shadow">
        <CardContent className="flex items-center justify-between py-5">
          <div>
            <div className="text-base font-normal text-foreground">{label}</div>
            <div className="text-xs text-muted-foreground">{hint}</div>
          </div>
          <span className="text-muted-foreground">→</span>
        </CardContent>
      </Card>
    </Link>
  );
}
