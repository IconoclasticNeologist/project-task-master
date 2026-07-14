import { VocabText } from "@/components/study/VocabText";
import type { VocabTerm } from "@/lib/copy/studyGuides";

// "What happens when" — a quiet vertical list of stops along a path.
// Static by design: numbered paper dots on a ruled line, no motion.
export function TimelineList({
  steps,
  vocab,
}: {
  steps: { title: string; body: string }[];
  vocab: VocabTerm[];
}) {
  return (
    <ol className="space-y-5 border-l border-foreground/15 pl-5">
      {steps.map((s, i) => (
        <li key={s.title} className="relative">
          <span
            aria-hidden
            className="absolute -left-[1.7rem] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-[0.6rem] tabular-nums text-foreground/60"
          >
            {i + 1}
          </span>
          <h4 className="text-sm font-medium text-foreground">{s.title}</h4>
          <p className="text-sm leading-relaxed text-foreground/80">
            <VocabText text={s.body} vocab={vocab} />
          </p>
        </li>
      ))}
    </ol>
  );
}
