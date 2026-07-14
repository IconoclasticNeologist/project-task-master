import { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { copy } from "@/lib/copy";
import { useDocuments } from "@/lib/data/useDocuments";
import { getDecryptedObjectUrl, MAX_DOCUMENT_BYTES, type DocumentRow } from "@/lib/data/documents";
import { ConfirmButton } from "@/components/ConfirmButton";

export function DocumentList({
  defaultVisibility,
}: {
  defaultVisibility: "private" | "shareable";
}) {
  const { query, upload, remove } = useDocuments();
  const rows = query.data ?? [];
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const busy = upload.isPending || remove.isPending;

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (f && f.size > MAX_DOCUMENT_BYTES) {
      toast(copy.account.documents.tooLarge);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setFile(f);
  };

  const onAdd = () => {
    if (!file || busy) return;
    upload.mutate(
      { file, note, visibility: defaultVisibility },
      {
        onSuccess: () => {
          setFile(null);
          setNote("");
          if (fileInputRef.current) fileInputRef.current.value = "";
        },
      },
    );
  };

  const onView = async (doc: DocumentRow) => {
    try {
      // Download ciphertext, decrypt in the browser, open the result. Revoke the
      // object URL after a minute so the decrypted bytes don't linger in memory.
      const url = await getDecryptedObjectUrl(doc);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      toast(copy.account.loadError);
    }
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
      <Card>
        <CardContent className="space-y-3 py-4">
          <Label className="text-sm">{copy.account.documents.addCta}</Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf,.doc,.docx,.txt,.rtf"
            onChange={onFile}
            className="text-sm"
          />
          {file && (
            <>
              <div className="space-y-1">
                <Label htmlFor="note">{copy.account.documents.noteLabel}</Label>
                <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
              <button
                type="button"
                onClick={onAdd}
                disabled={busy}
                className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-40"
              >
                {upload.isPending ? copy.account.documents.uploading : "Add"}
              </button>
            </>
          )}
        </CardContent>
      </Card>

      {rows.length === 0 && (
        <p className="text-sm text-muted-foreground">{copy.account.documents.empty}</p>
      )}

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
                {r.visibility === "shareable"
                  ? copy.account.statement.shareable
                  : copy.account.statement.private}
              </span>
              <div className="flex gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => void onView(r)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {copy.account.documents.view}
                </button>
                <ConfirmButton
                  disabled={busy}
                  onConfirm={() => !busy && remove.mutate({ id: r.id, storagePath: r.storagePath })}
                  trigger="Delete"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
