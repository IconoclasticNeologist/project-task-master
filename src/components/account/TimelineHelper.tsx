// "Put it in order" — the timeline helper.
//
// The founding timeline idea: a person brings something messy and leaves
// with an organized draft, made ONLY of their own words. The helper may ask
// at most two gentle ordering questions per round, each skippable; a skip
// retires the question for good (server prompt rule).
//
// Privacy shape (mirrors the app guide chat): the whole thread lives in
// component state — leaving the page wipes it. Nothing touches the real
// timeline until the person taps Keep on a row. The deterministic crisis
// tripwire runs BEFORE any network call and never blocks anything.

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CrisisCard } from "@/components/CrisisCard";
import { copy } from "@/lib/copy";
import { getLangPref } from "@/lib/lang";
import { exampleModeActive } from "@/lib/data/demoTools";
import { tripwire } from "@/lib/agents/safety/distress";
import { useTimeline } from "@/lib/data/useTimeline";
import {
  runTimelineBuilder,
  type TimelineProposal,
  type TimelineTurn,
} from "@/lib/agents/timelineBuilder";

const DATE_RE = /^\d{4}(-\d{2}(-\d{2})?)?$/;

export function TimelineHelper({
  defaultVisibility,
}: {
  defaultVisibility: "private" | "shareable";
}) {
  const { upsert } = useTimeline();
  const [turns, setTurns] = useState<TimelineTurn[]>([]);
  const [proposal, setProposal] = useState<TimelineProposal | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [kept, setKept] = useState<Set<number>>(new Set());
  const [showCrisis, setShowCrisis] = useState(false);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    // Deterministic, local, before any network call — and never blocking:
    // their words are theirs; support simply surfaces alongside.
    if (tripwire(trimmed)?.kind === "crisis") setShowCrisis(true);
    const nextTurns: TimelineTurn[] = [...turns, { role: "user", content: trimmed }];
    setTurns(nextTurns);
    setDraft("");
    setBusy(true);
    setError(false);
    try {
      const result = await runTimelineBuilder(
        nextTurns,
        getLangPref() === "es" ? "es" : "en",
        exampleModeActive(),
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
    const entry = proposal?.entries[i];
    if (!entry || kept.has(i)) return;
    const when = entry.when.trim();
    const isDate = DATE_RE.test(when);
    upsert.mutate(
      {
        date: isDate ? when : null,
        relativeAnchor: isDate ? null : when || null,
        description: entry.what,
        visibility: defaultVisibility,
      },
      { onSuccess: () => setKept((prev) => new Set(prev).add(i)) },
    );
  };

  const t = copy.account.timelineHelper;

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
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {t.draftLabel}
              </p>
              {proposal.entries.map((entry, i) => (
                <div
                  key={`${entry.when}-${entry.what.slice(0, 24)}-${i}`}
                  className="flex items-start justify-between gap-3 rounded-md border border-border p-3"
                >
                  <div className="min-w-0">
                    {entry.when && (
                      <p className="text-xs italic text-muted-foreground">{entry.when}</p>
                    )}
                    <p className="text-sm leading-relaxed text-foreground">{entry.what}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => keep(i)}
                    disabled={kept.has(i) || upsert.isPending}
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
            {proposal.questions.length > 0 && (
              <div className="space-y-2">
                {proposal.questions.map((q) => (
                  <div key={q} className="rounded-md bg-secondary/40 p-3">
                    <p className="text-sm leading-relaxed text-foreground">{q}</p>
                    <button
                      type="button"
                      onClick={() => void send(`Skip that question: "${q}"`)}
                      disabled={busy}
                      className="mt-2 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground disabled:opacity-40"
                    >
                      {t.skip}
                    </button>
                  </div>
                ))}
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
