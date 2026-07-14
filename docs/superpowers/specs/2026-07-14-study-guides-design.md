# Study Guides — Design

**Date:** 2026-07-14
**Status:** Design approved in conversation, section by section; awaiting final spec review.
**Owner:** Lee (content approval on every guide before ship).

## 1. What this is

Tend gains a set of **hand-authored, interactive study guides** — bigger, richer
learning experiences than the notebooks — helping survivor-witnesses understand
court concepts and situations at a ≤6th-grade reading level. The *concept* is
ported from MindCrafter's Brainery study-guide player (a paged guide made of
optional add-on blocks); the *implementation* is a fresh, Tend-native build.

Nothing is generated at runtime. No AI features ship in this work. Every word
is authored under Tend's language rules, reviewed by Lee, and committed as
static content — the same trust model as the notebooks.

## 2. Decision log (how we got here)

| Decision | Choice | Why |
|---|---|---|
| Player vs. generator | **Player only** | Runtime AI generation of court-adjacent content is a liability Tend must not carry. Content is hand-authored and vetted. |
| Build approach | **Native rebuild** (Approach A) | MindCrafter's 2,312-line player drags framer-motion, Supabase, and its theme system; a Tend-idiom rebuild is smaller, auditable, and honors the motion rules. Nothing is copied wholesale. |
| Guide count | **10** (cap 12) | Ten topics fill real gaps without duplicating `/guide` or the 9 notebooks. Reserves if needs emerge: "Restitution, simply", "Coming to court from far away". |
| Check-ins | **Gentle, unscored** | Retrieval aids understanding; scoring is testing. Optional, kind explanations, nothing saved. |
| Narration | **Pre-generated OpenAI TTS MP3s** | Warmth matters for this audience; generated once from approved text at authoring time (existing OpenAI account, ~$1–2 one-time). No runtime AI, no new vendor. Device-voice and no-audio options were considered and declined. |
| Games | **None. Cut entirely.** | See §3 red lines. Arcade/Voyager/Scriptorium ports were evaluated (49 games inventoried) and rejected: built for teens, dignity risk for adults in crisis, stress eats the executive function games demand, and "pick the right definition" is testing in disguise. Five calmer candidates (pairs, sorter, ordering, practice ladder, plan-recall) were proposed and also declined as not genuinely useful. |
| Personalization | **None** | "Practice remembering your plan" widgets were considered and dropped with the games. See §3 for the hard line on personalized memory practice. |

## 3. Non-negotiable constraints

These are Tend's standing rules; the guides inherit all of them.

- **Language:** experience-based (never "victim"), ≤6th-grade reading level,
  calm and still, no urgency words. All guide copy lives in the copy module
  layer and follows `src/lib/copy/index.ts` header rules.
- **Never coach, script, or shape testimony.** Guides describe what to
  *expect*; only the person, in their own words, says what happened. Stories
  are clearly labeled fictional composites. Nothing may invite a person to
  rehearse, reconstruct, or drill *their own account* — memory practice over a
  user's own statements is witness coaching, harms real memory, and is
  explicitly rejected for all future iterations of this feature, not just v1.
- **Zero traces:** public routes, no auth, no localStorage, no progress
  records, nothing saved from check-ins. Leaving mid-guide leaves nothing
  behind.
- **Motion:** nothing moves on its own. Transitions only on user interaction;
  instant under OS reduce-motion or Tend's Stillness toggle
  (`html[data-motion="off"]`). No confetti, no autonomous animation.
- **Always-visible safety:** guides render inside `Shell` — "Leave now" and
  "I need a break" on every step.
- **Not legal advice:** every guide carries the shared disclaimer and points
  back to "your advocate or lawyer."

## 4. The ten guides

| # | Slug (proposed) | Title | Helps someone understand | Gap it fills |
|---|---|---|---|---|
| 01 | `path-of-a-case` | The path of a case | The whole journey: charges, hearings, maybe a deal, maybe a trial, sentencing, after | No end-to-end map exists |
| 02 | `who-is-who-in-court` | Who's who in the courtroom | Every person in the room, their role, who is and isn't "for you" | `/guide` gives it 6 bullets |
| 03 | `words-you-will-hear` | Words you'll hear | Courtroom language in depth | Extends the 13-term glossary |
| 04 | `the-day-you-testify` | The day you testify | The full arc: waiting room → called in → oath → questions from each side → stepping down | `/guide` covers in bullets |
| 05 | `cross-examination` | Cross-examination and objections | Why the other side pushes, how objections protect, the right to pause | Notebook 03 covers myths; this covers mechanics |
| 06 | `your-rights` | Your rights in the process | Rights to be told, to be present, to be heard, to protection and privacy | Biggest gap |
| 07 | `evidence-simply` | Evidence, simply | What evidence is, exhibits, why some things can't be said, why lawyers interrupt | Gap |
| 08 | `being-heard` | Being heard: impact statements | What an impact statement is, forms it can take, that it's always a choice | One notebook card today |
| 09 | `privacy-and-protection` | Privacy and protection | How courts protect people: limits on questions about the past, sealed records, no-contact orders | Gap |
| 10 | `after-the-case` | After the case ends | Verdicts, sentencing, why appeals happen, what "over" means | Only the "deals" ending covered |

Editorial notes: guide 08 requires the most care — it describes what impact
statements *are* without suggesting content (same discipline as notebook 03's
"expect, don't script" note). Sourcing: reviewed public research in
`docs/research/` plus public court-preparation guidance (OVC, NCVLI-class
sources); citations land in `/sources` (`SOURCE_GROUPS`).

Authoring workflow: Claude drafts each guide → Lee reviews/edits/approves →
only then is narration generated. Guides ship in reviewed batches; partial
shelves are fine (shelf simply shows what exists).

## 5. Content model

New module `src/lib/copy/studyGuides.ts` (sibling of `notebooks.ts`, same
header rules), exporting `studyGuides: readonly StudyGuide[]` and
`studyGuideBySlug()`.

```ts
type GuideColor = NotebookCover; // reuse the 9 calm cover colors

interface StudyGuide {
  slug: string;
  index: string;          // "01"
  title: string;
  cover: string;          // one calm line for the shelf
  tab: string;            // spine label
  color: GuideColor;
  minutes: number;        // honest estimate; shown as "about N minutes — no rush"
  vocab: VocabTerm[];     // this guide's tappable terms (may be empty)
  steps: GuideStep[];     // one step = one screen
  close: string;          // quiet closing line, rendered on the last step
}

interface GuideStep {
  id: string;             // stable; names the narration file
  title: string;          // shows in "Inside this guide" contents
  audio?: boolean;        // set true once narration is generated & committed
  blocks: GuideBlock[];   // usually 1–2 blocks per step
}

type GuideBlock =
  | { kind: "intro"; body: string; note?: string }          // note = framing box
  | { kind: "summary"; points: string[] }                   // "In short"
  | { kind: "card"; title: string; body: string; ask?: string }
  | { kind: "quote"; text: string; meaning: string }        // tap-to-flip
  | { kind: "story"; title: string; paragraphs: string[] }  // renders fixed label:
      // "A story, not a real person — to show what it can be like."
  | { kind: "timeline"; steps: { title: string; body: string }[] }
  | { kind: "checkIn"; intro?: string; questions: {
      prompt: string; choices: string[]; answerIndex: number; explain: string;
    }[] };                                                  // optional, unscored

interface VocabTerm { term: string; meaning: string }
// Any body-bearing field (card body, intro body, summary points, story
// paragraphs, timeline bodies) may mark a term as [[term]]; the renderer
// swaps marks for tappable words (popover definition). The guide's last
// step auto-appends a "Words from this guide" list.
```

Check-in microcopy is fixed: "Want to try a few questions? Just for you —
nothing is saved." Every question always shows a kind explanation after a tap,
never "wrong," never a tally.

## 6. Routes, components, UX

**Routes** (TanStack Start, file-based, public, `head: pageTitle(...)`):

- `src/routes/study.tsx` — the shelf. Paper covers (reuse `.notebook-cover`
  CSS family), numbered spines, cover line, "about N minutes — no rush".
  Self-index layout rendering `<Outlet/>` (same pattern as `notebooks.tsx`).
  Shelf intro (proposed, Lee may rename): "Bigger topics, taken one small step
  at a time. Open what helps, skip what doesn't."
- `src/routes/study.$slug.tsx` — the player. Unknown slug → calm not-found →
  back to shelf (notebooks pattern).

**Player behavior:**

- **Paged, one step per screen** (tour-style chaptering, not notebook scroll):
  ruled-paper interior, "step 3 of 9" dots, Prev/Next. One idea per screen.
- First page is always **"Inside this guide"** — the step list; tap any step to
  jump. Everything skippable; nothing gated; no completion state.
- Page changes only on tap; soft crossfade at most, instant under
  Stillness/reduce-motion.
- **Listen button** per narrated step: plays `public/audio/study/<slug>/<stepId>.mp3`,
  user-initiated, stops on navigation/unmount. Hidden if the file isn't
  shipped yet (content can precede narration).
- Disclaimer footer on every guide (shared const, `NOTEBOOK_DISCLAIMER`
  pattern) linking to `/sources`.

**Components** in `src/components/study/`: `GuidePager`, `GuideStepView`
(block switch), `FlipCard`, `TimelineList`, `CheckIn`, `VocabText` (mark
parser + popover), `ListenButton`. Styling: existing paper utilities, sage
accents, lucide `strokeWidth={2}`, 34ch measure inherited globally.

**Entry points:** a Tile on `/home`; a "Bigger guides, one step at a time"
card on `/guide` (alongside the existing notebooks card); a quiet cross-link
on the notebooks shelf. **Not** added to the Shell footer nav (full at 7).

## 7. Narration pipeline

- Script `scripts/generate-narration.mjs` (checked in; plain `fetch`, no SDK):
  for each approved guide step, calls OpenAI TTS (`gpt-4o-mini-tts`) with
  style instructions — *calm, warm, unhurried, low energy* — and writes
  `public/audio/study/<slug>/<stepId>.mp3`.
- Run manually, once per approved guide (or after copy edits). Requires
  `OPENAI_API_KEY` in the local env; never runs in CI or at runtime.
- MP3s are committed (≈20 MB total for ten guides; mono, modest bitrate) and
  served statically by Vercel.
- Service worker: narration files are **excluded from precache**; cached at
  most on demand. PWA install stays light.
- Spanish: deferred until Tend's language toggle ships content-wide; the
  pipeline handles it when the time comes.

## 8. Trust plumbing

- **Disclaimer:** shared `STUDY_GUIDE_DISCLAIMER` (wording mirrors
  `NOTEBOOK_DISCLAIMER`) on every guide page.
- **Sources:** new citation group(s) in `src/routes/sources.tsx`
  `SOURCE_GROUPS` covering guide research.
- **AI-coach awareness:** one migration mirroring the study-guide index
  (slug, title, one-line summary) into `project_knowledge`, copying the
  `20260705000004_notebook_knowledge.sql` pattern — so the coach can point
  someone to a guide by name. The coach never quotes guide bodies from the
  mirror; it's an index, not content.

## 9. Testing & verification

- **Content validation suite** (vitest): unique slugs/indexes; every guide has
  ≥1 step, every step ≥1 block; every `checkIn.answerIndex` in range; every
  `[[term]]` mark resolves to a `vocab` entry; banned-word lint over all guide
  copy (urgency words: "now", "act fast", "don't miss", "hurry"; plus
  "victim" — with two allowed exceptions, both official proper names a person
  will hear in court: the role title "victim-witness" (existing notebook
  usage) and the form name "victim impact statement", quoted once in guide 08);
  `minutes` present; `close` present.
- **Component tests** (jsdom): one render test per block kind; FlipCard flips
  on tap only; CheckIn shows explanation after choice and stores nothing;
  VocabText marks render as buttons with definitions; ListenButton absent when
  no audio file is declared.
- **Player tests:** contents page lists all steps; jump/skip works;
  `data-motion="off"` yields no transition classes; unknown slug shows the
  calm not-found.
- **Repo gates:** `eslint .` (prettier violations are errors), `tsc --noEmit`,
  `vitest run`, `LOVABLE_SANDBOX=1` build — all green before push (dev machine
  uses npm, not bun, per project memory).
- **Real-browser pass:** Playwright + Chrome recipe from project memory —
  walk the shelf, open each shipped guide, tab through a check-in, toggle
  Stillness, play narration once.

## 10. Explicitly out of scope

- Games of any kind (decision final for this design; see §2/§3).
- Any memory practice over user-entered content (red line, permanent).
- Progress tracking, localStorage, completion states, streaks, XP, confetti.
- Study-guide content in the database; runtime AI; new vendors; new npm
  dependencies.
- Export/PDF, YouTube or other external embeds (privacy), podcast blocks.
- MindCrafter code reuse beyond concepts (no arcade port, no Voyager port).

## 11. Implementation phases (input to the plan)

1. **Scaffold:** types + `studyGuides.ts` with guide 01 fully authored (review
   sample), shelf route, player with `card`/`summary`/`close` blocks.
2. **Blocks:** quote flip, timeline, check-in, vocab marks, story label.
3. **Narration:** generation script + ListenButton + SW precache exclusion.
4. **Plumbing:** home/guide/notebooks entry points, disclaimer, sources group,
   `project_knowledge` migration.
5. **Content:** author guides 02–10 in review batches with Lee; generate
   narration after each approval.
6. **Hardening:** full test suite, lint/type/build gates, Playwright pass.

Each phase lands independently; the shelf ships whenever ≥1 guide is approved.
