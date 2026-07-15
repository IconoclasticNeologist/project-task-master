import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { copy } from "@/lib/copy";
import { useStatements } from "@/lib/data/useStatements";
import type { StatementRow } from "@/lib/data/statements";
import { useAgent } from "@/lib/agents/useAgent";
import { VisibilityToggle } from "@/components/account/VisibilityToggle";
import { ConfirmButton } from "@/components/ConfirmButton";
import { CrisisCard } from "@/components/CrisisCard";
import { tripwire } from "@/lib/agents/safety/distress";

export function StatementList({
  defaultVisibility,
}: {
  defaultVisibility: "private" | "shareable";
}) {
  const { query, upsert, remove } = useStatements();
  const rows = query.data ?? [];

  const agent = useAgent();
  const [draftFor, setDraftFor] = useState<string | null>(null);
  const [draftText, setDraftText] = useState("");

  const [drafting, setDrafting] = useState(false);
  const [newDraftText, setNewDraftText] = useState("");
  const [draftVis, setDraftVis] = useState<StatementRow["visibility"]>(defaultVisibility);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editVis, setEditVis] = useState<StatementRow["visibility"]>("private");
  const [showCrisis, setShowCrisis] = useState(false);

  const busy = upsert.isPending || remove.isPending;

  // Deterministic distress check on whatever the person writes. It never blocks saving
  // (their words are theirs) — it just surfaces support when the language signals crisis.
  const checkForCrisis = (text: string) => {
    if (tripwire(text)?.kind === "crisis") setShowCrisis(true);
  };

  const makeDraft = (id: string, text: string) => {
    setDraftFor(id);
    setDraftText("");
    agent.mutate(
      { agent: "organizer", input: { text } },
      { onSuccess: (out) => setDraftText(out) },
    );
  };

  const onSaveNew = () => {
    if (!newDraftText.trim() || busy) return;
    checkForCrisis(newDraftText);
    upsert.mutate(
      { text: newDraftText.trim(), visibility: draftVis },
      {
        onSuccess: () => {
          setNewDraftText("");
          setDrafting(false);
        },
      },
    );
  };

  const onSaveEdit = (id: string) => {
    if (busy) return;
    checkForCrisis(editText);
    upsert.mutate(
      { id, text: editText.trim(), visibility: editVis },
      { onSuccess: () => setEditingId(null) },
    );
  };

  if (query.isLoading) {
    return (
      <div className="space-y-3" aria-busy="true">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
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
      {showCrisis && (
        <div className="space-y-2">
          <CrisisCard />
          <button
            type="button"
            onClick={() => setShowCrisis(false)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {copy.account.dismiss}
          </button>
        </div>
      )}
      {!drafting && (
        <button
          type="button"
          onClick={() => {
            setDraftVis(defaultVisibility);
            setDrafting(true);
          }}
          className="w-full rounded-md border border-dashed border-border px-4 py-3 text-left text-sm text-muted-foreground hover:text-foreground"
        >
          {copy.account.statement.addCta}
        </button>
      )}

      {drafting && (
        <Card>
          <CardContent className="space-y-3 py-4">
            <Textarea
              value={newDraftText}
              onChange={(e) => setNewDraftText(e.target.value)}
              placeholder={copy.account.statement.placeholder}
              className="min-h-32"
              autoFocus
            />
            <VisibilityToggle value={draftVis} onChange={setDraftVis} />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onSaveNew}
                disabled={busy}
                className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-40"
              >
                {copy.account.statement.save}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDrafting(false);
                  setNewDraftText("");
                }}
                className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground"
              >
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
                <Textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="min-h-32"
                />
                <VisibilityToggle value={editVis} onChange={setEditVis} />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onSaveEdit(r.id)}
                    disabled={busy}
                    className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-40"
                  >
                    {copy.account.statement.save}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground"
                  >
                    {copy.account.statement.cancel}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {r.text}
                </p>
                <div className="flex items-center justify-between">
                  <span
                    className={
                      r.visibility === "shareable"
                        ? "text-xs uppercase tracking-wide text-primary"
                        : "text-xs uppercase tracking-wide text-muted-foreground"
                    }
                  >
                    {r.visibility === "shareable"
                      ? copy.account.statement.shareable
                      : copy.account.statement.private}
                  </span>
                  <div className="flex gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => makeDraft(r.id, r.text)}
                      disabled={agent.isPending}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-40"
                    >
                      {agent.isPending && draftFor === r.id
                        ? copy.account.statement.drafting
                        : copy.account.statement.organize}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(r.id);
                        setEditText(r.text);
                        setEditVis(r.visibility);
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Edit
                    </button>
                    <ConfirmButton
                      disabled={busy}
                      onConfirm={() => !busy && remove.mutate(r.id)}
                      trigger={copy.account.statement.delete}
                    />
                  </div>
                </div>
                {draftFor === r.id && draftText && (
                  <div className="mt-2 space-y-1 rounded-md border border-border bg-card px-3 py-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {copy.account.statement.organize}
                    </p>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                      {draftText}
                    </p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {copy.account.statement.organizeNote}
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
