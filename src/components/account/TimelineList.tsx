import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { copy } from "@/lib/copy";
import { useTimeline } from "@/lib/data/useTimeline";
import { VisibilityToggle } from "@/components/account/VisibilityToggle";
import { ConfirmButton } from "@/components/ConfirmButton";

export function TimelineList({
  defaultVisibility,
}: {
  defaultVisibility: "private" | "shareable";
}) {
  const { query, upsert, remove } = useTimeline();
  const rows = query.data ?? [];
  const [drafting, setDrafting] = useState(false);
  const [when, setWhen] = useState("");
  const [what, setWhat] = useState("");
  const busy = upsert.isPending || remove.isPending;

  const onSave = () => {
    if (!what.trim() || busy) return;
    const isDate = /^\d{4}(-\d{2}(-\d{2})?)?$/.test(when.trim());
    upsert.mutate(
      {
        date: isDate ? when.trim() : null,
        relativeAnchor: isDate ? null : when.trim() || null,
        description: what.trim(),
        visibility: defaultVisibility,
      },
      {
        onSuccess: () => {
          setWhen("");
          setWhat("");
          setDrafting(false);
        },
      },
    );
  };

  if (query.isLoading) {
    return <p className="text-sm text-muted-foreground">…</p>;
  }
  if (query.isError) {
    return (
      <div className="space-y-3">
        <p className="text-sm leading-relaxed text-foreground">{copy.account.loadError}</p>
        <button
          type="button"
          onClick={() => void query.refetch()}
          className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          {copy.account.retry}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!drafting && (
        <button
          type="button"
          onClick={() => setDrafting(true)}
          className="w-full rounded-md border border-dashed border-border px-4 py-3 text-left text-sm text-muted-foreground hover:text-foreground"
        >
          {copy.account.timeline.addCta}
        </button>
      )}
      {drafting && (
        <Card>
          <CardContent className="space-y-3 py-4">
            <div className="space-y-1">
              <Label htmlFor="when">{copy.account.timeline.whenLabel}</Label>
              <Input id="when" value={when} onChange={(e) => setWhen(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="what">{copy.account.timeline.whatLabel}</Label>
              <Textarea
                id="what"
                value={what}
                onChange={(e) => setWhat(e.target.value)}
                className="min-h-24"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onSave}
                disabled={busy}
                className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-40"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setDrafting(false)}
                className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground"
              >
                Cancel
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {rows.length === 0 && !drafting && (
        <p className="text-sm text-muted-foreground">{copy.account.timeline.empty}</p>
      )}

      {rows.map((r) => (
        <Card key={r.id}>
          <CardContent className="space-y-2 py-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              {r.date ?? r.relativeAnchor ?? "—"}
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{r.description}</p>
            <div className="flex items-center justify-between">
              <VisibilityToggle
                value={r.visibility}
                onChange={(v) =>
                  !busy &&
                  upsert.mutate({
                    id: r.id,
                    date: r.date,
                    relativeAnchor: r.relativeAnchor,
                    description: r.description,
                    visibility: v,
                  })
                }
              />
              <ConfirmButton
                disabled={busy}
                onConfirm={() => !busy && remove.mutate(r.id)}
                trigger="Delete"
                className="text-xs text-muted-foreground hover:text-destructive disabled:opacity-40"
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
