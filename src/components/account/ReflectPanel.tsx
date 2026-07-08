import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { copy } from "@/lib/copy";
import { useAgent } from "@/lib/agents/useAgent";
import { useStatements } from "@/lib/data/useStatements";
import { CrisisCard } from "@/components/CrisisCard";
import { tripwire } from "@/lib/agents/safety/distress";

// Collapsed by default so it stays a calm, secondary affordance instead of
// dominating every tab of the account screen.
export function ReflectPanel() {
  const [open, setOpen] = useState(false);
  const agent = useAgent();
  const { query } = useStatements();
  const entries = (query.data ?? []).map((s) => s.text);
  const [out, setOut] = useState("");
  const [showCrisis, setShowCrisis] = useState(false);
  const [lastRun, setLastRun] = useState<
    "reframer" | "recognition" | "interviewer" | "directAsk" | null
  >(null);

  const run = (which: "reframer" | "recognition" | "interviewer" | "directAsk") => {
    setOut("");
    setLastRun(null);
    // Surface support if the person's own words carry crisis language (never blocks).
    if (tripwire(entries.join("\n"))?.kind === "crisis") setShowCrisis(true);
    if (which !== "interviewer" && entries.length === 0) {
      setOut(copy.account.reflect.empty);
      return;
    }
    const input =
      which === "reframer"
        ? { entries }
        : which === "recognition"
          ? { narrative: entries.join("\n\n") }
          : which === "directAsk"
            ? // The scripted refusal: the exact ask is fixed server-side; the
              // recognition layer declines the conclusion, visibly, every time.
              { narrative: entries.join("\n\n"), directAsk: true }
            : { context: "" };
    agent.mutate(
      { agent: which === "directAsk" ? "recognition" : which, input },
      {
        onSuccess: (text) => {
          setOut(text);
          setLastRun(which);
        },
      },
    );
  };

  return (
    <Card className="paper-shadow">
      <CardContent className="py-4">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="text-base font-normal text-foreground">
            {copy.account.reflect.title}
          </span>
          <span aria-hidden className="text-lg leading-none text-muted-foreground">
            {open ? "–" : "+"}
          </span>
        </button>
        {open && (
          <div className="mt-3 space-y-3">
            {showCrisis && <CrisisCard />}
            <p className="text-xs leading-relaxed text-muted-foreground">
              {copy.account.reflect.intro}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={agent.isPending}
                onClick={() => run("reframer")}
                className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40"
              >
                {copy.account.reflect.reframe}
              </button>
              <button
                type="button"
                disabled={agent.isPending}
                onClick={() => run("recognition")}
                className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40"
              >
                {copy.account.reflect.recognize}
              </button>
              <button
                type="button"
                disabled={agent.isPending}
                onClick={() => run("interviewer")}
                className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40"
              >
                {copy.account.reflect.prompt}
              </button>
            </div>
            {agent.isPending && (
              <p className="text-sm text-muted-foreground">{copy.account.reflect.working}</p>
            )}
            {out && !agent.isPending && (
              <p className="whitespace-pre-wrap rounded-md border border-border bg-card px-3 py-2 text-sm leading-relaxed text-foreground">
                {out}
              </p>
            )}
            {lastRun === "recognition" && out && !agent.isPending && (
              <button
                type="button"
                onClick={() => run("directAsk")}
                className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                {copy.account.reflect.directAsk}
              </button>
            )}
            {lastRun === "directAsk" && out && !agent.isPending && (
              <p className="text-xs leading-relaxed text-muted-foreground">
                {copy.account.reflect.directAskExplain}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
