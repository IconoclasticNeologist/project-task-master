import { useState } from "react";
import { copy } from "@/lib/copy";

// A saying on paper; tapping turns it over to what it can mean. Pure state
// swap — no transition classes, so Stillness holds by construction.
export function FlipCard({ text, meaning }: { text: string; meaning: string }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <button
      type="button"
      aria-expanded={flipped}
      onClick={() => setFlipped((f) => !f)}
      className="paper-shadow block w-full rounded-md bg-secondary/60 px-5 py-5 text-left"
    >
      {flipped ? (
        <span className="block space-y-2">
          <span className="block text-sm leading-relaxed text-foreground/85">{meaning}</span>
          <span className="block text-[0.7rem] text-foreground/50">{copy.study.flipHintBack}</span>
        </span>
      ) : (
        <span className="block space-y-2">
          <span className="block text-base italic leading-relaxed text-foreground">“{text}”</span>
          <span className="block text-[0.7rem] text-foreground/50">{copy.study.flipHintFront}</span>
        </span>
      )}
    </button>
  );
}
