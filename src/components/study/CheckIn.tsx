import { useState } from "react";
import { Info } from "lucide-react";
import { copy } from "@/lib/copy";

interface CheckInQuestion {
  prompt: string;
  choices: string[];
  answerIndex: number;
  explain: string;
}

// A gentle, unscored check-in. Tapping any choice reveals that question's
// explanation, which names the answer warmly — there is no "wrong", no tally,
// and nothing is stored anywhere. Questions are independent; the mark can
// move freely between choices.
export function CheckIn({ intro, questions }: { intro?: string; questions: CheckInQuestion[] }) {
  const [chosen, setChosen] = useState<Record<number, number>>({});

  return (
    <div className="space-y-6">
      <p className="text-sm leading-relaxed text-muted-foreground">
        {copy.study.checkInNothingSaved}
      </p>
      {intro && <p className="text-sm leading-relaxed text-foreground/85">{intro}</p>}

      {questions.map((q, qi) => (
        <div key={q.prompt} className="space-y-2.5">
          <p className="text-sm leading-relaxed text-foreground">{q.prompt}</p>
          <div className="space-y-1.5">
            {q.choices.map((c, ci) => (
              <button
                key={c}
                type="button"
                aria-pressed={chosen[qi] === ci}
                onClick={() => setChosen((prev) => ({ ...prev, [qi]: ci }))}
                className={
                  "block w-full rounded-md border px-3 py-2 text-left text-sm leading-relaxed " +
                  (chosen[qi] === ci
                    ? "border-foreground/30 bg-secondary/70 text-foreground"
                    : "border-border bg-card text-foreground/85 hover:bg-secondary/40")
                }
              >
                {c}
              </button>
            ))}
          </div>
          {chosen[qi] !== undefined && (
            <div className="flex gap-2.5 rounded-md bg-secondary/70 px-4 py-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-foreground/55" strokeWidth={2} />
              <p className="text-sm leading-relaxed text-foreground/85">{q.explain}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
