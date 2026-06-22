# The Advocate — Sub-project B: Core Persistence — Design Spec

> **Status:** Approved design, ready for implementation plan (`writing-plans`).
> **Date:** 2026-06-21
> **Decomposition:** A (done) → **B (this)** → C (session/voice). B core persistence is itself the first slice of B; documents (file storage) and Resources verified content are separate follow-on slices.

---

## 1. Context & current state (verified post-pull, `main` @ `7031c27`)

Sub-project A shipped the gated front door: a survivor reaches the app as an authenticated **anonymous Supabase identity** with a `survivors` row, and RLS scopes every table to `current_survivor_id()`. The survivor-facing screens already exist (Lovable built them) and carry A's `requireSurvivor` guard — **but they all run on `src/lib/data/local-store.ts`, an in-memory `Map` that resets on every refresh.** The Supabase `*.functions.ts` are inert stubs (`return []`, `TODO(cloud-on)`). So the screens look finished and persist nothing.

**B makes the data real:** wire statements, timeline, and settings/aftercare to Supabase (client-side, RLS), replacing the in-memory store, and close the A-deferred items.

**Two findings from the code that shape the work (the "swap is a one-liner" comment is wrong):**

1. **Sync → async rework.** `StatementList`/`TimelineList` call **synchronous** `local-store` functions (`listStatements()`, `upsertStatement(...)`, `deleteStatement(id)`) with a `refresh()`-after-mutate pattern and `useState(() => list())`. Supabase is async, so these components must be reworked to async data (React Query: loading/empty states, async save/delete, invalidate-on-success).
2. **Schema ↔ built-UI mismatches** (resolved in B1):
   - The timeline UI captures a free-text **"when"** that is *either* a date *or* a relative phrase ("after the move"), but `timeline_events` only has `event_date` — **no `relative_anchor`**.
   - `timeline_events.title` is **`NOT NULL`**, but the UI captures only "what happened" (→ `description`), no title.
   - The settings/aftercare UI captures **"what calms me"** and a **default-visibility** preference — **no columns exist** for either; and **`onboarded`** (A §5) has no marker.

---

## 2. Scope

**In scope (B core):**
- Persist **statements** (create/edit/delete, visibility) to Supabase under RLS.
- Persist **timeline** (date *or* relative anchor + description + visibility).
- Persist **settings/aftercare** (language, default-visibility, "what calms me", support person).
- A-deferred items: **`onboarded_at` marker + `/onboarding` short-circuit**, **`useSurvivor` cache invalidation**, **aftercare → `survivors` row**.
- Retire the in-memory store and the now-misleading "Cloud off" affordances.

**Out of scope (explicit — separate slices):**
- **Documents** file upload (Supabase Storage bucket, signed URLs, storage RLS) — the Documents tab is **hidden** in B core.
- **Resources** real verified hotline content (needs vetted data; currently `<PlaceholderTag/>` placeholders).
- Gatekeeper shareable-read views; embeddings/RAG generation (C); any **offline caching** of survivor data (intentionally none — survivor data is `NetworkOnly` per the SW).

---

## 3. Architecture (decided)

**Client-side Supabase + RLS**, consistent with A. Screens call `getSupabase().from('statements')…` directly from the browser; the anon JWT carries the survivor identity and RLS enforces per-survivor access. No server functions, no service role, no session-threading — there is no security benefit to a server hop here because RLS already scopes the data. The `createServerFn` CRUD scaffolds are retired (the `embeddings`/`rag` server-fns remain for C, which genuinely needs the service role + AI gateway).

**Edit history is free:** `content_revisions` `BEFORE UPDATE` triggers already snapshot statement/timeline edits — B does nothing extra for versioning.

---

## 4. Schema migration — `supabase/migrations/20260621000003_survivor_settings_and_timeline_anchor.sql`

*(Re-confirm the number before building — latest existing is `…000002_redeem_access_code`; bump if Lovable lands a migration first.)*

```sql
-- Settings/aftercare columns the built UI needs, the onboarding-completion marker,
-- and the timeline reconciliation (free-text "when" + no-title rows). All on existing
-- tables already covered by survivors_self / timeline_events RLS — no new policies.

alter table public.survivors
  add column onboarded_at        timestamptz,
  add column calming_anchor      text,
  add column default_visibility  public.content_visibility not null default 'private';

alter table public.timeline_events
  add column relative_anchor text,          -- the UI's "after the move" / "around last winter"
  alter column title drop not null;         -- UI captures only "what happened" → description
```

- **Support person** (aftercare) → existing `survivors.support_contact_name`, written via the existing `set_support_contact(p_survivor_id, p_name, null)` RPC (name-only; no phone). **Language** → existing `survivors.preferred_language`.
- No RLS changes (survivors_self and the timeline_events policies already cover these columns).

---

## 5. Client data layer (`src/lib/data/`)

New browser modules; each function resolves the current survivor id once (from `getSurvivor()`/cache) and sets `survivor_id` on inserts to satisfy RLS `with check (survivor_id = current_survivor_id())`.

**Row mappings (camel ↔ snake):**

| UI type | Supabase row |
|---|---|
| `StatementRow.text` | `statements.raw_text` |
| `StatementRow.visibility` | `statements.visibility` (`content_visibility`: `private`/`shareable` — matches) |
| `StatementRow.language` | `statements.language` (default to survivor's `preferred_language` on create) |
| `TimelineRow.date` | `timeline_events.event_date` |
| `TimelineRow.relativeAnchor` | `timeline_events.relative_anchor` (new) |
| `TimelineRow.description` | `timeline_events.description` |

**Modules:**
- `statements.ts` — `listStatements()`, `upsertStatement({id?, text, visibility})`, `deleteStatement(id)` → `getSupabase().from('statements')`, mapping fields, `order('created_at', desc)`.
- `timeline.ts` — `listTimeline()`, `upsertTimeline({id?, date, relativeAnchor, description, visibility})`, `deleteTimeline(id)`. Keep the existing date-vs-anchor heuristic (`/^\d{4}(-\d{2}(-\d{2})?)?$/`) at the call site; persist `event_date` OR `relative_anchor` accordingly.
- `settings.ts` — `loadSurvivorSettings()` → `{ language, defaultVisibility, calmingAnchor, supportPerson }`; `saveSurvivorSettings(...)` (updates `preferred_language`, `default_visibility`, `calming_anchor`; calls `set_support_contact` RPC for the support person); `markOnboarded()` → set `onboarded_at = now()`. (Distinct from A's `session.ts.updateProfile`, which is the onboarding-time write of `preferred_language`/`first_name`; both writing `preferred_language` is fine — RLS-scoped, last-write-wins.)
- **React Query hooks** — `useStatements()`, `useTimeline()`, `useSurvivorSettings()` (query + `useMutation`s) with cache invalidation on success; invalidate `["survivor"]` after settings/profile changes (the A-deferred fix).

**Retire (B core):** stop using `local-store.ts` for statements/timeline/settings/aftercare (now Supabase-backed). **Do not delete `local-store.ts`** — `DocumentList` still imports its document functions, and the Documents tab is only *hidden* (deferred), so the file remains as the documents-only temporary store until the documents slice (trim it to just the document functions). Remove `<CloudOffBanner/>` usage (the component file can go). Delete the inert `statements.functions.ts` / `timeline.functions.ts` CRUD stubs. **Keep** `documents.functions.ts` (future documents slice) and `embeddings.functions.ts` / `rag.functions.ts` (C).

---

## 6. Screen rework

- **Account (`/account`):** `StatementList` and `TimelineList` consume the new hooks — loading skeleton, async save/delete, calm empty states (existing `copy.account.*.empty`). Remove `<CloudOffBanner/>`. Default visibility comes from persisted settings. **Documents tab hidden** in B core (the tab nav drops to statements/timeline; re-enabled in the documents slice).
- **Settings (`/settings`):** load from `loadSurvivorSettings()`, save via `saveSurvivorSettings(...)`; keep the calm "Saved." confirmation; surface a calm failure message if a save errors (don't crash).
- **Home (`/home`):** `AftercareCard` reads the persisted aftercare (`support_contact_name` + `calming_anchor`) via the settings hook instead of `loadAftercare()`; wire the onboarded short-circuit (below).

---

## 7. Onboarding-completion marker + short-circuit (A-deferred §5)

- `markOnboarded()` fires when the emotional `/onboarding` flow completes (the final **"rules"** step → `/home`).
- **Routing:** `/onboarding`'s `beforeLoad` redirects to `/home` when `onboarded_at` is set — a returning, onboarded survivor never replays the emotional onboarding. (`/enter` re-entry stays idempotent per A.) This realizes A §5's "guard resolves `{ session, survivorId, onboarded }` → onboarded → home" intent.

---

## 8. Error handling & safety

- **Reads** (list queries) failing → calm empty/retry state, never a crash (React Query error state + a quiet message). Consistent with A's "don't evict / don't crash" posture.
- **Writes** (save/delete) failing → a calm `sonner` toast ("We couldn't save that just now."), the draft is preserved, the survivor is not bounced. No silent data loss.
- **RLS** is the security boundary; the client never sets another survivor's `survivor_id` (it uses the resolved current id, and RLS `with check` rejects anything else).
- **No offline caching** of survivor data (SW keeps `*.supabase.*` `NetworkOnly`); B does not add any local persistence.

---

## 9. Testing

- **Unit (Vitest, mocked Supabase client)** — the data functions map fields correctly (`text`↔`raw_text`, date-vs-`relative_anchor`), set `survivor_id`, and surface errors as rejections; `markOnboarded` writes `onboarded_at`; `saveSurvivorSettings` routes the support person through `set_support_contact`. Same mocking pattern as A's `session.test.ts`.
- **Routing** — the `/onboarding` `onboarded_at` short-circuit (mocked survivor with/without `onboarded_at`).
- **Manual round-trip** (gated on anonymous sign-ins, same prerequisite as A's Task 8): add a statement → refresh → it persists; edit/delete; a timeline date vs. a relative anchor; settings persist; a returning onboarded survivor lands on `/home` without replaying onboarding.

---

## 10. Implementation prerequisites

1. **Supabase anonymous sign-ins enabled** (the same A prerequisite — B's persistence is inert until a survivor can authenticate). Live dashboard for `suanbsyewsudlhrrzfks` + `enable_anonymous_sign_ins = true` in `config.toml` for local.
2. Apply migration `20260621000003_…` and regenerate types (`bun run gen:types`).
3. A container runtime (Docker) for the local round-trip, or test against live — currently absent on the dev machine (see A's deferred Task 8).

---

## 11. Out of scope / carried flags

- **Documents** file storage (next B slice): Storage bucket upload, signed URLs, storage RLS, metadata rows; re-enable the Account Documents tab.
- **Resources** verified content (separate slice): replace `<PlaceholderTag/>` hotline placeholders with vetted data; decide whether `/resources` stays public (crisis-reachable pre-auth) — it is currently unguarded.
- The schema's richer `timeline_events` model (real `title`, `event_date` calendar UI, before/after event ordering) is a future enhancement beyond the built free-text UI.
- Gatekeeper shareable-read views; embeddings/RAG (C).
