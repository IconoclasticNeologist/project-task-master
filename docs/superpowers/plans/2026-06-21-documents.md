# Documents (Storage) Slice — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]` checkboxes.

**Goal:** Real document upload/view/delete for a survivor's "Your space" — files in the private `documents` Supabase Storage bucket (client-side, RLS), metadata in the `documents` table — re-enabling the Account Documents tab and **fully retiring the in-memory `local-store`**.

**Architecture / decisions (self-approved):**
- **Client-side Supabase**, like A/B. The private bucket `documents` + folder-scoped storage RLS (`(storage.foldername(name))[1] = current_survivor_id()`) and the `documents` table RLS already exist (migration 08). The anon JWT carries the survivor identity, so a survivor can only read/write their own `{survivorId}/…` folder and rows.
- **Storage path:** `{survivorId}/{randomUUID}_{safeFileName}`. The display filename is derived from the path (strip the `uuid_` prefix). No `file_name` column needed.
- **Keep the per-file note** (UI + copy already support it; schema omitted it) → add a `documents.note text` column (D1).
- **`document_type`** defaults to `'other'` (UI doesn't capture it). `extracted_text`/OCR and gatekeeper binary access are **out of scope** (server/RAG/export, later).
- **Client limits:** max 10 MB; accept common doc/image types. Upload then insert metadata; on metadata failure, best-effort remove the orphaned object. View via short-lived `createSignedUrl`. Delete removes object then row.
- **Retire `local-store` entirely** + delete `documents.functions.ts` (Documents was the last in-memory consumer).

**Tech Stack:** Supabase JS Storage + table (anon key, RLS), React Query, Vitest, shadcn/ui.

---

## Task D1: Add `documents.note` column + types

**Files:** Create `supabase/migrations/20260621000004_documents_note.sql`; Modify `src/lib/supabase/types.ts`.

- [ ] **Step 1:** Create `supabase/migrations/20260621000004_documents_note.sql`:
```sql
-- Optional per-file note (the survivor's "a short note about this paper").
alter table public.documents add column note text;
```
- [ ] **Step 2:** In `src/lib/supabase/types.ts`, in the `documents` table type: add `note: string | null` to `Row`, and `note?: string | null` to `Insert` and `Update`. (Hand-edit; do NOT run gen:types/db:push.)
- [ ] **Step 3:** `bunx tsc --noEmit` → clean.
- [ ] **Step 4:** Commit:
```bash
git add supabase/migrations/20260621000004_documents_note.sql src/lib/supabase/types.ts
git commit -m "feat(db): add documents.note column"
```

---

## Task D2: `documents.ts` data module + `useDocuments` hook (TDD)

**Files:** Create `src/lib/data/documents.ts`, `src/lib/data/documents.test.ts`, `src/lib/data/useDocuments.ts`.

- [ ] **Step 1: Write the failing tests** — `src/lib/data/documents.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const storageBucket = { upload: vi.fn(), remove: vi.fn(), createSignedUrl: vi.fn() };
const mockClient = { from: vi.fn(), storage: { from: vi.fn(() => storageBucket) } };
vi.mock("@/lib/supabase/client", () => ({ getSupabase: () => mockClient }));
vi.mock("@/lib/auth/session", () => ({
  getSurvivor: vi.fn().mockResolvedValue({ id: "sv1", first_name: null, preferred_language: "en", onboarded_at: null }),
}));

import { listDocuments, uploadDocument, deleteDocument, getDocumentUrl } from "./documents";

beforeEach(() => vi.clearAllMocks());

describe("listDocuments", () => {
  it("maps a row and derives fileName from storage_path (stripping the uuid prefix)", async () => {
    const order = vi.fn().mockResolvedValue({
      data: [{ id: "1", storage_path: "sv1/abc-123_report.pdf", note: "court", visibility: "private", uploaded_at: "t" }],
      error: null,
    });
    mockClient.from.mockReturnValue({ select: () => ({ order }) });
    const rows = await listDocuments();
    expect(rows[0]).toMatchObject({ id: "1", fileName: "report.pdf", note: "court", visibility: "private", storagePath: "sv1/abc-123_report.pdf" });
  });
});

describe("uploadDocument", () => {
  it("uploads to the survivor's folder then inserts metadata", async () => {
    storageBucket.upload.mockResolvedValue({ data: { path: "p" }, error: null });
    const single = vi.fn().mockResolvedValue({
      data: { id: "2", storage_path: "sv1/u_report.pdf", note: null, visibility: "private", uploaded_at: "t" },
      error: null,
    });
    const insert = vi.fn(() => ({ select: () => ({ single }) }));
    mockClient.from.mockReturnValue({ insert });
    const file = new File(["x"], "report.pdf", { type: "application/pdf" });
    await uploadDocument({ file, note: "", visibility: "private" });
    // path begins with the survivor folder
    expect(storageBucket.upload.mock.calls[0][0]).toMatch(/^sv1\//);
    expect(insert).toHaveBeenCalledTimes(1);
    const arg = insert.mock.calls[0][0];
    expect(arg).toMatchObject({ survivor_id: "sv1", visibility: "private", note: null });
    expect(typeof arg.storage_path).toBe("string");
  });

  it("removes the orphaned object if the metadata insert fails", async () => {
    storageBucket.upload.mockResolvedValue({ data: { path: "p" }, error: null });
    storageBucket.remove.mockResolvedValue({ data: null, error: null });
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: "insert boom" } });
    mockClient.from.mockReturnValue({ insert: () => ({ select: () => ({ single }) }) });
    const file = new File(["x"], "a.pdf", { type: "application/pdf" });
    await expect(uploadDocument({ file, note: "", visibility: "private" })).rejects.toThrow("insert boom");
    expect(storageBucket.remove).toHaveBeenCalledTimes(1);
  });
});

describe("deleteDocument", () => {
  it("removes the object then deletes the row", async () => {
    storageBucket.remove.mockResolvedValue({ data: null, error: null });
    const eq = vi.fn().mockResolvedValue({ error: null });
    mockClient.from.mockReturnValue({ delete: () => ({ eq }) });
    await deleteDocument({ id: "9", storagePath: "sv1/x_a.pdf" });
    expect(storageBucket.remove).toHaveBeenCalledWith(["sv1/x_a.pdf"]);
    expect(eq).toHaveBeenCalledWith("id", "9");
  });
});

describe("getDocumentUrl", () => {
  it("returns a signed url", async () => {
    storageBucket.createSignedUrl.mockResolvedValue({ data: { signedUrl: "https://signed" }, error: null });
    expect(await getDocumentUrl("sv1/x_a.pdf")).toBe("https://signed");
  });
});
```

- [ ] **Step 2:** Run `bun run test` → FAIL (cannot resolve `./documents`).

- [ ] **Step 3: Implement** — `src/lib/data/documents.ts`:
```ts
import { getSupabase } from "@/lib/supabase/client";
import { getSurvivor } from "@/lib/auth/session";
import type { Tables } from "@/lib/supabase/types";

export interface DocumentRow {
  id: string;
  fileName: string;
  note: string | null;
  visibility: "private" | "shareable";
  storagePath: string;
  uploadedAt: string;
}

type DbRow = Pick<Tables<"documents">, "id" | "storage_path" | "note" | "visibility" | "uploaded_at">;

const COLS = "id, storage_path, note, visibility, uploaded_at";
const BUCKET = "documents";

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024; // 10 MB

function fileNameFromPath(path: string): string {
  const seg = path.split("/").pop() ?? path;
  const us = seg.indexOf("_");
  return us >= 0 ? seg.slice(us + 1) : seg;
}

function mapRow(r: DbRow): DocumentRow {
  return {
    id: r.id,
    fileName: fileNameFromPath(r.storage_path),
    note: r.note,
    visibility: r.visibility,
    storagePath: r.storage_path,
    uploadedAt: r.uploaded_at,
  };
}

export async function listDocuments(): Promise<DocumentRow[]> {
  const { data, error } = await getSupabase()
    .from("documents")
    .select(COLS)
    .order("uploaded_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => mapRow(r as DbRow));
}

export async function uploadDocument(input: {
  file: File;
  note: string;
  visibility: "private" | "shareable";
}): Promise<DocumentRow> {
  const supabase = getSupabase();
  const survivor = await getSurvivor();
  if (!survivor) throw new Error("not authenticated");
  const safe = input.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${survivor.id}/${crypto.randomUUID()}_${safe}`;
  const up = await supabase.storage.from(BUCKET).upload(path, input.file, { upsert: false });
  if (up.error) throw new Error(up.error.message);
  const { data, error } = await supabase
    .from("documents")
    .insert({ survivor_id: survivor.id, storage_path: path, note: input.note || null, visibility: input.visibility })
    .select(COLS)
    .single();
  if (error) {
    await supabase.storage.from(BUCKET).remove([path]); // best-effort cleanup of the orphan
    throw new Error(error.message);
  }
  return mapRow(data as DbRow);
}

export async function deleteDocument(doc: { id: string; storagePath: string }): Promise<void> {
  const supabase = getSupabase();
  const del = await supabase.storage.from(BUCKET).remove([doc.storagePath]);
  if (del.error) throw new Error(del.error.message);
  const { error } = await supabase.from("documents").delete().eq("id", doc.id);
  if (error) throw new Error(error.message);
}

export async function getDocumentUrl(storagePath: string): Promise<string> {
  const { data, error } = await getSupabase().storage.from(BUCKET).createSignedUrl(storagePath, 60);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
```

- [ ] **Step 4:** Run `bun run test` → PASS.

- [ ] **Step 5:** Create `src/lib/data/useDocuments.ts`:
```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listDocuments, uploadDocument, deleteDocument } from "./documents";

export function useDocuments() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["documents"] });
  const onError = () => toast("We couldn't do that just now.");
  return {
    query: useQuery({ queryKey: ["documents"], queryFn: listDocuments }),
    upload: useMutation({ mutationFn: uploadDocument, onSuccess: invalidate, onError }),
    remove: useMutation({ mutationFn: deleteDocument, onSuccess: invalidate, onError }),
  };
}
```

- [ ] **Step 6:** `bunx tsc --noEmit` (clean), commit:
```bash
git add src/lib/data/documents.ts src/lib/data/documents.test.ts src/lib/data/useDocuments.ts
git commit -m "feat(data): client-side documents module (Storage + table) + useDocuments hook"
```

---

## Task D3: Rework `DocumentList` (real upload/view/delete) + copy

**Files:** Modify `src/lib/copy/index.ts`; rewrite `src/components/account/DocumentList.tsx`.

- [ ] **Step 1:** Add to `src/lib/copy/index.ts` under `account.documents` (alongside `addCta`/`empty`/`noteLabel`): 
```ts
      view: "View",
      tooLarge: "That file is over 10 MB. Try a smaller one.",
      uploading: "Adding…",
```

- [ ] **Step 2:** Replace `src/components/account/DocumentList.tsx`:
```tsx
import { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { copy } from "@/lib/copy";
import { useDocuments } from "@/lib/data/useDocuments";
import { getDocumentUrl, MAX_DOCUMENT_BYTES } from "@/lib/data/documents";

export function DocumentList({ defaultVisibility }: { defaultVisibility: "private" | "shareable" }) {
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
      { onSuccess: () => { setFile(null); setNote(""); if (fileInputRef.current) fileInputRef.current.value = ""; } },
    );
  };

  const onView = async (storagePath: string) => {
    try {
      const url = await getDocumentUrl(storagePath);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast(copy.account.loadError);
    }
  };

  if (query.isLoading) return <p className="text-sm text-muted-foreground">…</p>;
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
      <Card>
        <CardContent className="space-y-3 py-4">
          <Label className="text-sm">{copy.account.documents.addCta}</Label>
          <input ref={fileInputRef} type="file" onChange={onFile} className="text-sm" />
          {file && (
            <>
              <div className="space-y-1">
                <Label htmlFor="note">{copy.account.documents.noteLabel}</Label>
                <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
              <button type="button" onClick={onAdd} disabled={busy} className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-40">
                {upload.isPending ? copy.account.documents.uploading : "Add"}
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
              <span className={r.visibility === "shareable" ? "text-xs uppercase tracking-wide text-primary" : "text-xs uppercase tracking-wide text-muted-foreground"}>
                {r.visibility}
              </span>
              <div className="flex gap-3 text-xs">
                <button type="button" onClick={() => void onView(r.storagePath)} className="text-muted-foreground hover:text-foreground">
                  {copy.account.documents.view}
                </button>
                <button type="button" onClick={() => !busy && remove.mutate({ id: r.id, storagePath: r.storagePath })} disabled={busy} className="text-muted-foreground hover:text-destructive disabled:opacity-40">
                  Delete
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 3:** `bunx tsc --noEmit` (clean), `bun run test` (pass). Commit:
```bash
git add src/lib/copy/index.ts src/components/account/DocumentList.tsx
git commit -m "feat(account): DocumentList does real Storage upload/view/delete (async, isError-aware)"
```

---

## Task D4: Re-enable the Documents tab + fully retire `local-store`

**Files:** Modify `src/routes/account.tsx`; Delete `src/lib/data/local-store.ts`, `src/lib/data/documents.functions.ts`.

- [ ] **Step 1:** In `src/routes/account.tsx`: re-add the documents tab. Change `type Tab = "statements" | "timeline";` to `type Tab = "statements" | "timeline" | "documents";`, add `import { DocumentList } from "@/components/account/DocumentList";`, add `["documents", copy.account.tabs.documents]` to the tab nav array, and render `{tab === "documents" && <DocumentList defaultVisibility={defaultVisibility} />}`.
- [ ] **Step 2:** Confirm nothing imports `@/lib/data/local-store` anymore: `grep -rn 'local-store' src` → expect ZERO (DocumentList now uses the new module). Then delete the retired files:
```bash
git rm src/lib/data/local-store.ts src/lib/data/documents.functions.ts
```
- [ ] **Step 3:** `bunx tsc --noEmit` (clean — no dangling imports), `bun run test` (all pass).
- [ ] **Step 4:** Commit:
```bash
git add -A
git commit -m "feat(account): re-enable Documents tab; fully retire in-memory local-store + documents server stub"
```

---

## Self-Review notes
- **Coverage:** note column (D1) ✓; client Storage upload/list/delete/signed-url + orphan cleanup (D2) ✓; size/type limit + isError + async UI (D3) ✓; tab re-enable + full local-store retirement (D4) ✓.
- **Type consistency:** `DocumentRow` (camel, with `storagePath`/`fileName`) defined once (D2), consumed by `useDocuments` + DocumentList; `MAX_DOCUMENT_BYTES` exported from documents.ts, used in DocumentList.
- **Out of scope (carried):** OCR/`extracted_text`, gatekeeper binary access, `document_type` UI, multi-file upload. Live verification gated on anon sign-ins + the bucket/RLS on live (migration 08), same as A/B.
