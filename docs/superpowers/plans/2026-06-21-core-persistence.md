# Core Persistence (Sub-project B) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make a survivor's statements, timeline, and settings/aftercare actually persist to Supabase (client-side, RLS), replacing the in-memory store, and close the A-deferred items (onboarded marker + `/onboarding` short-circuit, `useSurvivor` cache).

**Architecture:** Client-side `getSupabase().from(...)` calls scoped by RLS (consistent with A's `session.ts`). Pure data modules (`src/lib/data/{statements,timeline,settings}.ts`) wrap Supabase + map camel↔snake; thin React Query hooks wrap them with cache invalidation; the existing list components are reworked from synchronous `local-store` to async hooks. A migration adds the columns the built UI needs.

**Tech Stack:** TanStack Start/Router (React 19), Supabase JS (anon key, RLS), React Query, Vitest, shadcn/ui.

**Source spec:** `docs/superpowers/specs/2026-06-21-core-persistence-design.md`

---

## Prerequisites (manual — gate live verification only, not authoring)

- [ ] **Supabase anonymous sign-ins enabled** (same as A) + a Supabase instance (local needs Docker — absent on this machine; or live). Authoring + unit tests need none of this.

---

## File Structure

**Create:**
- `supabase/migrations/20260621000003_survivor_settings_and_timeline_anchor.sql`
- `src/lib/data/statements.ts` (+ `statements.test.ts`), `src/lib/data/useStatements.ts`
- `src/lib/data/timeline.ts` (+ `timeline.test.ts`), `src/lib/data/useTimeline.ts`
- `src/lib/data/settings.ts` (+ `settings.test.ts`), `src/lib/data/useSurvivorSettings.ts`

**Modify:**
- `src/lib/supabase/types.ts` (new columns), `src/lib/auth/session.ts` (+ test — add `onboarded_at` to `Survivor`)
- `src/components/account/StatementList.tsx`, `src/components/account/TimelineList.tsx`
- `src/routes/account.tsx`, `src/routes/settings.tsx`, `src/routes/home.tsx`, `src/routes/onboarding.tsx`
- `src/lib/data/local-store.ts` (trim to documents-only)

**Delete:**
- `src/lib/data/statements.functions.ts`, `src/lib/data/timeline.functions.ts`, `src/components/CloudOffBanner.tsx`

---

## Task 1: Schema migration + types

**Files:** Create `supabase/migrations/20260621000003_survivor_settings_and_timeline_anchor.sql`; Modify `src/lib/supabase/types.ts`.

- [ ] **Step 1: Write the migration**

```sql
-- Settings/aftercare columns the built UI needs + the onboarding-completion marker,
-- and the timeline reconciliation (free-text relative "when" + no-title rows).
-- All on existing tables already covered by survivors_self / timeline_events RLS.

alter table public.survivors
  add column onboarded_at        timestamptz,
  add column calming_anchor      text,
  add column default_visibility  public.content_visibility not null default 'private';

alter table public.timeline_events
  add column relative_anchor text,
  alter column title drop not null;
```

- [ ] **Step 2: Update `src/lib/supabase/types.ts`** (do NOT run `gen:types`/`db:push` — no live migration applied; hand-edit to match, like A's Task 2)

In `survivors` → `Row`, add (alongside the existing fields):
```ts
          onboarded_at: string | null
          calming_anchor: string | null
          default_visibility: Database["public"]["Enums"]["content_visibility"]
```
In `survivors` → `Insert` and `survivors` → `Update`, add to each:
```ts
          onboarded_at?: string | null
          calming_anchor?: string | null
          default_visibility?: Database["public"]["Enums"]["content_visibility"]
```
In `timeline_events` → `Row`: add `relative_anchor: string | null` and change `title: string` to `title: string | null`.
In `timeline_events` → `Insert`: add `relative_anchor?: string | null` and change `title: string` to `title?: string | null`.
In `timeline_events` → `Update`: add `relative_anchor?: string | null` (title is already optional there).

- [ ] **Step 3: Typecheck**

Run: `bunx tsc --noEmit`
Expected: clean (the type edits parse and nothing references a missing field yet).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260621000003_survivor_settings_and_timeline_anchor.sql src/lib/supabase/types.ts
git commit -m "feat(db): add survivor settings/aftercare columns + timeline relative_anchor"
```

---

## Task 2: `statements.ts` data module + hook (TDD)

**Files:** Create `src/lib/data/statements.ts`, `src/lib/data/statements.test.ts`, `src/lib/data/useStatements.ts`.

- [ ] **Step 1: Write the failing tests** — create `src/lib/data/statements.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockClient = { from: vi.fn() };
vi.mock("@/lib/supabase/client", () => ({ getSupabase: () => mockClient }));
vi.mock("@/lib/auth/session", () => ({
  getSurvivor: vi.fn().mockResolvedValue({ id: "sv1", first_name: null, preferred_language: "en" }),
}));

import { listStatements, upsertStatement, deleteStatement } from "./statements";

beforeEach(() => vi.clearAllMocks());

describe("listStatements", () => {
  it("maps raw_text → text and returns newest-first rows", async () => {
    const order = vi.fn().mockResolvedValue({
      data: [{ id: "1", raw_text: "hello", visibility: "private", language: "en", created_at: "t1", updated_at: "t1" }],
      error: null,
    });
    mockClient.from.mockReturnValue({ select: () => ({ order }) });
    const rows = await listStatements();
    expect(rows).toEqual([
      { id: "1", text: "hello", visibility: "private", language: "en", createdAt: "t1", updatedAt: "t1" },
    ]);
    expect(order).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("throws on a query error", async () => {
    mockClient.from.mockReturnValue({ select: () => ({ order: () => Promise.resolve({ data: null, error: { message: "boom" } }) }) });
    await expect(listStatements()).rejects.toThrow("boom");
  });
});

describe("upsertStatement", () => {
  it("inserts a new row with survivor_id + raw_text and maps the result", async () => {
    const single = vi.fn().mockResolvedValue({
      data: { id: "2", raw_text: "new", visibility: "shareable", language: "en", created_at: "t2", updated_at: "t2" },
      error: null,
    });
    const insert = vi.fn(() => ({ select: () => ({ single }) }));
    mockClient.from.mockReturnValue({ insert });
    const row = await upsertStatement({ text: "new", visibility: "shareable" });
    expect(insert).toHaveBeenCalledWith({ survivor_id: "sv1", raw_text: "new", visibility: "shareable", language: "en" });
    expect(row.text).toBe("new");
  });

  it("updates by id without touching survivor_id", async () => {
    const single = vi.fn().mockResolvedValue({
      data: { id: "3", raw_text: "edited", visibility: "private", language: "en", created_at: "t", updated_at: "t" },
      error: null,
    });
    const eq = vi.fn(() => ({ select: () => ({ single }) }));
    const update = vi.fn(() => ({ eq }));
    mockClient.from.mockReturnValue({ update });
    const row = await upsertStatement({ id: "3", text: "edited", visibility: "private" });
    expect(update).toHaveBeenCalledWith({ raw_text: "edited", visibility: "private" });
    expect(eq).toHaveBeenCalledWith("id", "3");
    expect(row.text).toBe("edited");
  });
});

describe("deleteStatement", () => {
  it("deletes by id", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    mockClient.from.mockReturnValue({ delete: () => ({ eq }) });
    await deleteStatement("9");
    expect(eq).toHaveBeenCalledWith("id", "9");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `bun run test`
Expected: FAIL — cannot resolve `./statements`.

- [ ] **Step 3: Implement** — create `src/lib/data/statements.ts`:

```ts
import { getSupabase } from "@/lib/supabase/client";
import { getSurvivor } from "@/lib/auth/session";

export interface StatementRow {
  id: string;
  text: string;
  visibility: "private" | "shareable";
  language: "en" | "es" | null;
  createdAt: string;
  updatedAt: string;
}

interface DbRow {
  id: string;
  raw_text: string;
  visibility: "private" | "shareable";
  language: string | null;
  created_at: string;
  updated_at: string;
}

const COLS = "id, raw_text, visibility, language, created_at, updated_at";

function mapRow(r: DbRow): StatementRow {
  return {
    id: r.id,
    text: r.raw_text,
    visibility: r.visibility,
    language: (r.language as "en" | "es" | null) ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function listStatements(): Promise<StatementRow[]> {
  const { data, error } = await getSupabase()
    .from("statements")
    .select(COLS)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}

export async function upsertStatement(input: {
  id?: string;
  text: string;
  visibility: "private" | "shareable";
}): Promise<StatementRow> {
  const supabase = getSupabase();
  if (input.id) {
    const { data, error } = await supabase
      .from("statements")
      .update({ raw_text: input.text, visibility: input.visibility })
      .eq("id", input.id)
      .select(COLS)
      .single();
    if (error) throw new Error(error.message);
    return mapRow(data as DbRow);
  }
  const survivor = await getSurvivor();
  if (!survivor) throw new Error("not authenticated");
  const { data, error } = await supabase
    .from("statements")
    .insert({
      survivor_id: survivor.id,
      raw_text: input.text,
      visibility: input.visibility,
      language: survivor.preferred_language,
    })
    .select(COLS)
    .single();
  if (error) throw new Error(error.message);
  return mapRow(data as DbRow);
}

export async function deleteStatement(id: string): Promise<void> {
  const { error } = await getSupabase().from("statements").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `bun run test`
Expected: PASS (the statements tests + all prior).

- [ ] **Step 5: Create the hook** — `src/lib/data/useStatements.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listStatements, upsertStatement, deleteStatement } from "./statements";

export function useStatements() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["statements"] });
  const onError = () => toast("We couldn't save that just now.");
  return {
    query: useQuery({ queryKey: ["statements"], queryFn: listStatements }),
    upsert: useMutation({ mutationFn: upsertStatement, onSuccess: invalidate, onError }),
    remove: useMutation({ mutationFn: deleteStatement, onSuccess: invalidate, onError }),
  };
}
```

- [ ] **Step 6: Typecheck + commit**

Run: `bunx tsc --noEmit` (clean)
```bash
git add src/lib/data/statements.ts src/lib/data/statements.test.ts src/lib/data/useStatements.ts
git commit -m "feat(data): add client-side statements module + useStatements hook"
```

---

## Task 3: `timeline.ts` data module + hook (TDD)

**Files:** Create `src/lib/data/timeline.ts`, `src/lib/data/timeline.test.ts`, `src/lib/data/useTimeline.ts`.

- [ ] **Step 1: Write the failing tests** — create `src/lib/data/timeline.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockClient = { from: vi.fn() };
vi.mock("@/lib/supabase/client", () => ({ getSupabase: () => mockClient }));
vi.mock("@/lib/auth/session", () => ({
  getSurvivor: vi.fn().mockResolvedValue({ id: "sv1", first_name: null, preferred_language: "en" }),
}));

import { listTimeline, upsertTimeline, deleteTimeline } from "./timeline";

beforeEach(() => vi.clearAllMocks());

describe("listTimeline", () => {
  it("maps event_date/relative_anchor/description", async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        { id: "1", event_date: "2026-01-01", relative_anchor: null, description: "d", visibility: "private", created_at: "t", updated_at: "t" },
        { id: "2", event_date: null, relative_anchor: "after the move", description: "e", visibility: "private", created_at: "t", updated_at: "t" },
      ],
      error: null,
    });
    mockClient.from.mockReturnValue({ select: () => ({ order }) });
    const rows = await listTimeline();
    expect(rows[0]).toMatchObject({ id: "1", date: "2026-01-01", relativeAnchor: null, description: "d" });
    expect(rows[1]).toMatchObject({ id: "2", date: null, relativeAnchor: "after the move", description: "e" });
  });
});

describe("upsertTimeline", () => {
  it("inserts with survivor_id and a date (no title)", async () => {
    const single = vi.fn().mockResolvedValue({
      data: { id: "3", event_date: "2026-02", relative_anchor: null, description: "x", visibility: "private", created_at: "t", updated_at: "t" },
      error: null,
    });
    const insert = vi.fn(() => ({ select: () => ({ single }) }));
    mockClient.from.mockReturnValue({ insert });
    await upsertTimeline({ date: "2026-02", relativeAnchor: null, description: "x", visibility: "private" });
    expect(insert).toHaveBeenCalledWith({
      survivor_id: "sv1",
      event_date: "2026-02",
      relative_anchor: null,
      description: "x",
      visibility: "private",
    });
  });
});

describe("deleteTimeline", () => {
  it("deletes by id", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    mockClient.from.mockReturnValue({ delete: () => ({ eq }) });
    await deleteTimeline("9");
    expect(eq).toHaveBeenCalledWith("id", "9");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `bun run test` → FAIL (cannot resolve `./timeline`).

- [ ] **Step 3: Implement** — create `src/lib/data/timeline.ts`:

```ts
import { getSupabase } from "@/lib/supabase/client";
import { getSurvivor } from "@/lib/auth/session";

export interface TimelineRow {
  id: string;
  date: string | null;
  relativeAnchor: string | null;
  description: string;
  visibility: "private" | "shareable";
  createdAt: string;
  updatedAt: string;
}

interface DbRow {
  id: string;
  event_date: string | null;
  relative_anchor: string | null;
  description: string | null;
  visibility: "private" | "shareable";
  created_at: string;
  updated_at: string;
}

const COLS = "id, event_date, relative_anchor, description, visibility, created_at, updated_at";

function mapRow(r: DbRow): TimelineRow {
  return {
    id: r.id,
    date: r.event_date,
    relativeAnchor: r.relative_anchor,
    description: r.description ?? "",
    visibility: r.visibility,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function listTimeline(): Promise<TimelineRow[]> {
  const { data, error } = await getSupabase()
    .from("timeline_events")
    .select(COLS)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}

export async function upsertTimeline(input: {
  id?: string;
  date: string | null;
  relativeAnchor: string | null;
  description: string;
  visibility: "private" | "shareable";
}): Promise<TimelineRow> {
  const supabase = getSupabase();
  if (input.id) {
    const { data, error } = await supabase
      .from("timeline_events")
      .update({
        event_date: input.date,
        relative_anchor: input.relativeAnchor,
        description: input.description,
        visibility: input.visibility,
      })
      .eq("id", input.id)
      .select(COLS)
      .single();
    if (error) throw new Error(error.message);
    return mapRow(data as DbRow);
  }
  const survivor = await getSurvivor();
  if (!survivor) throw new Error("not authenticated");
  const { data, error } = await supabase
    .from("timeline_events")
    .insert({
      survivor_id: survivor.id,
      event_date: input.date,
      relative_anchor: input.relativeAnchor,
      description: input.description,
      visibility: input.visibility,
    })
    .select(COLS)
    .single();
  if (error) throw new Error(error.message);
  return mapRow(data as DbRow);
}

export async function deleteTimeline(id: string): Promise<void> {
  const { error } = await getSupabase().from("timeline_events").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
```

- [ ] **Step 4: Run to verify it passes** — `bun run test` → PASS.

- [ ] **Step 5: Create the hook** — `src/lib/data/useTimeline.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listTimeline, upsertTimeline, deleteTimeline } from "./timeline";

export function useTimeline() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["timeline"] });
  const onError = () => toast("We couldn't save that just now.");
  return {
    query: useQuery({ queryKey: ["timeline"], queryFn: listTimeline }),
    upsert: useMutation({ mutationFn: upsertTimeline, onSuccess: invalidate, onError }),
    remove: useMutation({ mutationFn: deleteTimeline, onSuccess: invalidate, onError }),
  };
}
```

- [ ] **Step 6: Typecheck + commit**

Run: `bunx tsc --noEmit` (clean)
```bash
git add src/lib/data/timeline.ts src/lib/data/timeline.test.ts src/lib/data/useTimeline.ts
git commit -m "feat(data): add client-side timeline module + useTimeline hook"
```

---

## Task 4: `settings.ts` + `markOnboarded` + extend `getSurvivor` (TDD)

**Files:** Create `src/lib/data/settings.ts`, `src/lib/data/settings.test.ts`, `src/lib/data/useSurvivorSettings.ts`; Modify `src/lib/auth/session.ts` and `src/lib/auth/session.test.ts`.

> **Deviation from spec (note):** the spec said the support person is written via the `set_support_contact` RPC. The generated RPC type requires `p_phone: string` (non-null), which is awkward for a name-only aftercare entry, and `support_contact_name` is a **plain** (non-encrypted) column the survivor can update under RLS. So we write it directly in the same `survivors` update. The `set_support_contact` RPC stays for a future phone field.

- [ ] **Step 1: Extend `getSurvivor` in `src/lib/auth/session.ts`** so the onboarded marker is readable.

Change the `Survivor` interface to add `onboarded_at`:
```ts
export interface Survivor {
  id: string;
  first_name: string | null;
  preferred_language: string | null;
  onboarded_at: string | null;
}
```
And in `getSurvivor`, change the select to include it:
```ts
    .select("id, first_name, preferred_language, onboarded_at")
```

- [ ] **Step 2: Update `src/lib/auth/session.test.ts`** so the `getSurvivor` "success" test row includes the new field. In the `mockSurvivorQuery({ data: { ... } })` success case, change the data object to:
```ts
      data: { id: "s-1", first_name: null, preferred_language: "en", onboarded_at: null },
```
and the matching `expect(await getSurvivor()).toEqual({ id: "s-1", first_name: null, preferred_language: "en", onboarded_at: null });`

- [ ] **Step 3: Write the failing tests** — create `src/lib/data/settings.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockClient = { from: vi.fn() };
vi.mock("@/lib/supabase/client", () => ({ getSupabase: () => mockClient }));
vi.mock("@/lib/auth/session", () => ({
  getSurvivor: vi.fn().mockResolvedValue({ id: "sv1", first_name: null, preferred_language: "en", onboarded_at: null }),
}));

import { loadSurvivorSettings, saveSurvivorSettings, markOnboarded } from "./settings";

beforeEach(() => vi.clearAllMocks());

describe("loadSurvivorSettings", () => {
  it("reads the survivor row and applies calm defaults", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { preferred_language: "es", default_visibility: "shareable", calming_anchor: "music", support_contact_name: "Sam" },
      error: null,
    });
    mockClient.from.mockReturnValue({ select: () => ({ maybeSingle }) });
    expect(await loadSurvivorSettings()).toEqual({
      language: "es", defaultVisibility: "shareable", calmingAnchor: "music", supportPerson: "Sam",
    });
  });

  it("falls back to en/private/empty when columns are null", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { preferred_language: null, default_visibility: "private", calming_anchor: null, support_contact_name: null },
      error: null,
    });
    mockClient.from.mockReturnValue({ select: () => ({ maybeSingle }) });
    expect(await loadSurvivorSettings()).toEqual({
      language: "en", defaultVisibility: "private", calmingAnchor: "", supportPerson: "",
    });
  });
});

describe("saveSurvivorSettings", () => {
  it("updates the survivor row by id with all fields", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq }));
    mockClient.from.mockReturnValue({ update });
    await saveSurvivorSettings({ language: "es", defaultVisibility: "shareable", calmingAnchor: "walk", supportPerson: "Lee" });
    expect(update).toHaveBeenCalledWith({
      preferred_language: "es", default_visibility: "shareable", calming_anchor: "walk", support_contact_name: "Lee",
    });
    expect(eq).toHaveBeenCalledWith("id", "sv1");
  });
});

describe("markOnboarded", () => {
  it("stamps onboarded_at on the survivor row", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq }));
    mockClient.from.mockReturnValue({ update });
    await markOnboarded();
    expect(update).toHaveBeenCalledTimes(1);
    const arg = update.mock.calls[0][0];
    expect(typeof arg.onboarded_at).toBe("string");
    expect(eq).toHaveBeenCalledWith("id", "sv1");
  });
});
```

- [ ] **Step 4: Run to verify failure** — `bun run test` → FAIL (cannot resolve `./settings`; and the session test will fail until Step 1/2 are in — run after Steps 1–3).

- [ ] **Step 5: Implement** — create `src/lib/data/settings.ts`:

```ts
import { getSupabase } from "@/lib/supabase/client";
import { getSurvivor } from "@/lib/auth/session";

export interface SurvivorSettings {
  language: "en" | "es";
  defaultVisibility: "private" | "shareable";
  calmingAnchor: string;
  supportPerson: string;
}

export async function loadSurvivorSettings(): Promise<SurvivorSettings> {
  const { data, error } = await getSupabase()
    .from("survivors")
    .select("preferred_language, default_visibility, calming_anchor, support_contact_name")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return {
    language: data?.preferred_language === "es" ? "es" : "en",
    defaultVisibility: data?.default_visibility ?? "private",
    calmingAnchor: data?.calming_anchor ?? "",
    supportPerson: data?.support_contact_name ?? "",
  };
}

export async function saveSurvivorSettings(input: SurvivorSettings): Promise<void> {
  const survivor = await getSurvivor();
  if (!survivor) throw new Error("not authenticated");
  const { error } = await getSupabase()
    .from("survivors")
    .update({
      preferred_language: input.language,
      default_visibility: input.defaultVisibility,
      calming_anchor: input.calmingAnchor,
      support_contact_name: input.supportPerson,
    })
    .eq("id", survivor.id);
  if (error) throw new Error(error.message);
}

/** Mark the emotional onboarding complete (powers the /onboarding short-circuit). */
export async function markOnboarded(): Promise<void> {
  const survivor = await getSurvivor();
  if (!survivor) return;
  const { error } = await getSupabase()
    .from("survivors")
    .update({ onboarded_at: new Date().toISOString() })
    .eq("id", survivor.id);
  if (error) throw new Error(error.message);
}
```

- [ ] **Step 6: Run to verify it passes** — `bun run test` → PASS (settings + the updated session getSurvivor test + all prior).

- [ ] **Step 7: Create the hook** — `src/lib/data/useSurvivorSettings.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { loadSurvivorSettings, saveSurvivorSettings, type SurvivorSettings } from "./settings";

export function useSurvivorSettings() {
  const qc = useQueryClient();
  return {
    query: useQuery({ queryKey: ["survivorSettings"], queryFn: loadSurvivorSettings }),
    save: useMutation({
      mutationFn: (s: SurvivorSettings) => saveSurvivorSettings(s),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["survivorSettings"] });
        qc.invalidateQueries({ queryKey: ["survivor"] }); // A-deferred cache fix
      },
    }),
  };
}
```

- [ ] **Step 8: Typecheck + commit**

Run: `bunx tsc --noEmit` (clean)
```bash
git add src/lib/auth/session.ts src/lib/auth/session.test.ts src/lib/data/settings.ts src/lib/data/settings.test.ts src/lib/data/useSurvivorSettings.ts
git commit -m "feat(data): add settings module + markOnboarded; getSurvivor exposes onboarded_at"
```

---

## Task 5: Rework `StatementList` to async hook

**Files:** Modify `src/components/account/StatementList.tsx` (full rewrite).

- [ ] **Step 1: Replace the file** — `src/components/account/StatementList.tsx`:

```tsx
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
    upsert.mutate(
      { text: draftText.trim(), visibility: draftVis },
      { onSuccess: () => { setDraftText(""); setDrafting(false); } },
    );
  };

  const onSaveEdit = (id: string) => {
    if (busy) return;
    upsert.mutate({ id, text: editText.trim(), visibility: editVis }, { onSuccess: () => setEditingId(null) });
  };

  if (query.isLoading) {
    return <p className="text-sm text-muted-foreground">…</p>;
  }

  return (
    <div className="space-y-4">
      {!drafting && (
        <button
          type="button"
          onClick={() => { setDraftVis(defaultVisibility); setDrafting(true); }}
          className="w-full rounded-md border border-dashed border-border px-4 py-3 text-left text-sm text-muted-foreground hover:text-foreground"
        >
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
```

- [ ] **Step 2: Typecheck + commit**

Run: `bunx tsc --noEmit` (clean) and `bun run test` (all prior pass)
```bash
git add src/components/account/StatementList.tsx
git commit -m "feat(account): StatementList persists via useStatements (async)"
```

---

## Task 6: Rework `TimelineList` to async hook

**Files:** Modify `src/components/account/TimelineList.tsx` (full rewrite).

- [ ] **Step 1: Replace the file** — `src/components/account/TimelineList.tsx`:

```tsx
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { copy } from "@/lib/copy";
import { useTimeline } from "@/lib/data/useTimeline";

export function TimelineList({ defaultVisibility }: { defaultVisibility: "private" | "shareable" }) {
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
      { onSuccess: () => { setWhen(""); setWhat(""); setDrafting(false); } },
    );
  };

  if (query.isLoading) {
    return <p className="text-sm text-muted-foreground">…</p>;
  }

  return (
    <div className="space-y-4">
      {!drafting && (
        <button type="button" onClick={() => setDrafting(true)} className="w-full rounded-md border border-dashed border-border px-4 py-3 text-left text-sm text-muted-foreground hover:text-foreground">
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
              <Textarea id="what" value={what} onChange={(e) => setWhat(e.target.value)} className="min-h-24" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={onSave} disabled={busy} className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-40">
                Save
              </button>
              <button type="button" onClick={() => setDrafting(false)} className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground">
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
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{r.date ?? r.relativeAnchor ?? "—"}</div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{r.description}</p>
            <div className="flex justify-end">
              <button type="button" onClick={() => !busy && remove.mutate(r.id)} disabled={busy} className="text-xs text-muted-foreground hover:text-destructive disabled:opacity-40">
                Delete
              </button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

Run: `bunx tsc --noEmit` (clean), `bun run test` (pass)
```bash
git add src/components/account/TimelineList.tsx
git commit -m "feat(account): TimelineList persists via useTimeline (async)"
```

---

## Task 7: Wire Settings, Account, and Home screens

**Files:** Modify `src/routes/settings.tsx`, `src/routes/account.tsx`, `src/routes/home.tsx`.

- [ ] **Step 1: Replace `src/routes/settings.tsx`** (loads/saves via Supabase; hides nothing else):

```tsx
import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { requireSurvivor } from "@/lib/auth/guard";
import { Shell } from "@/components/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { copy } from "@/lib/copy";
import { useSurvivorSettings } from "@/lib/data/useSurvivorSettings";
import type { SurvivorSettings } from "@/lib/data/settings";

export const Route = createFileRoute("/settings")({
  beforeLoad: requireSurvivor,
  head: () => ({ meta: [{ title: "Settings — The Advocate" }] }),
  component: SettingsScreen,
});

function SettingsScreen() {
  const { query, save } = useSurvivorSettings();
  const [form, setForm] = useState<SurvivorSettings>({ language: "en", defaultVisibility: "private", calmingAnchor: "", supportPerson: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (query.data) setForm(query.data); }, [query.data]);

  const onSave = () => {
    setSaved(false);
    save.mutate(form, { onSuccess: () => setSaved(true) });
  };

  return (
    <Shell>
      <div className="space-y-6">
        <h1 className="text-2xl font-normal tracking-tight">{copy.settings.title}</h1>

        <Card>
          <CardHeader><CardTitle className="text-base font-normal">{copy.settings.aftercareSection}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="s1">{copy.onboarding.aftercare.supportLabel}</Label>
              <Input id="s1" value={form.supportPerson} onChange={(e) => setForm((f) => ({ ...f, supportPerson: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s2">{copy.onboarding.aftercare.calmLabel}</Label>
              <Input id="s2" value={form.calmingAnchor} onChange={(e) => setForm((f) => ({ ...f, calmingAnchor: e.target.value }))} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base font-normal">{copy.settings.languageSection}</CardTitle></CardHeader>
          <CardContent className="flex gap-3">
            {(["en", "es"] as const).map((lang) => (
              <button key={lang} type="button" onClick={() => setForm((f) => ({ ...f, language: lang }))}
                className={form.language === lang ? "rounded-md border border-primary bg-primary/10 px-4 py-2 text-sm" : "rounded-md border border-border px-4 py-2 text-sm text-muted-foreground"}>
                {lang === "en" ? copy.settings.languageEn : copy.settings.languageEs}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base font-normal">{copy.settings.sharingSection}</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2">
            {([["private", copy.settings.defaultPrivate], ["shareable", copy.settings.defaultShare]] as const).map(([val, label]) => (
              <label key={val} className="flex items-center gap-2 text-sm">
                <input type="radio" name="dv" checked={form.defaultVisibility === val} onChange={() => setForm((f) => ({ ...f, defaultVisibility: val }))} />
                {label}
              </label>
            ))}
          </CardContent>
        </Card>

        <button type="button" onClick={onSave} disabled={save.isPending} className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40">
          {copy.settings.save}
        </button>
        {saved && <p className="text-center text-xs text-muted-foreground">Saved.</p>}
      </div>
    </Shell>
  );
}
```

- [ ] **Step 2: Edit `src/routes/account.tsx`** — drop the in-memory settings + the Documents tab + the CloudOffBanner. Replace the file:

```tsx
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { requireSurvivor } from "@/lib/auth/guard";
import { Shell } from "@/components/Shell";
import { StatementList } from "@/components/account/StatementList";
import { TimelineList } from "@/components/account/TimelineList";
import { copy } from "@/lib/copy";
import { useSurvivorSettings } from "@/lib/data/useSurvivorSettings";

export const Route = createFileRoute("/account")({
  beforeLoad: requireSurvivor,
  head: () => ({ meta: [{ title: "Your space — The Advocate" }] }),
  component: AccountScreen,
});

type Tab = "statements" | "timeline";

function AccountScreen() {
  const [tab, setTab] = useState<Tab>("statements");
  const { query } = useSurvivorSettings();
  const defaultVisibility = query.data?.defaultVisibility ?? "private";

  return (
    <Shell>
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-normal tracking-tight">{copy.account.title}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{copy.account.intro}</p>
        </header>

        <p className="rounded-md border border-border bg-card px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          {copy.account.sharedNote}
        </p>

        <nav className="flex gap-2 border-b border-border">
          {([["statements", copy.account.tabs.statements], ["timeline", copy.account.tabs.timeline]] as const).map(([k, label]) => (
            <button key={k} type="button" onClick={() => setTab(k)}
              className={tab === k ? "border-b-2 border-foreground px-3 py-2 text-sm text-foreground" : "px-3 py-2 text-sm text-muted-foreground hover:text-foreground"}>
              {label}
            </button>
          ))}
        </nav>

        {tab === "statements" && <StatementList defaultVisibility={defaultVisibility} />}
        {tab === "timeline" && <TimelineList defaultVisibility={defaultVisibility} />}
      </div>
    </Shell>
  );
}
```

> Documents tab + `<CloudOffBanner/>` are intentionally removed here (documents = later slice; banner is obsolete now that data is real).

- [ ] **Step 3: Edit `src/routes/home.tsx`** — `AftercareCard` reads persisted aftercare. Replace the two relevant pieces: remove the `loadAftercare`/`local-store` import and the `plan` line; import the settings hook; pass a plan built from settings.

Replace the import line `import { loadAftercare } from "@/lib/data/local-store";` with:
```ts
import { useSurvivorSettings } from "@/lib/data/useSurvivorSettings";
```
Replace the `HomeScreen` body's `const plan = ...` line with:
```tsx
  const { query } = useSurvivorSettings();
  const plan = query.data
    ? { supportPerson: query.data.supportPerson, calmingThing: query.data.calmingAnchor }
    : null;
```
(The `<AftercareCard plan={plan} title="Your care plan" />` line stays — `AftercareCard` already accepts `{ supportPerson, calmingThing } | null`.)

- [ ] **Step 4: Typecheck + commit**

Run: `bunx tsc --noEmit` (clean), `bun run test` (pass)
```bash
git add src/routes/settings.tsx src/routes/account.tsx src/routes/home.tsx
git commit -m "feat(screens): wire Settings/Account/Home to Supabase persistence; hide Documents tab"
```

---

## Task 8: Onboarding-completion marker + `/onboarding` short-circuit

**Files:** Modify `src/routes/onboarding.tsx`.

- [ ] **Step 1: Mark onboarded on completion + short-circuit on entry.** In `src/routes/onboarding.tsx`:

Add imports (note `requireSurvivor` may already be imported from A's Task 7 — keep a single import):
```ts
import { redirect } from "@tanstack/react-router";
import { requireSurvivor } from "@/lib/auth/guard";
import { getSurvivor } from "@/lib/auth/session";
import { markOnboarded } from "@/lib/data/settings";
```
Replace the route's existing `beforeLoad: requireSurvivor,` with a composed guard that **keeps** A's protection (and its don't-evict-on-transient-error behavior) **and adds** the short-circuit:
```ts
export const Route = createFileRoute("/onboarding")({
  beforeLoad: async () => {
    await requireSurvivor();            // A's guard: SSR-skip, redirect to "/" on a clean no-survivor,
                                        // and crucially does NOT evict on a transient error.
    if (typeof document === "undefined") return;
    const survivor = await getSurvivor().catch(() => null); // transient error → null → no redirect (safe: just shows onboarding)
    if (survivor?.onboarded_at) {
      throw redirect({ to: "/home" });  // already onboarded → skip the emotional flow
    }
  },
  head: () => ({ meta: [{ title: "Begin — The Advocate" }] }),
  component: OnboardingScreen,
});
```
> Why compose rather than replace: `requireSurvivor` owns the SSR-skip + the don't-evict-on-transient-error semantics (the A bug we fixed). Re-deriving the guard inline with `getSurvivor().catch(() => null); if (!survivor) redirect` would reintroduce that eviction bug. So we call `requireSurvivor()` first, then layer the onboarded check (whose own `getSurvivor` failure falls through to showing onboarding — a safe default).

In the `next()` function, when finishing the last step, fire `markOnboarded()` before navigating:
```ts
  const next = () => {
    if (stepIdx === STEPS.length - 1) {
      void markOnboarded();
      void navigate({ to: "/home" });
      return;
    }
    setStepIdx((i) => i + 1);
  };
```

- [ ] **Step 2: Typecheck + commit**

Run: `bunx tsc --noEmit` (clean), `bun run test` (pass)
```bash
git add src/routes/onboarding.tsx
git commit -m "feat(onboarding): stamp onboarded_at on completion + short-circuit returning survivors to home"
```

---

## Task 9: Retire the in-memory store for migrated entities

**Files:** Modify `src/lib/data/local-store.ts`; Delete `src/lib/data/statements.functions.ts`, `src/lib/data/timeline.functions.ts`, `src/components/CloudOffBanner.tsx`.

- [ ] **Step 1: Trim `src/lib/data/local-store.ts` to documents-only.** Remove the Statements, Timeline, Aftercare, and Settings sections (now Supabase-backed). KEEP the header comment, `mem`/`read`/`write`/`newId`, and the **Documents** section + its `DocumentRow` type (still used by the hidden `DocumentList`). After trimming, the file exports only: `newId`, `DocumentRow`, `listDocuments`, `addDocument`, `deleteDocument`.

> Verify nothing else imports the removed functions: `grep -r "from \"@/lib/data/local-store\"" src` — expected importers are only `DocumentList.tsx` (documents fns). If `home.tsx`/`account.tsx`/`settings.tsx` still import it after Tasks 7, fix those imports (they shouldn't).

- [ ] **Step 2: Delete the obsolete files**

```bash
git rm src/lib/data/statements.functions.ts src/lib/data/timeline.functions.ts src/components/CloudOffBanner.tsx
```
> `documents.functions.ts`, `embeddings.functions.ts`, `rag.functions.ts` stay. If `git rm` reports a file is still referenced, grep for the import and remove the usage first (CloudOffBanner was only used by `account.tsx`, removed in Task 7).

- [ ] **Step 3: Typecheck + test + commit**

Run: `bunx tsc --noEmit` (clean — no dangling imports), `bun run test` (all pass)
```bash
git add -A
git commit -m "chore(data): retire in-memory store for persisted entities; remove obsolete stubs + CloudOffBanner"
```

---

## Self-Review notes

- **Spec coverage:** statements persistence (T2, T5) ✓; timeline incl. relative_anchor + nullable title (T1, T3, T6) ✓; settings/aftercare persistence (T1, T4, T7) ✓; `onboarded_at` marker + `/onboarding` short-circuit (T1, T4, T8) ✓; `useSurvivor` cache invalidation (T4 hook) ✓; client-side + RLS, no server fns (all data modules) ✓; retire local-store/CloudOffBanner/inert stubs without breaking the hidden Documents tab (T9 keeps documents-only) ✓; calm error toasts on write failure (T2/T3 hooks) ✓.
- **Deviation (flagged):** support-person write uses a direct `survivors` update of `support_contact_name` rather than the `set_support_contact` RPC — the RPC's generated type rejects a null phone and the name is a plain RLS-updatable column. RPC remains for a future phone field. (Task 4 note.)
- **Out of scope held:** Documents file storage (Storage), Resources verified content, gatekeeper read-views, embeddings/RAG (C), offline caching.
- **Type consistency:** `StatementRow`/`TimelineRow`/`SurvivorSettings` shapes are defined once (T2/T3/T4) and consumed unchanged in the hooks + components; `Survivor` gains `onboarded_at` (T4) and the only `getSurvivor` test asserting the full shape is updated in the same task; hook return shape `{ query, upsert, remove }` / `{ query, save }` used consistently by the components/screens.
- **Carried flags:** live round-trip gated on anon sign-ins + a Supabase instance (no Docker locally) — same as A's Task 8; React Query hooks are thin and unit-untested (the tested risk is the data-function field mapping), consistent with A's `useSurvivor`.
