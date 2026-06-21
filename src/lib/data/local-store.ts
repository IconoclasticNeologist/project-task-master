// Build-eval local store.
//
// Lovable Cloud is currently disabled in this project, which means the
// Supabase server functions in src/lib/data/*.functions.ts cannot be wired
// live yet. To let the survivor-facing flows be evaluated end-to-end now,
// account data (statements, timeline, documents-metadata, aftercare plan,
// settings) is persisted in localStorage on this device only.
//
// CLEARLY MARKED in-UI by `<CloudOffBanner/>`. The shape of every record
// here mirrors the eventual Supabase row exactly so the swap to server
// functions is a one-line call-site change per list/mutation.

const NS = "advocate.v1.";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(NS + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(NS + key, JSON.stringify(value));
  } catch {
    /* quota — ignore */
  }
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---------- Aftercare plan ----------

export interface AftercarePlan {
  supportPerson: string;
  calmingThing: string;
}

export function loadAftercare(): AftercarePlan | null {
  return read<AftercarePlan | null>("aftercare", null);
}

export function saveAftercare(plan: AftercarePlan) {
  write("aftercare", plan);
}

// ---------- Statements ----------

export interface StatementRow {
  id: string;
  text: string;
  visibility: "private" | "shareable";
  language: "en" | "es";
  createdAt: string;
  updatedAt: string;
}

export function listStatements(): StatementRow[] {
  return read<StatementRow[]>("statements", []);
}

export function upsertStatement(
  input: Partial<StatementRow> & { text: string; visibility: StatementRow["visibility"] },
): StatementRow {
  const rows = listStatements();
  const now = new Date().toISOString();
  if (input.id) {
    const idx = rows.findIndex((r) => r.id === input.id);
    if (idx >= 0) {
      const updated = { ...rows[idx], ...input, updatedAt: now } as StatementRow;
      rows[idx] = updated;
      write("statements", rows);
      return updated;
    }
  }
  const row: StatementRow = {
    id: newId(),
    text: input.text,
    visibility: input.visibility,
    language: input.language ?? "en",
    createdAt: now,
    updatedAt: now,
  };
  rows.unshift(row);
  write("statements", rows);
  return row;
}

export function deleteStatement(id: string) {
  write(
    "statements",
    listStatements().filter((r) => r.id !== id),
  );
}

// ---------- Timeline ----------

export interface TimelineRow {
  id: string;
  date: string | null;
  relativeAnchor: string | null;
  description: string;
  visibility: "private" | "shareable";
  createdAt: string;
  updatedAt: string;
}

export function listTimeline(): TimelineRow[] {
  return read<TimelineRow[]>("timeline", []);
}

export function upsertTimeline(
  input: Partial<TimelineRow> & { description: string; visibility: TimelineRow["visibility"] },
): TimelineRow {
  const rows = listTimeline();
  const now = new Date().toISOString();
  if (input.id) {
    const idx = rows.findIndex((r) => r.id === input.id);
    if (idx >= 0) {
      const updated = { ...rows[idx], ...input, updatedAt: now } as TimelineRow;
      rows[idx] = updated;
      write("timeline", rows);
      return updated;
    }
  }
  const row: TimelineRow = {
    id: newId(),
    date: input.date ?? null,
    relativeAnchor: input.relativeAnchor ?? null,
    description: input.description,
    visibility: input.visibility,
    createdAt: now,
    updatedAt: now,
  };
  rows.unshift(row);
  write("timeline", rows);
  return row;
}

export function deleteTimeline(id: string) {
  write(
    "timeline",
    listTimeline().filter((r) => r.id !== id),
  );
}

// ---------- Documents (metadata only — no file body in localStorage) ----------

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

// ---------- Settings ----------

export interface UserSettings {
  language: "en" | "es";
  defaultVisibility: "private" | "shareable";
}

export function loadSettings(): UserSettings {
  return read<UserSettings>("settings", {
    language: "en",
    defaultVisibility: "private",
  });
}

export function saveSettings(s: UserSettings) {
  write("settings", s);
}
