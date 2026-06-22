// In-memory store — documents metadata only.
//
// Statements, timeline, settings, and aftercare are all Supabase-backed
// (see *.functions.ts). Documents metadata is the only entity still held
// in the module-scoped Map while the file-upload Supabase function is wired.
//
// Nothing here is written to disk: no localStorage, no sessionStorage, no
// IndexedDB, no cookies. Data survives in-session navigation between routes
// and resets on a full refresh.
//
// The shape of DocumentRow mirrors the eventual Supabase row exactly so the
// call-site swap is one line per list/mutation.

const mem = new Map<string, unknown>();

function read<T>(key: string, fallback: T): T {
  return (mem.has(key) ? (mem.get(key) as T) : fallback);
}

function write<T>(key: string, value: T) {
  mem.set(key, value);
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---------- Documents (metadata only — no file body in memory either) ----------

export interface DocumentRow {
  id: string;
  fileName: string;
  note: string;
  visibility: "private" | "shareable";
  createdAt: string;
}

export function listDocuments(): DocumentRow[] {
  return read<DocumentRow[]>("documents", []);
}

export function addDocument(
  input: Omit<DocumentRow, "id" | "createdAt">,
): DocumentRow {
  const rows = listDocuments();
  const row: DocumentRow = {
    id: newId(),
    createdAt: new Date().toISOString(),
    ...input,
  };
  rows.unshift(row);
  write("documents", rows);
  return row;
}

export function deleteDocument(id: string) {
  write(
    "documents",
    listDocuments().filter((r) => r.id !== id),
  );
}
