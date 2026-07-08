import { copy } from "@/lib/copy";

/** Tappable crisis hotlines, from the verified resources list. Shared by the voice
 *  session and the text surfaces so there is one source of truth for the numbers. */
export function HotlineLinks() {
  return (
    <div className="space-y-2">
      {copy.resources.crisis.map((entry) => {
        const dial = entry.number.replace(/[^0-9]/g, "");
        return (
          <div key={entry.name} className="rounded-md border border-border px-3 py-2">
            <p className="text-sm text-foreground">{entry.name}</p>
            <a
              href={`tel:${dial}`}
              className="text-base font-medium text-foreground underline underline-offset-2"
            >
              {entry.number}
            </a>
            <p className="text-xs text-muted-foreground">{entry.hours}</p>
          </div>
        );
      })}
    </div>
  );
}

/** A calm crisis panel: the gentle framing plus the hotlines. Shown when the
 *  deterministic tripwire detects crisis language on a text surface. */
export function CrisisCard() {
  return (
    <div className="space-y-3 rounded-md border border-border bg-card px-4 py-4">
      <p className="text-sm font-medium text-foreground">{copy.safety.crisisTitle}</p>
      <p className="text-sm leading-relaxed text-muted-foreground">{copy.safety.crisisBody}</p>
      <HotlineLinks />
    </div>
  );
}
