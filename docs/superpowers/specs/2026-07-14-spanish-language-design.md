# Spanish Language Support — Design

**Date:** 2026-07-14 (evening)
**Status:** Direction approved in conversation (user: full Spanish tonight, language button top menu, coming-soon list).
**Owner:** Lee. Native-speaker SME review of all Spanish copy should follow via the expert channel.

## 1. What this is

When a person chooses Español, every survivor-facing and public written surface
renders in Spanish. A language control lives in the Shell header. Five further
languages appear as "coming soon" (not implemented): 中文 (Mandarin), Tagalog,
한국어 (Korean), Tiếng Việt (Vietnamese), Русский (Russian) — the most-requested
languages after Spanish in U.S. anti-trafficking hotline access patterns; each
listed in its own script for instant recognition.

## 2. Decisions

| Decision | Choice | Why |
|---|---|---|
| Mechanics | **Instant client swap** | SSR keeps rendering English; a `LangProvider` initializes to "en" (matching SSR, so no hydration mismatch) and switches to the stored language on mount. Sub-second English flash on cold loads for es users; zero SSR/caching/PWA risk. Upgrade path: cookie-based SSR later. |
| Scope tonight | **Survivor + public surfaces** | Translate: index, begin, enter, onboarding, home, session UI, break, guide, notebooks (all 9), study guides (all 10), resources, account, plan, team, settings, privacy, sources headings. English-only tonight: /judges, /tour, /professional*, /expert, /dev, document titles (head/meta), AI prompts, citation titles (proper names). |
| Register | **usted**, LatAm-neutral (es-419) | Standard in U.S. victim-services Spanish (DOJ/OVC). Warm-respectful, ≤6th-grade, calm, experience-based — same rules as English. Applied consistently so a native reviewer can flip to tú mechanically if preferred. |
| Language rules (es) | Mirrored | No urgency words (es list: "ahora mismo", "date prisa", "apúrese", "urgente", "no se lo pierda"); "víctima" banned except the role phrase "víctimas y testigos" (as in "personal de asistencia a víctimas y testigos"); guide 08 quotes the official form name in English ("victim impact statement") since U.S. court forms are English — the es text explains it. |
| Narration | English only for now | Spanish narration is a later one-command run once es text is reviewed (`<stepId>.es.mp3`). |

## 3. Architecture

- **`src/lib/copy/es/index.ts`** — `export const copyEs: typeof copy = {…}`.
  The `typeof copy` annotation makes completeness a **compile error**, not a QA task.
- **`src/lib/copy/es/notebooks.ts`** — `notebooksEs: readonly Notebook[]` (same slugs/order).
- **`src/lib/copy/es/studyGuides.ts`** — `studyGuidesEs: readonly StudyGuide[]`
  (same slugs, step ids, step counts, vocab mark parity — enforced by tests; `audio`
  flags stay unset on es until Spanish narration exists).
- **`src/lib/lang-context.tsx`** — `LangProvider` (state starts "en"; on mount reads
  `getLangPref()`), `useLang()` → `{ lang, setLang }`. `setLang` calls the existing
  `setLangPref` (localStorage + `<html lang>`) and, when a survivor session exists,
  persists `preferred_language` server-side via the existing profile path.
- **`useCopy()` / `useNotebooks()` / `useStudyGuides()`** — return the en or es
  object by context. Components migrate from `import { copy }` to `const c = useCopy()`
  on in-scope surfaces only. Context default value is the en bundle, so tests need no wrapper.
- **Shell header language button** — lucide `Globe`, right-hand group, aria
  "Language / Idioma". Opens a menu: English ✓ / Español, then a "Coming soon ·
  Próximamente" section listing the five scripts, disabled. Selection swaps instantly.
- Out-of-scope routes simply keep importing the static en `copy` — untouched behavior.

## 4. Testing

- Existing suites unchanged (context defaults to en).
- New `src/lib/copy/es/es.test.ts`: structural parity en↔es (slugs, ids, counts,
  checkIn answer ranges, `[[mark]]` resolution against es vocab) + es banned-word
  lint (urgency list; `víctima` with the two allowed exceptions above).
- Component test: language menu renders both live languages + five disabled
  coming-soon rows; selecting Español swaps a probe string.
- Browser walkthrough addition: toggle to Español on the live shelf → h1 becomes
  "Guías de estudio"; storage contains only the pre-existing `advocate-lang` key.

## 5. Out of scope tonight

Coming-soon language content; Spanish narration; head/meta titles; /judges, /tour,
professional/expert/dev portals; AI prompt translation; cookie-based SSR rendering.
The approved Brainery-feel visual pass is queued as the next project after this ships.
