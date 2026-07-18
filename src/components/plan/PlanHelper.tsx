// "Build my plan with help" — the care-plan helper.
//
// The person says what's coming up and what usually helps; the helper drafts
// concrete, optional court-day steps (logistics + steadying, never testimony).
// Mirrors the timeline helper's privacy shape: the whole thread lives in
// component state — leaving the page wipes it. Nothing touches the real plan
// until the person taps Keep on a step. The deterministic crisis tripwire
// runs BEFORE any network call and never blocks anything.

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CrisisCard } from "@/components/CrisisCard";
import { copy } from "@/lib/copy";
import { getLangPref } from "@/lib/lang";
import { tripwire } from "@/lib/agents/safety/distress";
import { createMyCourtPlanItem, courtPlanCategoryLabels } from "@/lib/data/courtPlan";
import {
  runCarePlanBuilder,
  type CarePlanProposal,
  type CarePlanTurn,
} from "@/lib/agents/carePlanBuilder";

export function PlanHelper({
  aftercare,
}: {
  aftercare: { supportPerson: string; calmingAnchor: string };
}) {
  const queryClient = useQueryClient();
  const keepStep = useMutation({
    mutationFn: (input: { category: string; title: string; details: string }) =>
      createMyCourtPlanItem(input as Parameters<typeof createMyCourtPlanItem>[0]),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["court-plan"] }),
  });
  const [turns, setTurns] = useState<CarePlanTurn[]>([]);
  const [proposal, setProposal] = useState<CarePlanProposal | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [kept, setKept] = useState<Set<number>>(new Set());
  const [showCrisis, setShowCrisis] = useState(false);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    if (tripwire(trimmed)?.kind === "crisis") setShowCrisis(true);
    const nextTurns: CarePlanTurn[] = [...turns, { role: "user", content: trimmed }];
    setTurns(nextTurns);
    setDraft("");
    setBusy(true);
    setError(false);
    try {
      const result = await runCarePlanBuilder(
        nextTurns,
        getLangPref() === "es" ? "es" : "en",
        aftercare,
      );
      setProposal(result);
      setKept(new Set());
      setTurns([...nextTurns, { role: "helper", content: JSON.stringify(result) }]);
    } catch {
      setError(true);
      setTurns(turns); // the failed turn never happened; their text stays in the box
      setDraft(trimmed);
    } finally {
      setBusy(false);
    }
  };

  const keep = (i: number) => {
    const step = proposal?.steps[i];
    if (!step || kept.has(i)) return;
    keepStep.mutate(
      { category: step.category, title: step.title, details: step.details },
      { onSuccess: () => setKept((prev) => new Set(prev).add(i)) },
    );
  };

  const t = copy.plan.helper;

  return (
    <Card>
      <CardContent className="space-y-4 py-5">
        <div className="space-y-1">
          <h3 className="text-base font-normal text-foreground">{t.title}</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">{t.intro}</p>
        </div>

        {showCrisis && <CrisisCard />}

        {proposal && (
          <div className="space-y-3">
            {proposal.note && (
              <p className="text-sm leading-relaxed text-muted-foreground">{proposal.note}</p>
            )}
            {proposal.steps.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t.draftLabel}
                </p>
                {proposal.steps.map((step, i) => (
                  <div
                    key={`${step.title.slice(0, 24)}-${i}`}
                    className="flex items-start justify-between gap-3 rounded-md border border-border p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs italic text-muted-foreground">
                        {courtPlanCategoryLabels[step.category]}
                      </p>
                      <p className="text-sm leading-relaxed text-foreground">{step.title}</p>
                      {step.details && (
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {step.details}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => keep(i)}
                      disabled={kept.has(i) || keepStep.isPending}
                      className={
                        kept.has(i)
                          ? "shrink-0 rounded-md px-3 py-1.5 text-xs text-muted-foreground"
                          : "shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-40"
                      }
                    >
                      {kept.has(i) ? t.kept : t.keep}
                    </button>
                  </div>
                ))}
              </div>
            )}
            {proposal.question && (
              <div className="rounded-md bg-secondary/40 p-3">
                <p className="text-sm leading-relaxed text-foreground">{proposal.question}</p>
                <button
                  type="button"
                  onClick={() => void send(`Skip that question: "${proposal.question}"`)}
                  disabled={busy}
                  className="mt-2 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground disabled:opacity-40"
                >
                  {t.skip}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={proposal ? t.replyPlaceholder : t.placeholder}
            className="min-h-20"
          />
          <button
            type="button"
            onClick={() => void send(draft)}
            disabled={busy || !draft.trim()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40"
          >
            {busy ? t.running : proposal ? t.send : t.run}
          </button>
          {error && <p className="text-xs leading-relaxed text-muted-foreground">{t.error}</p>}
          <p className="text-xs leading-relaxed text-muted-foreground">{t.notSaved}</p>
        </div>
      </CardContent>
    </Card>
  );
}
