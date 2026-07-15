# Timeline Helper — design

**The founding idea (founder, 2026-07-15):** a person arrives with a messy account and leaves with an organized timeline. An AI does the arranging, and it can ask follow-up questions. This was meant to be a core feature; only manual row-entry ever shipped (the `TIMELINE_BUILDER_PROMPT` stub in `src/lib/agents/timeline-builder.ts` was never deployed).

## What exists
- `timeline_events` schema already fits the vision: nullable `event_date`, first-class `relative_anchor` ("after the move"), encrypted `description_enc`, `order_index`.
- `upsertTimeline` / `useTimeline` / `TimelineList` (manual add) work today.
- The agent stack (advocate-agent, guardrail floor, caps, aggregate telemetry) has an established pattern for a JSON-contract agent (the helper).

## Approaches considered
1. **One-shot organizer** — paste text, get rows. Simple, but no follow-up questions: fails the founding idea (ordering ambiguity is the hard part).
2. **Freeform chat agent** — maximum flexibility, but hardest to keep non-leading for this population, and a bigger surface to review.
3. **Bounded refine-loop (chosen)** — a composer where the person writes anything, messy; the helper replies with a PROPOSED timeline (draft rows in their own words) plus at most two gentle, always-skippable questions about ordering or rough timing of things they already said. They can answer in the composer (it is a chat — just one that always keeps the draft timeline as its subject) or skip. Nothing persists until they tap Keep on a row.

Chosen because it delivers "chat + follow-ups" inside the product's hard trauma/legal rails: questions are bounded to sequencing of the person's own words (never new content — that would be interviewing), skipping is structural, and the draft-then-keep flow preserves "their words, their choice."

## Interaction contract
`advocate-agent` gains `timeline_builder` (JWT-gated, capped, guardrail floor):
- **input** `{ turns: [{role: "user"|"helper", content}], language: "en"|"es" }` — stateless server; the thread lives in component memory and is wiped on leave.
- **output (strict JSON)** `{ entries: [{when: string, what: string}], questions: string[], note: string }`
  - `when`: the person's own fuzzy anchor ("around last winter") or ISO-ish date if THEY gave one; empty if unknown. Never invented.
  - `what`: the event in their words, lightly trimmed. Never new details.
  - `questions`: ≤2; ordering/rough-when only; each phrased with skipping allowed; a skipped or "don't know" question is retired forever.
  - `note`: one warm plain sentence (e.g., what changed this round).
- Server validates shape and clamps counts/lengths; invalid model output → one retry → calm error.

## Prompt hard rules (new `timeline.builder` registry entry; the stub's rules absorbed)
Their words only; never invent events, dates, names, or details; fuzzy anchors are first-class, never pressed into dates; ≤2 questions per turn, only about relative order or rough timing of events they stated, each explicitly skippable; a skip/"don't know" retires the question — never re-asked or rephrased; never "why"; never doubt or inconsistency framing (differences are simply left as they are); nothing about sexual history (FRE 412); no labels; 6th-grade plain language; follow the person's language.

## UI
"Your timeline" tab gets a purpose lede ("A place to put what happened in order — in your words, with fuzzy dates welcome.") and a **"Put it in order"** card: textarea ("Write what happened in any order. Messy is fine. Nothing is saved unless you keep it.") → proposal renders as draft rows (when + what) each with **Keep** (saves via existing `upsertTimeline`, default visibility) and the helper's questions as skippable chips above the composer. Deterministic crisis tripwire runs client-side before any network call (statement-save pattern: hotline card surfaces, nothing blocks). Thread and drafts wiped on unmount. EN + ES.

## Demo (/tour chapter 05)
The timeline beat becomes a moment: a messy sentence appears, then assembles into two ordered draft rows while a question bubble shows ("Which came first — the move, or the new job? Skipping is okay."), then the existing fuzzy-date row. Chapter description names the helper honestly.

## Testing
Prompt hard-rules verbatim test; response-validator unit tests (counts, lengths, shape, clamping); copy parity by compile; live probes: scattered input → ordered entries + ≤2 gentle questions; "skip" answer → question retired; no invented details (spot-check against input).

## Out of scope (deliberate)
Auto-saving anything; linking entries to statements (`source_statement_id`) — later; date math or calendar pickers; using private statements as input without the person pasting them (they choose what enters the thread).
