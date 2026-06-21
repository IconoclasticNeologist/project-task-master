import { copy } from "@/lib/copy";

export function CloudOffBanner() {
  return (
    <p className="mb-6 rounded-md border border-border bg-secondary/60 px-4 py-3 text-sm leading-relaxed text-muted-foreground paper-inset">
      {copy.account.cloudOff}
    </p>
  );
}
