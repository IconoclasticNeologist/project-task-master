import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { VocabTerm } from "@/lib/copy/studyGuides";

// Renders body text whose [[term]] marks become tappable words that open a
// plain-language definition. A mark with no matching vocab entry renders as
// the plain word (the content test suite prevents shipping one).
export function VocabText({
  text,
  vocab,
  className,
}: {
  text: string;
  vocab: VocabTerm[];
  className?: string;
}) {
  const parts = text.split(/(\[\[.+?\]\])/g);
  return (
    <span className={className}>
      {parts.map((part, i) => {
        const m = /^\[\[(.+?)\]\]$/.exec(part);
        if (!m) return <span key={i}>{part}</span>;
        const entry = vocab.find((v) => v.term.toLowerCase() === m[1].toLowerCase());
        if (!entry) return <span key={i}>{m[1]}</span>;
        return (
          <Popover key={i}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="underline decoration-dotted decoration-foreground/40 underline-offset-4 hover:decoration-foreground"
              >
                {m[1]}
              </button>
            </PopoverTrigger>
            <PopoverContent className="max-w-64 text-sm leading-relaxed">
              <span className="font-medium">{entry.term}.</span> {entry.meaning}
            </PopoverContent>
          </Popover>
        );
      })}
    </span>
  );
}
