# Example Story Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the example-story experience from `docs/superpowers/specs/2026-07-18-example-story-demo-design.md`: a coherent bilingual seeded case, one-tap entry, Home offer/banner, practice-person delivery + opener latency, rights chips.

**Architecture:** Content lives in a new `src/lib/data/exampleStory.ts` (EN/ES bundles, parity-tested); `demoSeed.ts` orchestrates clear→seed with the existing RLS-scoped APIs plus coach note, plan items, onboarding mark, and a per-device marker. Entry surfaces (`/judges`, Home) read the marker + demo flag. Prompt delivery lines are additive in `_shared/advocatePrompts.ts` (three function redeploys). Opener pre-generation is a contained refactor in `useLiveAvatarPractice`.

**Tech Stack:** existing stack only — React/TanStack Start, Supabase JS, vitest, shadcn `alert-dialog`.

## Global Constraints

- Seed runs only under `isDemoToolsEnabled()`; keep the throw.
- No "victim", nothing sexual, no graphic violence in any seeded text; usted register in ES.
- Prompt hard rules stay verbatim; delivery lines are additive only.
- Copy shape: every new EN key needs its ES twin (TS enforces via `CopyShape`).
- Commits: simple quiet one-liners.
- The recognition-refusal beat stays out of featured paths.

---

### Task 1: Marker helpers + plan-item delete

**Files:**

- Modify: `src/lib/data/demoTools.ts`
- Modify: `src/lib/data/courtPlan.ts`
- Test: `src/lib/data/demoTools.test.ts`

**Interfaces:**

- Produces: `isExampleLoaded(): boolean`, `setExampleLoaded(on: boolean): void` (localStorage `advocate-example-loaded`, try/catch like the demo flag); `deleteMyCourtPlanItem(id: string): Promise<void>` (direct RLS-scoped delete, `deleteStatement` pattern).

- [x] Add marker helpers to `demoTools.ts` mirroring the existing flag helpers; extend `demoTools.test.ts` with set/read/clear coverage (jsdom localStorage).
- [x] Add to `courtPlan.ts`:

```ts
/** Delete never touches ciphertext, so it stays a direct RLS-scoped call
 *  (court_plan_items_client_delete permits the survivor's own workspace). */
export async function deleteMyCourtPlanItem(id: string): Promise<void> {
  const { error } = await getSupabase().from("court_plan_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
```

- [x] `npm test -- demoTools` → PASS; commit `feat: example marker + plan delete`.

### Task 2: The example story content + seed v2

**Files:**

- Create: `src/lib/data/exampleStory.ts`
- Modify: `src/lib/data/demoSeed.ts`
- Test: `src/lib/data/demoSeed.test.ts`

**Interfaces:**

- Produces: `exampleStoryFor(lang: "en" | "es"): ExampleStory` where `ExampleStory = { statements: {text: string; visibility: "private"|"shareable"}[]; timeline: {date: string|null; relativeAnchor: string|null; description: string}[]; aftercare: {supportPerson: string; calmingAnchor: string}; coachNote: string; planItems: {category: "support"|"question"|"travel"; title: string; details: string}[] }`; `loadExampleData(lang)` (now takes the language), `clearExampleData()`.

- [x] Create `exampleStory.ts` with the spec §4 content verbatim — EN and ES bundles (six statements, #6 private; seven timeline rows with the two real dates `2023-03-10`, `2025-11-02`; aftercare "My sister, Ana" / "A song my mother used to sing"; the coach note; three plan items support/question/travel). ES in usted register (translations in spec + this plan's executor context).
- [x] Rework `demoSeed.ts`: keep gate + clear-then-seed; clear now also deletes plan items (`listMyCourtPlanItems` → `deleteMyCourtPlanItem`) and blanks the coach note (`saveCoachNote("")`); seed order: `syncLanguageToServer(lang)` → statements (index each) → timeline → aftercare → `saveCoachNote(note)` → plan items (`createMyCourtPlanItem`) → `markOnboarded()` → `setExampleLoaded(true)`. `clearExampleData()` = clear steps + `setExampleLoaded(false)`.
- [x] Tests: EN/ES parity (same shapes/counts, exactly one private statement each, both real dates present); gate still throws when disabled; seed invokes coach note + plan items + marker (module mocks).
- [x] `npm test -- demoSeed` → PASS; commit `feat: the example story, whole app`.

### Task 3: Copy keys (EN + ES)

**Files:**

- Modify: `src/lib/copy/en.ts`, `src/lib/copy/es/index.ts`

**Interfaces:**

- Produces: `copy.home.example.{offerTitle,offerBody,offerLoad,offerNotNow,bannerTitle,bannerPath,clear,chips:{words,order,coach,practice,draft,shared},reloadTitle,reloadBody,reloadConfirm,reloadCancel,loading,failed}` and `copy.session.witness.rightsChips: readonly string[]` (3 items).

- [x] EN values per spec §5.2/§5.3 (offer card, banner, chips, clear, re-load dialog wording; loading/failed lines reuse current button copy). Rights chips: `["“I don’t know” is allowed", "You can ask for a repeat", "“Stop” ends it"]`.
- [x] ES twins (usted; stop word "alto" to match the consent copy): e.g. offerTitle "¿Quiere ver un ejemplo primero?", bannerTitle "Este espacio tiene un ejemplo inventado — no es una persona real.", chips "Sus palabras / En su orden / Su Coach / El estrado / Un borrador para su abogado / Lo que ella compartió", rightsChips `["Decir “no sé” está permitido", "Puede pedir que repitan", "“Alto” lo detiene"]`.
- [x] `npx tsc --noEmit` → clean (shape enforced); commit `feat(copy): example + practice keys`.

### Task 4: Home offer card, banner, dialog

**Files:**

- Modify: `src/routes/home.tsx`
- Test: extend `src/lib/data/demoSeed.test.ts` only if logic moves; UI gating verified in Task 8's browser pass.

**Interfaces:**

- Consumes: Task 1 marker helpers, Task 2 `loadExampleData`/`clearExampleData`, Task 3 keys, `useLang()`.

- [x] Replace the dashed button + native `confirm()` with: (a) offer `Card` when `demoVisible && !exampleLoaded && spaceEmpty` (`spaceEmpty` from a light `useQuery(["exampleEmptyCheck"], () => Promise.all([listStatements(), listTimeline()]))` both empty; "Not now" dismisses via state for the visit); (b) example banner (amber family, chips linking `/account`, `/account#timeline`, `/session`, `/session`, `/account`, `/team`) + "Clear the example" when `demoVisible && exampleLoaded`; (c) `AlertDialog` for re-loading over a non-empty space (title/body/confirm/cancel from Task 3), calling `seed.mutate(lang)`.
- [x] Keep the existing seed mutation shape (`invalidateQueries()`, navigate stays on `/home` now so the banner is the landing).
- [x] `npx tsc --noEmit` clean; commit `feat(home): example offer + banner`.

### Task 5: One tap from /judges

**Files:**

- Modify: `src/routes/judges.tsx`

**Interfaces:**

- Consumes: `setDemoToolsEnabled`, `createSelfServeSurvivor`, `loadExampleData`, `isExampleLoaded`, `listStatements`, `listTimeline`, `getLangPref`.

- [x] Add primary button "Open the app with the example story" to the Reviewer tools card: `setDemoToolsEnabled(true)` → `createSelfServeSurvivor()` → if space non-empty and `!isExampleLoaded()` skip seeding, else `loadExampleData(getLangPref())` → `navigate({ to: "/home" })`. Busy label "Opening the example…"; on failure navigate to `/home` anyway (offer card is the fallback) after showing the error line inline. Existing enable-only button stays as secondary.
- [x] Commit `feat(judges): one-tap example`.

### Task 6: Rights chips in the Witness Stand

**Files:**

- Modify: `src/routes/session.tsx` (live stage, `witnessStand` true — under the practice video / voice practice surface)

- [x] Muted chip row (`copy.session.witness.rightsChips.map(...)`, `rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground`) rendered for both avatar and voice practice; not in coach modes.
- [x] Commit `feat(session): the rights, visible`.

### Task 7: Practice delivery lines + opener pre-generation

**Files:**

- Modify: `supabase/functions/_shared/advocatePrompts.ts`, `src/lib/voice/useLiveAvatarPractice.ts`

- [x] Append the five delivery lines from spec §6.1 to `DEFENSE_PRACTICE_PROMPT` (before PACING), and the acknowledge/vary/short-line guidance to `COACH_DEFENSE`; hard rules untouched.
- [x] In `useLiveAvatarPractice`: extract generation from `generateAndSpeak` into `generateLine(opening, history, account): Promise<string|null>`; in `attempt()` after the token resolves, start `openerPromise = generateLine(true, [], account)`; on CONNECTED, `const text = (await openerPromise) ?? await generateLine(true, ...)` then existing history-push/caption/`session.repeat` path with the `sessionRef` guard. Speak-time behavior unchanged.
- [x] `npm test` full suite → PASS; commit `feat(practice): steadier voice, faster opener`.
- [x] Redeploy: `npx -y supabase@latest functions deploy advocate-agent advocate-defense-llm advocate-voice-token --project-ref suanbsyewsudlhrrzfks` (each imports the prompt module).

### Task 8: Verify end to end, ship

- [x] `npx tsc --noEmit`, `npm test`, `npx prettier --check` on touched files, `npm run lint` — all clean.
- [x] Local Playwright (scratchpad rig, dev server): `/judges` one-tap → Home banner present → `/account` shows six statements (one marked private) → timeline seven rows → `/session` practice consent → rights chips visible; repeat seed in ES UI and spot-check Spanish rows; clear-example returns Home to the offer card.
- [ ] Push (quiet one-liner), watch CI, prod verify by rendered DOM: `/judges` one-tap path on prod creates a fresh anon example space; banner + seeded account render.

## Self-review notes

- Spec coverage: §4→Tasks 1–2, §5→3–5, §6→6–7, §7/§9 are demo-day docs (no code), §11→Tasks 2/8.
- Types consistent: `loadExampleData(lang: "en"|"es")` used in Tasks 2/4/5; marker helper names identical across 1/4/5.
- No placeholders: seed content is pinned verbatim in spec §4 + ES bundle above; executor implements from both.
