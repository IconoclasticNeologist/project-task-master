import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { copy } from "@/lib/copy";
import { useStatements } from "@/lib/data/useStatements";
import type { StatementRow } from "@/lib/data/statements";

export function StatementList({ defaultVisibility }: { defaultVisibility: "private" | "shareable" }) {
  const { query, upsert, remove } = useStatements();
  const rows = query.data ?? [];

  const [drafting, setDrafting] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [draftVis, setDraftVis] = useState<StatementRow["visibility"]>(defaultVisibility);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editVis, setEditVis] = useState<StatementRow["visibility"]>("private");

  const busy = upsert.isPending || remove.isPending;

  const onSaveNew = () => {
    if (!draftText.trim() || busy) return;
    upsert.mutate({ text: draftText.trim(), visibility: draftVis }, { onSuccess: () => { setDraftText(""); setDrafting(false); } });
  };

  const onSaveEdit = (id: string) => {
    if (busy) return;
    upsert.mutate({ id, text: editText.trim(), visibility: editVis }, { onSuccess: () => setEditingId(null) });
  };

  if (query.isLoading) {
    return <p className="text-sm text-muted-foreground">…</p>;
  }
  if (query.isError) {
    return (
      <div className="space-y-3">
        <p className="text-sm leading-relaxed text-foreground">{copy.account.loadError}</p>
        <button type="button" onClick={() => void query.refetch()} className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
          {copy.account.retry}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!drafting && (
        <button type="button" onClick={() => { setDraftVis(defaultVisibility); setDrafting(true); }} className="w-full rounded-md border border-dashed border-border px-4 py-3 text-left text-sm text-muted-foreground hover:text-foreground">
          {copy.account.statement.addCta}
        </button>
      )}

      {drafting && (
        <Card>
          <CardContent className="space-y-3 py-4">
            <Textarea value={draftText} onChange={(e) => setDraftText(e.target.value)} placeholder={copy.account.statement.placeholder} className="min-h-32" autoFocus />
            <VisibilityToggle value={draftVis} onChange={setDraftVis} />
            <div className="flex gap-2">
              <button type="button" onClick={onSaveNew} disabled={busy} className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-40">
                {copy.account.statement.save}
              </button>
              <button type="button" onClick={() => { setDrafting(false); setDraftText(""); }} className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground">
                {copy.account.statement.cancel}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {rows.length === 0 && !drafting && (
        <p className="text-sm text-muted-foreground">{copy.account.statement.empty}</p>
      )}

      {rows.map((r) => (
        <Card key={r.id}>
          <CardContent className="space-y-3 py-4">
            {editingId === r.id ? (
              <>
                <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="min-h-32" />
                <VisibilityToggle value={editVis} onChange={setEditVis} />
                <div className="flex gap-2">
                  <button type="button" onClick={() => onSaveEdit(r.id)} disabled={busy} className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-40">
                    {copy.account.statement.save}
                  </button>
                  <button type="button" onClick={() => setEditingId(null)} className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground">
                    {copy.account.statement.cancel}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{r.text}</p>
                <div className="flex items-center justify-between">
                  <span className={r.visibility === "shareable" ? "text-xs uppercase tracking-wide text-primary" : "text-xs uppercase tracking-wide text-muted-foreground"}>
                    {r.visibility === "shareable" ? copy.account.statement.shareable : copy.account.statement.private}
                  </span>
                  <div className="flex gap-3 text-xs">
                    <button type="button" onClick={() => { setEditingId(r.id); setEditText(r.text); setEditVis(r.visibility); }} className="text-muted-foreground hover:text-foreground">
                      Edit
                    </button>
                    <button type="button" onClick={() => !busy && remove.mutate(r.id)} disabled={busy} className="text-muted-foreground hover:text-destructive disabled:opacity-40">
                      {copy.account.statement.delete}
                    </button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function VisibilityToggle({ value, onChange }: { value: "private" | "shareable"; onChange: (v: "private" | "shareable") => void }) {
  return (
    <div className="flex gap-2 text-xs">
      {([["private", copy.account.statement.private], ["shareable", copy.account.statement.shareable]] as const).map(([v, label]) => (
        <button key={v} type="button" onClick={() => onChange(v)} className={value === v ? "rounded-md border border-primary bg-primary/10 px-3 py-1.5" : "rounded-md border border-border px-3 py-1.5 text-muted-foreground"}>
          {label}
        </button>
      ))}
    </div>
  );
}
