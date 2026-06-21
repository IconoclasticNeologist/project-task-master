import { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { copy } from "@/lib/copy";
import {
  addDocument,
  deleteDocument,
  listDocuments,
  type DocumentRow,
} from "@/lib/data/local-store";

export function DocumentList({
  defaultVisibility,
}: {
  defaultVisibility: "private" | "shareable";
}) {
  const [rows, setRows] = useState<DocumentRow[]>(() => listDocuments());
  const [pendingName, setPendingName] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = () => setRows(listDocuments());

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPendingName(f.name);
    // No file body is stored — Cloud is off; document upload is recorded as
    // metadata only. When Cloud is enabled, switch to createSignedUploadFn.
  };

  const onAdd = () => {
    if (!pendingName) return;
    addDocument({ fileName: pendingName, note, visibility: defaultVisibility });
    setPendingName(null);
    setNote("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    refresh();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-3 py-4">
          <Label className="text-sm">{copy.account.documents.addCta}</Label>
          <input ref={fileInputRef} type="file" onChange={onFile} className="text-sm" />
          {pendingName && (
            <>
              <div className="space-y-1">
                <Label htmlFor="note">{copy.account.documents.noteLabel}</Label>
                <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
              <button
                type="button"
                onClick={onAdd}
                className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
              >
                Add
              </button>
            </>
          )}
        </CardContent>
      </Card>

      {rows.length === 0 && <p className="text-sm text-muted-foreground">{copy.account.documents.empty}</p>}

      {rows.map((r) => (
        <Card key={r.id}>
          <CardContent className="space-y-1 py-4">
            <div className="text-sm font-medium">{r.fileName}</div>
            {r.note && <p className="text-sm text-muted-foreground">{r.note}</p>}
            <div className="flex items-center justify-between pt-1">
              <span
                className={
                  r.visibility === "shareable"
                    ? "text-xs uppercase tracking-wide text-primary"
                    : "text-xs uppercase tracking-wide text-muted-foreground"
                }
              >
                {r.visibility}
              </span>
              <button
                type="button"
                onClick={() => {
                  deleteDocument(r.id);
                  refresh();
                }}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                Delete
              </button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
