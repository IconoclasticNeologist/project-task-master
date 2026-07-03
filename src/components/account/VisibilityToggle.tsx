import { copy } from "@/lib/copy";

// The per-item sharing control — the survivor decides, item by item.
// "Private" / "Okay to share" wording is deliberate: plain meaning over jargon.
export function VisibilityToggle({
  value,
  onChange,
}: {
  value: "private" | "shareable";
  onChange: (v: "private" | "shareable") => void;
}) {
  return (
    <div className="flex gap-2 text-xs">
      {(
        [
          ["private", copy.account.statement.private],
          ["shareable", copy.account.statement.shareable],
        ] as const
      ).map(([v, label]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={
            value === v
              ? "rounded-md border border-primary bg-primary/10 px-3 py-1.5"
              : "rounded-md border border-border px-3 py-1.5 text-muted-foreground"
          }
        >
          {label}
        </button>
      ))}
    </div>
  );
}
