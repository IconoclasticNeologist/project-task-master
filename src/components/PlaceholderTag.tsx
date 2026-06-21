// Visible marker for review-gated copy. Every PLACEHOLDER string surfaced
// to the survivor must be wrapped in or accompanied by this tag, so it is
// impossible to ship review-gated copy as final by accident.

export function PlaceholderTag({ label = "Placeholder — to be reviewed" }: { label?: string }) {
  return (
    <span className="ml-2 inline-flex items-center rounded-sm border border-border bg-secondary px-1.5 py-0.5 text-[10px] font-normal uppercase tracking-wide text-muted-foreground">
      {label}
    </span>
  );
}
