# Study Guides Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Tend's `/study` shelf of ten hand-authored, paged, gently interactive court-concept study guides with pre-generated narration — per the approved spec `docs/superpowers/specs/2026-07-14-study-guides-design.md`.

**Architecture:** Static typed content module (`src/lib/copy/studyGuides.ts`, zero imports) rendered by a paged player at `/study/$slug` built from small block components; narration MP3s generated once by a dev-time script into `public/audio/study/`; trust plumbing via disclaimer, `/sources` group, and one `project_knowledge` migration.

**Tech Stack:** TanStack Start file routes, React 19, Tailwind v4 CSS-first (existing paper utilities), vitest + jsdom + @testing-library/react, plain-fetch OpenAI TTS script run by Node ≥23 (`node scripts/generate-narration.ts`).

**Execution note:** The main session executes this plan inline (executing-plans) — guide copy must be authored with the full conversation/spec context. Content tasks (1, 8, 9) carry the language rules with them.

## Global Constraints

- Language rules (every guide string): experience-based, never "victim" (sole exception: the role title "victim-witness"); ≤6th-grade reading level; calm; no urgency words ("now", "act fast", "don't miss", "hurry"); never coach/script/shape testimony — describe what to EXPECT; every guide points back to "your advocate or lawyer".
- Zero traces: no auth, no localStorage/sessionStorage, no persistence of any interaction. Check-ins store nothing.
- Motion: transitions only on user interaction; none under `html[data-motion="off"]` or OS reduce-motion. No autonomous animation. No confetti.
- Zero new npm dependencies (runtime or dev). Narration script uses plain `fetch`.
- Repo gates before every push: `npx eslint .` (prettier violations are errors), `npx tsc --noEmit`, `npx vitest run`, build. Dev machine uses **npm, not bun**.
- Never push to `main` in this work; commit locally only. Never rewrite pushed history.
- All new user-visible strings live in the copy layer (`src/lib/copy/…`), not inline in components — matching the audit pattern.
- Reuse existing UI idiom: `Shell`, `ProgressDots`, `.notebook-page`, `.notebook-cover`, `.paper-shadow*`, `.sticky-note`, `.notebook-binding`, lucide icons `strokeWidth={2}`.

---

### Task 1: Content model, guide 01, validation suite

**Files:**
- Create: `src/lib/copy/studyGuides.ts`
- Test: `src/lib/copy/studyGuides.test.ts`

**Interfaces:**
- Consumes: nothing (module has zero imports by design — Node type-stripping imports it directly in Task 6).
- Produces (used by Tasks 2–10):
  - `type GuideColor` — 9-color union identical to `NotebookCover` values
  - `interface VocabTerm { term: string; meaning: string }`
  - `type GuideBlock` — discriminated union: `intro | summary | card | quote | story | timeline | checkIn`
  - `interface GuideStep { id: string; title: string; audio?: boolean; blocks: GuideBlock[] }`
  - `interface StudyGuide { slug; index; title; cover; tab; color; minutes; vocab; steps; close }`
  - `const STUDY_GUIDE_DISCLAIMER: string`
  - `const studyGuides: readonly StudyGuide[]`
  - `function studyGuideBySlug(slug: string): StudyGuide | undefined`
  - `function narrationTextForStep(guide: StudyGuide, step: GuideStep): string` (strips `[[…]]` marks; skips `checkIn` blocks; appends guide `close` on the last step)

- [ ] **Step 1: Write the failing validation test**

`src/lib/copy/studyGuides.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  narrationTextForStep,
  STUDY_GUIDE_DISCLAIMER,
  studyGuideBySlug,
  studyGuides,
} from "./studyGuides";

// Urgency words are banned as words ("now" alone), not substrings ("know").
const BANNED = [/\bnow\b/i, /\bact fast\b/i, /\bdon'?t miss\b/i, /\bhurry\b/i];
// "victim" is banned except in the official role title "victim-witness".
const VICTIM = /victim(?!-witness)/i;

function textOf(block: unknown): string[] {
  const b = block as Record<string, unknown>;
  const out: string[] = [];
  for (const v of Object.values(b)) {
    if (typeof v === "string") out.push(v);
    if (Array.isArray(v))
      for (const item of v)
        if (typeof item === "string") out.push(item);
        else if (item && typeof item === "object")
          out.push(...Object.values(item).filter((x): x is string => typeof x === "string"));
  }
  return out;
}

describe("study guide content contract", () => {
  it("has 1–12 guides with unique slugs and indexes", () => {
    expect(studyGuides.length).toBeGreaterThanOrEqual(1);
    expect(studyGuides.length).toBeLessThanOrEqual(12);
    const slugs = studyGuides.map((g) => g.slug);
    const indexes = studyGuides.map((g) => g.index);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(indexes).size).toBe(indexes.length);
  });

  it("every guide is well-formed", () => {
    for (const g of studyGuides) {
      expect(g.minutes).toBeGreaterThan(0);
      expect(g.close.length).toBeGreaterThan(0);
      expect(g.steps.length).toBeGreaterThanOrEqual(1);
      const stepIds = g.steps.map((s) => s.id);
      expect(new Set(stepIds).size).toBe(stepIds.length);
      for (const s of g.steps) expect(s.blocks.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("check-in answers are in range and always explained", () => {
    for (const g of studyGuides)
      for (const s of g.steps)
        for (const b of s.blocks)
          if (b.kind === "checkIn")
            for (const q of b.questions) {
              expect(q.choices.length).toBeGreaterThanOrEqual(2);
              expect(q.answerIndex).toBeGreaterThanOrEqual(0);
              expect(q.answerIndex).toBeLessThan(q.choices.length);
              expect(q.explain.length).toBeGreaterThan(0);
            }
  });

  it("every [[term]] mark resolves to a vocab entry of its guide", () => {
    for (const g of studyGuides) {
      const known = new Set(g.vocab.map((v) => v.term.toLowerCase()));
      for (const s of g.steps)
        for (const b of s.blocks)
          for (const t of textOf(b))
            for (const m of t.matchAll(/\[\[(.+?)\]\]/g))
              expect(known, `guide ${g.slug}: unknown mark [[${m[1]}]]`).toContain(
                m[1].toLowerCase(),
              );
    }
  });

  it("copy obeys the language rules", () => {
    const all: string[] = [STUDY_GUIDE_DISCLAIMER];
    for (const g of studyGuides) {
      all.push(g.title, g.cover, g.tab, g.close, ...g.vocab.flatMap((v) => [v.term, v.meaning]));
      for (const s of g.steps) {
        all.push(s.title);
        for (const b of s.blocks) all.push(...textOf(b));
      }
    }
    for (const t of all) {
      for (const re of BANNED) expect(t, `urgency word in: "${t}"`).not.toMatch(re);
      expect(t, `"victim" in: "${t}"`).not.toMatch(VICTIM);
    }
  });

  it("looks up by slug and builds narration text", () => {
    const g = studyGuideBySlug("path-of-a-case");
    expect(g).toBeDefined();
    const first = narrationTextForStep(g!, g!.steps[0]);
    expect(first.length).toBeGreaterThan(40);
    expect(first).not.toContain("[[");
    const last = narrationTextForStep(g!, g!.steps[g!.steps.length - 1]);
    expect(last).toContain(g!.close);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/lib/copy/studyGuides.test.ts`
Expected: FAIL — cannot resolve `./studyGuides`.

- [ ] **Step 3: Create `src/lib/copy/studyGuides.ts`**

Zero imports (Task 6's Node script imports this file directly). Header comment mirrors `notebooks.ts` (language rules + "never coach" line). Contents:

```ts
// Study guides — bigger, paged learning experiences opened from /study.
// Hand-authored from reviewed public research; nothing generated at runtime.
//
// LANGUAGE RULES (same as ./index.ts, load-bearing):
//   - Experience-based. Never "victim" (except the role title "victim-witness").
//   - ≤ 6th-grade reading level. Calm and still. No urgency words.
//   - Never coaches, scripts, or shapes testimony. Guides describe what to
//     EXPECT; only the person, in their own words, says what happened.
//   - Every guide points back to "your advocate or lawyer". Not legal advice.
//
// This module deliberately has ZERO imports: scripts/generate-narration.ts
// imports it directly under Node's TypeScript type-stripping.

export type GuideColor =
  | "sage" | "sand" | "clay" | "sky" | "ochre" | "lav" | "moss" | "stone" | "rose";

export interface VocabTerm { term: string; meaning: string }

export type GuideBlock =
  | { kind: "intro"; body: string; note?: string }
  | { kind: "summary"; points: string[] }
  | { kind: "card"; title: string; body: string; ask?: string }
  | { kind: "quote"; text: string; meaning: string }
  | { kind: "story"; title: string; paragraphs: string[] }
  | { kind: "timeline"; steps: { title: string; body: string }[] }
  | { kind: "checkIn"; intro?: string; questions: {
      prompt: string; choices: string[]; answerIndex: number; explain: string;
    }[] };

export interface GuideStep {
  id: string;        // stable — names the narration file public/audio/study/<slug>/<id>.mp3
  title: string;
  audio?: boolean;   // set true only once the MP3 is generated & committed
  blocks: GuideBlock[];
}

export interface StudyGuide {
  slug: string;
  index: string;     // "01"
  title: string;
  cover: string;     // one calm line for the shelf
  tab: string;
  color: GuideColor;
  minutes: number;
  vocab: VocabTerm[];
  steps: GuideStep[];
  close: string;     // rendered on the last step
}

export const STUDY_GUIDE_DISCLAIMER =
  "General information, drawn from public court-preparation guidance. It is not legal advice, and every court is different. Your advocate or lawyer knows your situation.";
```

Then `export const studyGuides: readonly StudyGuide[] = [ …guide 01… ] as const;`, `studyGuideBySlug`, and `narrationTextForStep` (below). Guide 01 (`path-of-a-case`, index "01", color "sand", tab "The path", minutes 8) — **full copy authored at execution time under the header rules**, with this fixed step outline:

1. `in-short` "In short" — `summary` (4 points: cases move in steps; many steps are short meetings about rules and dates; most cases end in an agreement, not a trial; you can ask what step your case is on) + `intro` body inviting slow reading.
2. `how-it-starts` "How a case starts" — `card` on reports and [[charges]] (the government brings the case; it is the state's case, not a task on the person's shoulders) + ask.
3. `first-court-dates` "The first court dates" — `card` on the [[arraignment]] and what a [[plea]] is + ask.
4. `the-quiet-middle` "The quiet middle" — `card` on [[motion]]s, evidence-gathering, talks between lawyers, and why this part is long and quiet + ask (pairs with the "Waiting and delays" notebook).
5. `the-path-drawn-out` "The path, drawn out" — `timeline` of 7 stops: A report is made → Charges → First court dates → The quiet middle → Maybe an agreement → Maybe a trial → [[sentencing]] and after.
6. `two-ways-it-ends` "Two ways it can end" — `card` (agreement vs. trial; either way it is about how the system works, not the worth of anyone's story) + `quote` (text: "Most cases end in an agreement, not a trial." / meaning: plain-words unpacking) .
7. `check-in` "A gentle check-in" — `checkIn`, 3 questions (how most cases end; what a date that moves usually means; who can say what step the case is on), kind explanations that name the answer warmly.

`vocab` (5): charges, arraignment, plea, motion, sentencing — meanings in plain words.

`narrationTextForStep` implementation:

```ts
const stripMarks = (t: string) => t.replace(/\[\[(.+?)\]\]/g, "$1");

export function narrationTextForStep(guide: StudyGuide, step: GuideStep): string {
  const parts: string[] = [step.title + "."];
  for (const b of step.blocks) {
    if (b.kind === "intro") parts.push(b.body, b.note ?? "");
    else if (b.kind === "summary") parts.push(...b.points);
    else if (b.kind === "card") parts.push(b.title + ".", b.body, b.ask ?? "");
    else if (b.kind === "quote") parts.push(b.text, "What this can mean: " + b.meaning);
    else if (b.kind === "story")
      parts.push("A story, not a real person — to show what it can be like.", b.title + ".", ...b.paragraphs);
    else if (b.kind === "timeline") for (const s of b.steps) parts.push(s.title + ". " + s.body);
    // checkIn is interactive — narration skips it on purpose.
  }
  if (step === guide.steps[guide.steps.length - 1]) parts.push(guide.close);
  return stripMarks(parts.filter(Boolean).join("\n\n"));
}

export function studyGuideBySlug(slug: string): StudyGuide | undefined {
  return studyGuides.find((g) => g.slug === slug);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/copy/studyGuides.test.ts`
Expected: PASS (all 6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/copy/studyGuides.ts src/lib/copy/studyGuides.test.ts
git commit -m "feat(study): content model, validation suite, guide 01 (path of a case)"
```

---

### Task 2: `copy.study` strings + `/study` shelf route

**Files:**
- Modify: `src/lib/copy/index.ts` (add `study` key after the `notebooks` key, ~line 267)
- Create: `src/routes/study.tsx`
- Test: `src/routes/study.test.tsx`

**Interfaces:**
- Consumes: `studyGuides`, `GuideColor` (Task 1); `Shell`; `copy`.
- Produces: `copy.study` strings used by Tasks 3–7: `title, intro, minutesTemplate, contentsTitle, contentsHint, begin, backToShelf, prevLabel, nextLabel, listen, stopListening, checkInNothingSaved, checkInReveal, storyLabel, wordsHeading, notFound, homeTileHint, guideCardHint, notebooksCrossLink`. Also `COVER` map pattern (copied, not imported, from `notebooks.tsx`).

- [ ] **Step 1: Add `copy.study` to `src/lib/copy/index.ts`**

Insert after the `notebooks: {…}` entry:

```ts
  // The study-guide shelf (/study). Guide content lives in ./studyGuides.ts.
  study: {
    title: "Study guides",
    intro:
      "Bigger topics, taken one small step at a time. Open what helps, skip what doesn't. There is no order you have to follow.",
    minutesTemplate: "about {n} minutes — no rush",
    contentsTitle: "Inside this guide",
    contentsHint: "You can read in order, or tap any step. Skipping is always okay.",
    begin: "Begin",
    backToShelf: "All study guides",
    prevLabel: "Back",
    nextLabel: "Next",
    listen: "Listen to this step",
    stopListening: "Stop listening",
    checkInNothingSaved: "Want to try a few questions? Just for you — nothing is saved.",
    checkInReveal: "The answer is",
    storyLabel: "A story, not a real person — to show what it can be like.",
    wordsHeading: "Words from this guide",
    notFound: "That study guide isn’t here. It may have moved.",
    homeTileHint: "Bigger topics, one small step at a time.",
    guideCardHint: "Bigger guides, one step at a time.",
    notebooksCrossLink: "Looking for something deeper? The study guides take bigger topics one step at a time.",
  },
```

- [ ] **Step 2: Write the failing shelf test**

`src/routes/study.test.tsx` — render the shelf component directly (routes export their component for tests via a named export; follow this pattern):

```tsx
// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { studyGuides } from "@/lib/copy/studyGuides";

vi.mock("@tanstack/react-router", async (orig) => ({
  ...(await orig<typeof import("@tanstack/react-router")>()),
  createFileRoute: () => (opts: object) => ({ ...opts }),
  Link: ({ children, ...p }: React.PropsWithChildren<{ to?: string }>) => (
    <a data-to={p.to}>{children}</a>
  ),
  Outlet: () => null,
  useRouterState: ({ select }: { select: (s: unknown) => unknown }) =>
    select({ location: { pathname: "/study" } }),
}));

import { StudyShelf } from "./study";

describe("/study shelf", () => {
  it("shows one cover per guide with index and minutes", () => {
    render(<StudyShelf />);
    for (const g of studyGuides) {
      expect(screen.getByText(g.title)).toBeInTheDocument();
      expect(screen.getByText(g.index)).toBeInTheDocument();
    }
    expect(screen.getAllByText(/about \d+ minutes — no rush/)).toHaveLength(studyGuides.length);
  });
});
```

(If `Shell` pulls in router hooks that resist mocking, mock `@/components/Shell` with a passthrough `({children}) => <div>{children}</div>` instead — keep the test about shelf content.)

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run src/routes/study.test.tsx`
Expected: FAIL — `./study` does not export `StudyShelf`.

- [ ] **Step 4: Implement `src/routes/study.tsx`**

Clone the `notebooks.tsx` structure exactly (self-index layout: on child path render `<Outlet/>`): same `COVER` map (copy the 9 oklch pairs verbatim), `head: () => ({ meta: [{ title: pageTitle(copy.study.title) }] })`, grid of `notebook-cover` Links to `/study/$slug`, spine ribbon, index number, title + cover line, plus a minutes line `copy.study.minutesTemplate.replace("{n}", String(g.minutes))` in `text-[0.7rem] text-foreground/55`. Export the screen component as `export function StudyShelf()` and pass it to the route. Footer note reuses the shelf disclaimer sentence pattern from `notebooks.tsx:79-82` but sourced from `copy.study` — add `shelfNote: "These are general guides — not legal advice. Your advocate or lawyer knows your court and your situation."` to `copy.study`.

- [ ] **Step 5: Run test + typecheck**

Run: `npx vitest run src/routes/study.test.tsx && npx tsc --noEmit`
Expected: PASS, no type errors. (`routeTree.gen.ts` regenerates on dev/build; if tsc complains about the missing route id, run `npm run build:dev` once or start `npm run dev` briefly to regenerate.)

- [ ] **Step 6: Commit**

```bash
git add src/lib/copy/index.ts src/routes/study.tsx src/routes/study.test.tsx src/routeTree.gen.ts
git commit -m "feat(study): copy strings and /study shelf route"
```

---

### Task 3: Player route with pager (contents, card/summary/intro blocks, close)

**Files:**
- Create: `src/components/study/GuideStepView.tsx` (block switch; quote/story/timeline/checkIn/vocab arrive in Tasks 4–5 as stubs here)
- Create: `src/routes/study.$slug.tsx`
- Test: `src/components/study/GuideStepView.test.tsx`, `src/routes/study.slug.test.tsx`

**Interfaces:**
- Consumes: Task 1 types; `copy.study` (Task 2); `ProgressDots` (`src/components/ProgressDots.tsx`, props `{ step: number; total: number }`); `STUDY_GUIDE_DISCLAIMER`.
- Produces:
  - `GuideStepView({ guide, step, isLast }: { guide: StudyGuide; step: GuideStep; isLast: boolean })` — renders all blocks of one step inside the ruled page; on `isLast` appends `close` (italic) and the vocab list under `copy.study.wordsHeading` when `guide.vocab.length > 0`.
  - `GuidePlayer` internal to the route: `pageIndex` state, `0` = contents, `1..N` = steps. Prev/Next buttons (`copy.study.prevLabel/nextLabel`), `ProgressDots step={pageIndex - 1} total={steps.length}` shown only on step pages, contents list buttons jump via `setPageIndex`. No URL/step persistence (zero-trace). Unknown slug → `copy.study.notFound` + Link back (clone `notebooks.$slug.tsx:21-33`).

- [ ] **Step 1: Write failing tests**

`src/components/study/GuideStepView.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { GuideStepView } from "./GuideStepView";
import type { StudyGuide } from "@/lib/copy/studyGuides";

const guide: StudyGuide = {
  slug: "t", index: "99", title: "T", cover: "c", tab: "t", color: "sand", minutes: 3,
  vocab: [{ term: "plea", meaning: "An answer to the charges." }],
  close: "A quiet close.",
  steps: [
    { id: "a", title: "First", blocks: [
      { kind: "summary", points: ["Point one.", "Point two."] },
      { kind: "card", title: "Card title", body: "Card body.", ask: "You could ask something." },
    ]},
  ],
};

describe("GuideStepView", () => {
  it("renders summary points, card, and ask note", () => {
    render(<GuideStepView guide={guide} step={guide.steps[0]} isLast={false} />);
    expect(screen.getByText("Point one.")).toBeInTheDocument();
    expect(screen.getByText("Card title")).toBeInTheDocument();
    expect(screen.getByText("You could ask something.")).toBeInTheDocument();
    expect(screen.queryByText("A quiet close.")).not.toBeInTheDocument();
  });
  it("appends close and vocab list on the last step", () => {
    render(<GuideStepView guide={guide} step={guide.steps[0]} isLast={true} />);
    expect(screen.getByText("A quiet close.")).toBeInTheDocument();
    expect(screen.getByText("Words from this guide")).toBeInTheDocument();
    expect(screen.getByText("plea")).toBeInTheDocument();
  });
});
```

`src/routes/study.slug.test.tsx` (mock router like Task 2; import `GuidePlayer` named export): renders guide 01 by slug; asserts contents list shows every step title; clicking a step title (`fireEvent.click`) shows that step's first block text and the dots' `aria-label`; clicking Next/Back moves; unknown slug shows `copy.study.notFound`.

- [ ] **Step 2: Run to verify both fail**

Run: `npx vitest run src/components/study src/routes/study.slug.test.tsx`
Expected: FAIL — modules missing.

- [ ] **Step 3: Implement `GuideStepView`**

Block switch inside the ruled-page idiom (`article` per block, `space-y` rhythm from `notebooks.$slug.tsx:71-91`): `intro` → paragraph + optional `Info` note box (clone notebook note markup); `summary` → `ul` of points with `leading-relaxed`; `card` → notebook card markup incl. `sticky-note` ask; other kinds → `null` for this task (stubs replaced in Tasks 4–5). `isLast` → italic close paragraph + `wordsHeading` `dl` of `guide.vocab`.

- [ ] **Step 4: Implement `src/routes/study.$slug.tsx`**

Head via `studyGuideBySlug(params.slug)?.title`. Component `GuidePlayer`: not-found branch; header (back link to `/study`, index/tab row, title — clone `notebooks.$slug.tsx:50-58`); `useState(0)`; contents page = ruled page listing steps as full-width buttons (`text-left`, step index + title, `copy.study.contentsHint` above, `copy.study.begin` primary button); step pages = `notebook-page` with `notebook-binding` containing `<GuideStepView …/>`; below the page: `ProgressDots` + Back/Next `button`s (`Button` variant="ghost" from `@/components/ui/button` — match app button use); disclaimer footer paragraph with `STUDY_GUIDE_DISCLAIMER` + Link to `/sources` (clone `notebooks.$slug.tsx:99-105`). Next on last step returns to contents (`setPageIndex(0)`) — label switches to `copy.study.backToShelf`? No — keep simple: on last step the Next slot renders a Link back to `/study` labeled `copy.study.backToShelf`. All transitions: none (state swap renders instantly; do not add transition classes — Stillness-safe by construction).

- [ ] **Step 5: Run tests, typecheck**

Run: `npx vitest run src/components/study src/routes/study.slug.test.tsx && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/study src/routes/study.\$slug.tsx src/routes/study.slug.test.tsx src/routeTree.gen.ts
git commit -m "feat(study): paged guide player with contents, cards, and close"
```

---

### Task 4: FlipCard, TimelineList, VocabText, story block

**Files:**
- Create: `src/components/study/FlipCard.tsx`, `src/components/study/TimelineList.tsx`, `src/components/study/VocabText.tsx`
- Modify: `src/components/study/GuideStepView.tsx` (wire `quote`, `timeline`, `story`; route all body text through `VocabText`)
- Test: `src/components/study/FlipCard.test.tsx`, `src/components/study/VocabText.test.tsx`, extend `GuideStepView.test.tsx`

**Interfaces:**
- Consumes: Task 1 types, `copy.study.storyLabel`.
- Produces:
  - `FlipCard({ text, meaning }: { text: string; meaning: string })` — `<button type="button" aria-expanded>`; front shows the quote + "Tap to see what it can mean"; tapping swaps to meaning (+ "Tap to see the saying again"). Pure state swap, no transition classes.
  - `TimelineList({ steps }: { steps: { title: string; body: string }[] })` — `<ol>` with left rule and numbered dot markers (border/`bg-foreground/20` spans, no motion).
  - `VocabText({ text, vocab, className }: { text: string; vocab: VocabTerm[]; className?: string })` — splits on `/\[\[(.+?)\]\]/`, marks become `Popover` (`@/components/ui/popover`) triggers styled `underline decoration-dotted underline-offset-4`; popover shows term + meaning. Unknown mark renders as plain text (validation test already prevents shipping one).

- [ ] **Step 1: Write failing tests** — FlipCard: renders text, not meaning; after `fireEvent.click` meaning visible and `aria-expanded="true"`; click again returns. VocabText: given `text: "Enter a [[plea]] here."` renders button "plea"; `fireEvent.click` shows "An answer to the charges."; text without marks renders no button. GuideStepView: `quote` block renders FlipCard; `story` block renders `copy.study.storyLabel` and paragraphs; `timeline` renders all step titles in order.

- [ ] **Step 2: Run to verify fail** — `npx vitest run src/components/study` → FAIL.

- [ ] **Step 3: Implement** the three components + GuideStepView wiring. Story markup: label line in `text-[0.7rem] uppercase tracking-[0.15em] text-foreground/50`, then title + paragraphs (each through `VocabText`). Quote: `FlipCard` inside `sticky-note`-adjacent paper card (`paper-shadow` + `bg-secondary/60`). Card/intro/summary bodies all render through `VocabText`.

- [ ] **Step 4: Run tests + typecheck** — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/study
git commit -m "feat(study): flip card, timeline, story block, tap-a-word vocabulary"
```

---

### Task 5: CheckIn block

**Files:**
- Create: `src/components/study/CheckIn.tsx`
- Modify: `src/components/study/GuideStepView.tsx` (wire `checkIn`)
- Test: `src/components/study/CheckIn.test.tsx`

**Interfaces:**
- Consumes: Task 1 `checkIn` block type; `copy.study.checkInNothingSaved`.
- Produces: `CheckIn({ intro, questions })`. Behavior contract (tested): intro line always shows `copy.study.checkInNothingSaved` (plus optional block intro); each question renders prompt + choice buttons; tapping ANY choice reveals that question's `explain` (which names the answer warmly) and marks the tapped choice `aria-pressed`; re-tapping another choice just moves the mark (exploration, never "wrong"); no tallies, no score, no storage of any kind (no localStorage/sessionStorage calls anywhere in the component); questions are independent.

- [ ] **Step 1: Write failing test** — renders `checkInNothingSaved`; explanation hidden until a choice is tapped; after tap explanation visible; `window.localStorage.length` is 0 after interaction.

- [ ] **Step 2: Run to verify fail.**

- [ ] **Step 3: Implement** — `useState<Record<number, number>>({})` chosen per question index; choices as small paper buttons (`rounded-md border border-border bg-card px-3 py-2 text-left`); explanation in the `Info` note-box idiom.

- [ ] **Step 4: Run tests + typecheck** — PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/study
git commit -m "feat(study): gentle unscored check-ins"
```

---

### Task 6: Narration — ListenButton + generation script

**Files:**
- Create: `src/components/study/ListenButton.tsx`
- Create: `scripts/generate-narration.ts`
- Modify: `src/components/study/GuideStepView.tsx` or `src/routes/study.$slug.tsx` (render ListenButton at top of a step when `step.audio === true`)
- Modify: `scripts/build-sw.mjs` (comment only — record that mp3 is deliberately absent from `globPatterns`)
- Test: extend `src/routes/study.slug.test.tsx`

**Interfaces:**
- Consumes: `narrationTextForStep`, `studyGuides` (Task 1); `copy.study.listen/stopListening`.
- Produces:
  - `ListenButton({ src }: { src: string })` — lucide `Volume2`/`Square` icon button; creates `new Audio(src)` on first tap, toggles play/pause; `useEffect` cleanup pauses on unmount (navigation stops playback). Renders nothing until user taps play? No — renders the button; audio object created lazily on first tap.
  - Step audio path helper in the route: `/audio/study/${guide.slug}/${step.id}.mp3`.
  - `scripts/generate-narration.ts` — run `OPENAI_API_KEY=… node scripts/generate-narration.ts [slug …]` (no args = all guides). For each step of each selected guide: skip if `public/audio/study/<slug>/<id>.mp3` exists (idempotent; `--force` regenerates); POST `https://api.openai.com/v1/audio/speech` with `{ model: "gpt-4o-mini-tts", voice: "sage", response_format: "mp3", input: narrationTextForStep(g, s), instructions: "Speak slowly, warmly and calmly, in a low, gentle voice. Unhurried pace. Soft, kind, steady — like reading to a friend who is tired. Pause briefly between paragraphs." }`; write file; log path + bytes; exit non-zero on any HTTP failure. Never runs in CI or at runtime.

- [ ] **Step 1: Write failing test** — in `study.slug.test.tsx`: a step with `audio: true` renders a button named `copy.study.listen`; a step without `audio` renders none. (Use a local fixture guide injected via component props — export `GuidePlayerView({ guide })` presentational component from the route file so the test can pass a fixture, with the route component delegating to it.)

- [ ] **Step 2: Run to verify fail.**

- [ ] **Step 3: Implement** ListenButton + wiring + script (script is dev-only; import path `../src/lib/copy/studyGuides.ts` with explicit `.ts` extension for Node type-stripping). Add to `build-sw.mjs` `globPatterns` line the comment: `// mp3 deliberately excluded: study-guide narration is runtime-fetched, never precached (spec 2026-07-14).`

- [ ] **Step 4: Verify script dry-runs without a key** — `node scripts/generate-narration.ts --list` prints per-guide step count + estimated characters, makes no network calls. Add `--list` mode for this.

- [ ] **Step 5: Run tests + typecheck** — PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/study scripts/generate-narration.ts scripts/build-sw.mjs src/routes/study.\$slug.tsx src/routes/study.slug.test.tsx
git commit -m "feat(study): listen button and one-time narration generation script"
```

---

### Task 7: Entry points, sources, knowledge migration

**Files:**
- Modify: `src/routes/home.tsx` (~line 88, after the notebooks Tile): `<Tile to="/study" label={copy.study.title} hint={copy.study.homeTileHint} />`
- Modify: `src/routes/guide.tsx` (~line 97: alongside the notebooks card, a second Link card to `/study` using `copy.study.title` + `copy.study.guideCardHint` — clone the existing card markup)
- Modify: `src/routes/notebooks.tsx` (below the grid, above the shelf-note: quiet paragraph `copy.study.notebooksCrossLink` wrapped in a `Link to="/study"`)
- Modify: `src/routes/sources.tsx` (append one `SOURCE_GROUPS` entry `heading: "Study-guide research"` — exact items chosen during content authoring from `docs/research/` + public canon: U.S. Courts glossary & appeals pages, OVC victim-impact-statement guidance, USAO "witness in a federal case" pages, NCVLI rights primers; every claim in guides 02–10 must trace to one of these or an existing group item)
- Create: `supabase/migrations/20260714000001_study_guide_knowledge.sql`
- Test: routes covered by existing route tests? No — verify via typecheck + Task 11 browser pass; migration is SQL-only.

**Interfaces:**
- Consumes: `copy.study` (Task 2).
- Produces: migration mirroring `20260705000004_notebook_knowledge.sql` exactly — one idempotent `insert … select … where not exists` into `public.project_knowledge`, title `'In-app study guides the survivor can open'`, body = numbered list of the ten guides (title + one-line summary + path `/study/<slug>`), `agent_keys '{}'`, `status 'published'`, `created_by 'migration:study-guides'`. Body written at execution time from the final ten summaries; explicitly states "an index, not content — point gently, never quote as script."

- [ ] **Step 1: Make the four route edits** (exact snippets above; keep the footer nav untouched).
- [ ] **Step 2: Write the migration** (clone the notebook one's structure verbatim, new title/body/created_by).
- [ ] **Step 3: Typecheck + full test run** — `npx tsc --noEmit && npx vitest run` → PASS.
- [ ] **Step 4: Commit**

```bash
git add src/routes/home.tsx src/routes/guide.tsx src/routes/notebooks.tsx src/routes/sources.tsx supabase/migrations/20260714000001_study_guide_knowledge.sql
git commit -m "feat(study): entry points, sources group, coach knowledge index"
```

(Migration is NOT applied to the live project in this plan — `supabase db push` happens at deploy time with Lee present, per deploy conventions.)

---

### Task 8: Author guides 02–05

**Files:**
- Modify: `src/lib/copy/studyGuides.ts`

Author complete copy under the Global Constraints + spec §4 outlines, each guide 6–9 steps, each with vocab (4–7 terms), ≥1 check-in, and the block mix noted:

- **02 `who-is-who-in-court`** "Who's who in the courtroom" (color sage, tab "People"): cards per person — judge, [[prosecutor]], defense lawyer, [[jury]], court reporter, clerk, bailiff, advocate, victim-witness staff; who is and isn't "for you" card; check-in (3 q). Sources: U.S. Courts glossary, AG Guidelines.
- **03 `words-you-will-hear`** "Words you'll hear" (color sky, tab "Words"): the vocab-forward guide — intro; themed cards (starting words, during-testimony words, deciding words) with heavy `[[…]]` marks; quote flip; check-in (4 q); vocab 10–14 terms incl. [[objection]], [[sustained]], [[overruled]], [[exhibit]], [[sidebar]], [[recess]], [[testimony]], [[oath]].
- **04 `the-day-you-testify`** "The day you testify" (color clay, tab "That day"): timeline (arrive → wait → called in → [[oath]] → questions from one side → questions from the other → maybe more questions → stepping down); story block (composite, labeled); cards on breaks/water/pauses; check-in (3 q). Framing note (intro `note`): expect-not-script (clone notebook 03's note tone).
- **05 `cross-examination`** "Cross-examination and objections" (color ochre, tab "Questions"): cards — why the other side pushes ([[cross-examination]] is their job, not a verdict on anyone); what an [[objection]] is; what happens after one (wait; the judge decides); the right to pause, to not understand, to not remember; quote flip; check-in (3 q). Complements notebook 03 (myths) — link to it in an ask line.

- [ ] **Step 1: Author guide 02** → run `npx vitest run src/lib/copy/studyGuides.test.ts` → PASS.
- [ ] **Step 2: Author guide 03** → suite PASS.
- [ ] **Step 3: Author guide 04** → suite PASS.
- [ ] **Step 4: Author guide 05** → suite PASS.
- [ ] **Step 5: Read each aloud once for register drift (calm? 6th grade? no coaching?), fix, re-run suite.**
- [ ] **Step 6: Commit** — `git commit -am "feat(study): author guides 02-05"`

---

### Task 9: Author guides 06–10

**Files:**
- Modify: `src/lib/copy/studyGuides.ts`, `src/routes/sources.tsx` (fill the Task-7 group with the final citations)

- **06 `your-rights`** "Your rights in the process" (color lav, tab "Rights"): intro note (rights exist on paper; people help make them real); cards — told about hearings, be present, be heard at some hearings, protection, privacy, restitution exists; who helps use them; check-in (3 q). Sources: CVRA (already in sources), USSC primer.
- **07 `evidence-simply`** "Evidence, simply" (color moss, tab "Evidence"): cards — what [[evidence]] is; [[exhibit]]s; why some things can't be said (rules about fairness, simply); why lawyers interrupt; nobody expects anyone to know these rules; check-in (3 q).
- **08 `being-heard`** "Being heard: impact statements" (color rose, tab "Heard"): intro note — *describes what impact statements ARE; never suggests content; always a choice*; cards — what it is, when it can happen, forms (spoken/written), that skipping it is okay; story block (composite: someone choosing the written form); reflection ask lines instead of a check-in (per spec: personal topic).
- **09 `privacy-and-protection`** "Privacy and protection" (color stone, tab "Privacy"): cards — limits on questions about the past (FRE 412 in plain words); sealed records / initials in filings; no-contact orders; asking about safety worries; check-in (3 q).
- **10 `after-the-case`** "After the case ends" (color sand, tab "After"): timeline ([[verdict]] → [[sentencing]] → maybe an [[appeal]] → truly over); cards — what each can feel like; why an appeal is not a redo of anyone's word; life after: support continues; reflection asks + gentle check-in (2 q).

- [ ] **Step 1–5: Author 06 → 10, suite PASS after each.**
- [ ] **Step 6: Finalize `SOURCE_GROUPS` "Study-guide research" items — every factual claim in 02–10 traces to a listed source. Cross-check `docs/research/`.**
- [ ] **Step 7: Register read-aloud pass over all five, fix drift, suite PASS.**
- [ ] **Step 8: Commit** — `git commit -am "feat(study): author guides 06-10 and study-guide sources"`

---

### Task 10: Generate narration (conditional on local OPENAI_API_KEY)

**Files:**
- Create: `public/audio/study/<slug>/<stepId>.mp3` (~70 files)
- Modify: `src/lib/copy/studyGuides.ts` (set `audio: true` on generated steps)

- [ ] **Step 1: Check for a key** — `grep -l "OPENAI_API_KEY" .env.local` (memory: `.env.local` restoration recipe in project memory). If absent and not restorable, STOP this task: leave all `audio` flags unset, note it in the final report (feature degrades gracefully — no Listen buttons), and continue to Task 11.
- [ ] **Step 2: Dry-run** — `node scripts/generate-narration.ts --list` → sanity-check per-step character counts (each < 4096 chars, the API input limit; split any step text at a paragraph boundary into `<id>.mp3` continuation if over — script handles by erroring loudly first).
- [ ] **Step 3: Generate guide 01 only** — `node scripts/generate-narration.ts path-of-a-case`; play one file locally (`afplay public/audio/study/path-of-a-case/in-short.mp3` for 3 seconds) to confirm tone; check file sizes are sane (100–800 KB).
- [ ] **Step 4: Generate the rest** — all slugs; set `audio: true` flags; `npx vitest run` (audio-flag test from Task 6 still green).
- [ ] **Step 5: Total size check** — `du -sh public/audio/study` expected ≤ ~30 MB.
- [ ] **Step 6: Commit** — `git add public/audio/study src/lib/copy/studyGuides.ts && git commit -m "feat(study): pre-generated narration for all guides"`

---

### Task 11: Hardening + full verification

- [ ] **Step 1: Full gates** — `npx eslint . && npx tsc --noEmit && npx vitest run` → all green. Fix anything (prettier violations are errors).
- [ ] **Step 2: Build** — `LOVABLE_SANDBOX=1 npm run build` → succeeds; confirm `sw.js` precache count did NOT swell with mp3s (build-sw log line).
- [ ] **Step 3: Browser pass** — follow the Playwright + Chrome recipe in project memory (`advocate-local-dev-setup.md`): `npm run dev` (localhost:8080) then walk: `/` → `/study` shelf renders 10 covers → open guide 01 → contents → tap through every step → flip the quote → tap a vocab word → answer a check-in (verify explanation, verify nothing in localStorage) → play narration for one step (if Task 10 ran) → toggle Stillness in `/settings` and confirm no transitions → `/guide` and `/home` and `/notebooks` show the new entry points → unknown slug `/study/nope` shows the calm not-found. Screenshot the shelf + one open guide for the final report.
- [ ] **Step 4: Spec conformance re-read** — read the spec top to bottom; check every §5–§10 requirement against the code; fix gaps.
- [ ] **Step 5: Final commit** — any fixes: `git commit -am "chore(study): hardening pass"`.

---

## Self-Review (run after writing)

1. **Spec coverage:** §4 topics → Tasks 1/8/9. §5 model → Task 1. §6 routes/UX → Tasks 2–5. §7 narration → Tasks 6/10. §8 plumbing → Task 7. §9 testing → Tasks 1–6/11. §10 exclusions → honored (no games, no persistence, no new deps). ✓
2. **Placeholder scan:** content-authoring tasks intentionally specify outline + rubric rather than final prose (content IS the execution work, done inline with full context); all code steps carry code. ✓
3. **Type consistency:** `GuideStepView({ guide, step, isLast })`, `FlipCard({ text, meaning })`, `VocabText({ text, vocab, className })`, `CheckIn({ intro, questions })`, `ListenButton({ src })`, `narrationTextForStep(guide, step)` — names match across Tasks 3–6. ✓
