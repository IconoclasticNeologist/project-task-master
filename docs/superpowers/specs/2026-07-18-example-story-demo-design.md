# The example story, end to end — design

**Date:** 2026-07-18
**Status:** Proposed (awaiting founder review)
**Scope:** one implementation plan

## 1. Why

Reviewers meet the app empty. Every screen works, but an empty space cannot show
what the app is *for* — and the Witness Stand practice, the flagship, reads as a
tech demo unless the whole app already holds one believable story for it to sit
inside.

Today's presenter aid (`/judges` → enable → create a space by hand → Home →
"Load an example (demo)" behind a native `confirm()`) has four problems:

1. **Friction.** Four screens and a browser dialog before anything is visible.
2. **Thin content.** Three statements and three timeline rows read as
   placeholders, not a person. Nothing feeds the Coach, the plan, the draft, or
   the consent story.
3. **English only.** The example ignores the app's own bilingual promise.
4. **No arc.** A reviewer who loads it gets data, not a path. Nothing tells them
   what to look at, or why the practice exercise helps anyone.

This design replaces the seed with one coherent fictional case that flows
through every feature, makes the offer one tap, and tightens the live practice
person so the exercise presents the way it actually works: calm, anchored,
human.

## 2. What exists (inventory)

- `src/lib/data/demoSeed.ts` — clears the RLS-scoped account, seeds 3
  statements (shareable, indexed for search), 3 timeline rows, aftercare.
  Defense-in-depth gate: throws unless `isDemoToolsEnabled()`.
- `src/routes/judges.tsx` — public page; "Enable sample data on this device"
  flips the per-device flag only.
- `src/routes/home.tsx` — dashed "Load an example (demo)" button, native
  `confirm()`, navigates to `/account` on success.
- Witness Stand material tiers — **fictional story** (server-canonical
  laundromat incident, `_shared/practiceStory.ts`) is the standard; **"your own
  shared words"** is the opt-in tier, RAG-locked to `visibility: "shareable"`
  statements only.
- "A note to your Coach" — encrypted, injected at session mint, **coach modes
  only**; the practice person never receives it.
- Court plan (`courtPlan.ts`), draft export, ReflectPanel (recognition /
  reframer), timeline "Put it in order" helper — all read the same account
  content and currently have almost nothing to read.

## 3. Approaches considered

**A. Polish the current button.** Better copy, same path. Rejected: doesn't
touch content thinness, friction, or the practice presentation.

**B. One-tap example + coherent case + practice-person delivery work
(chosen).** A single action provisions, seeds, and lands the reviewer inside a
guided example; the seed becomes one story deep enough to demonstrate every
feature; the practice person's delivery is tuned so the live exercise feels like
a person. Most work is copy, which is also the point — the copy *is* the demo.

**C. A scripted overlay walkthrough of the live app.** Rejected: duplicates
`/tour` (which already does guided replay well), heavy to build, and fragile
live.

## 4. The example case (the seed, v2)

One fictional labor-trafficking case, first person, plain words, at the app's
own register: no "victim", nothing sexual (the FRE 412 discipline holds for
fiction too), no graphic violence, coercion legible through concrete detail.
The v1 spine (paid flight, growing debt, held passport, the threat about her
mother's town) is kept and deepened, so nothing already shown elsewhere
contradicts it. It is deliberately **distinct from the laundromat practice
story** — that story is the neutral practice material tier; this is "her own
words."

The seed follows the **current UI language** (EN and ES bundles, parity test,
usted register — flag ES for native-speaker review like the rest of the
bundles).

### 4.1 Statements — six, five shareable + one private

The private one is the consent story made visible: the practice person and any
professional structurally cannot see it.

EN (ES mirrors in the implementation):

1. *"He paid for my flight and the papers. He said I could pay it back from my
   wages. The number he said I owed went up every month, and he never let me
   see how it was counted."* — shareable
2. *"I wasn't allowed to keep my own papers. He kept my passport in a drawer in
   the office and said I'd be in trouble with the police if they found me
   without it."* — shareable
3. *"We started before the sun came up and finished after dark. He counted the
   hours his way. If I asked about the pay, he said the debt came first."* —
   shareable
4. *"I slept in the back room over the kitchen with three others. He held the
   only key. When the door was locked from outside, we waited."* — shareable
5. *"When I said I wanted to leave, he reminded me that he knew the town where
   my mother lives. He said it slowly, like a favor."* — shareable
6. *"Some nights I still hear the freezer door. I haven't told anyone about the
   winter. I'm not ready."* — **private**

Why these six: each carries a recognizable coercion pattern (debt bondage,
document confiscation, wage control, restricted movement, threat to family),
each has pressable specifics (times, places, order) so "own words" practice has
real material, and #6 gives the space an interior life while marking a hard
boundary the product then visibly honors. What happened "in the winter" is
never specified anywhere — withheld, not implied in detail.

### 4.2 Timeline — seven rows, dates and rough anchors mixed

1. **2023-03-10** — "I arrived. He met me at the airport and took my bag. He
   was kind that day."
2. *a few weeks after I arrived* — "He took my passport. He said he would keep
   it safe with the work papers."
3. *that first summer* — "The debt started going up instead of down. He added
   rent for the back room and money for the flights."
4. *around the second winter* — "The night shifts got longer. I stopped
   counting the hours."
5. *last spring* — "The first time I tried to leave. I came back on my own
   before morning."
6. **2025-11-02** — "A woman from the clinic asked me if I was okay. I said
   yes. She gave me a card anyway."
7. *two months later* — "I called the number on the card."

Rows 4/5 are genuinely order-ambiguous against 3, so the timeline helper's
"Put it in order" flow has a real, skippable question to ask. Row 7 ends the
arc with her own action — she calls; nobody rescues her. All shareable.

### 4.3 Care plan, Coach note, court plan

- **Aftercare** (kept from v1): support person "My sister, Ana"; calming thing
  "A song my mother used to sing." These resurface in session closings.
- **A note to your Coach** (new):
  *"I get quiet when I am nervous. It is not that I want to stop — I just need
  a minute. It helps when you say there is no hurry. Please don't ask me about
  the freezer. My hearing is on the 12th and I'm scared of the questions
  part."*
  This is the Coach-humanity beat: the session opens personal, unhurried, and
  the boundary ("the freezer") is respected out loud by never being raised —
  while the practice person, which never receives the note, demonstrates the
  isolation between modes.
- **Court plan items** (new, three, via `createMyCourtPlanItem`):
  1. `support` — "Ask about a support person sitting where I can see them",
     detail "Ana said she would come."
  2. `question` — "Practice saying 'I don't know' out loud", detail "It is a
     real answer."
  3. `travel` — "Plan the morning of the 12th", detail "Bus route, arrive
     early, eat something."
- **Onboarding**: seeding calls `markOnboarded()` so Home doesn't show the
  finish-setup card over the example.

### 4.4 Seed mechanics

- `loadExampleData(lang)` keeps the clear-then-seed contract and the
  `isDemoToolsEnabled()` throw. New: coach note (`app_set_coach_note`), plan
  items, `markOnboarded`, language-selected bundle, and a per-device marker
  (`advocate-example-loaded`) set on success.
- New `clearExampleData()` — the deletes without the reseed; clears the marker.
- Statement indexing keeps the language of the seeded text so search works in
  the seeded language.

## 5. The offer (entry flow)

### 5.1 One tap from `/judges`

Reviewer tools card gains the primary action **"Open the app with the example
story"**: enables the device flag → `createSelfServeSurvivor()` (anonymous, as
always; idempotent for an existing session) → `loadExampleData(currentLang)` →
lands on `/home`. The existing "enable only" button remains as the quiet
secondary. Two guarded edges: if the device's space already holds content, the
one-tap does **not** seed over it — it lands on Home where the re-load path
runs through the §5.4 dialog; and on any failure it lands on Home with the
offer card (below) and a plain error line — never a dead end.

### 5.2 The Home offer card (the "popup")

When demo tools are **on** and the space is **empty** and no example is loaded,
Home shows a calm card (not a native dialog):

> **Want to see an example first?**
> A made-up story can fill this space so you can see how everything works —
> her words, her timeline, the practice. Nothing here is real. One tap clears
> it again.
> [Load the example] [Not now]

"Not now" dismisses for the visit. On a device without demo tools, none of this
exists — the defense-in-depth gate is unchanged.

### 5.3 The example banner + guided path

While the marker is set (and demo tools on), Home shows a quiet amber-family
banner above the tiles:

> **This space holds a made-up example — not a real person.**
> A path worth walking: → Her words · → In her order · → Meet the Coach ·
> → The Witness Stand · → A draft for a lawyer · → What she shared
> [Clear the example]

Each chip links to the real surface (`/account`, `/account#timeline`,
`/session`, `/session` practice, draft export, `/team`). The chips are the
"why this helps" framing made walkable: words → order → steadying → format
practice → something a lawyer can use → consent you can revoke.

### 5.4 Dialog hygiene

The native `confirm()` is replaced with the app's own dialog for the one
destructive action (re-loading over a non-empty space). Same guarantee, calmer
frame, no browser chrome mid-demo.

## 6. The practice person, presented well

The language work (2026-07-17, `e86ca1a`) already made the session follow the
on-screen language end to end. Remaining work is delivery, latency, and
framing.

### 6.1 Delivery additions to `DEFENSE_PRACTICE_PROMPT`

Additive lines only; every existing hard rule stays verbatim. Prompts are
SME-gated — these ship through the same git review path and are flagged for
attorney/clinician review like the rest:

- "SOUND LIKE A PERSON, NOT A FORM: vary how your questions begin — never open
  two questions in a row the same way. You may acknowledge an answer in two or
  three plain words first ('Thank you.' 'All right.') — sometimes, not every
  turn."
- "When it helps, anchor the next question to something they said earlier in
  THIS practice, in their words ('You said you told her what you saw. Just yes
  or no — did you see him write it?'). Their words only — never new facts."
- "If they gave a first name at the start, you may use it occasionally,
  plainly."
- "A one-beat transition is allowed when you change topic ('Let me ask about
  the van.')."
- "Keep every line short — at most one sentence before the question. Short
  lines keep your voice quick and natural."

`COACH_DEFENSE` (voice-only practice) receives the same delivery guidance where
it applies.

### 6.2 Opener latency

Today the opener generates only after the avatar session reaches CONNECTED —
the reviewer watches a silent face for the full LLM round-trip. Change: kick
off `defense_turn` (opening) as soon as the token is minted, in parallel with
WebRTC setup; when CONNECTED fires, speak the held line (generate then, as
today, if the pre-generation failed). History is appended at speak time, so
ordering is unchanged.

### 6.3 The rights, visible

A quiet three-chip row under the practice video, survivor-facing (not
demo-only), both languages:

> "I don't know" is allowed · You can ask for a repeat · "Stop" ends it

This is the exercise's own theory of change, stated where the pressure is:
format practice plus the rights that survive it. The prompts already name each
right as it is used; the chips make the same promise scannable.

## 7. A suggested three-minute path (for the founder's demo, not shipped copy)

1. `/judges` → one tap → Home banner: *nothing real, and a real survivor's
   device can never reach this.*
2. **Her words** — read two statements; search finds them.
3. **In her order** — timeline; run "Put it in order"; it asks one skippable
   question about the spring/winter order; keep a row.
4. **The Coach** — start a session; the opener is personal (the note), no
   hurry, and "the freezer" is never raised.
5. **The Witness Stand** — consent screen (stop word, timer, "not now" is a
   real button) → choose *her shared words* → the practice person asks only
   from the five shareable statements — never the sixth. Answer once, say "I
   don't know" once, watch it accepted and retired. Stop → the Coach handoff.
6. **The draft, the team** — export the lawyer-formatted draft; on the team
   screen a professional's view holds five statements, not six; revoke access
   live.
7. Optionally: flip the top-bar language to Español mid-walk — everything
   follows, including the practice person.

## 8. Safety invariants (unchanged, restated because the demo leans on them)

- `isDemoToolsEnabled()` gate and RLS scoping: the seed can only ever fill the
  current anonymous account on an explicitly demo-enabled device.
- The fiction is labeled at the point of entry (offer card), while loaded
  (banner), and in row content ("example" never masquerades once demo tools are
  off — flag off ⇒ banner and offer are gone, but so is every path that could
  have seeded).
- The private statement demonstrates, and never weakens, visibility scoping.
- Coach note stays coach-modes-only. Practice material stays
  shareable-only. No prompt hard rule changes.
- The recognition refusal stays out of the featured path (founder's standing
  call); ReflectPanel remains available for reviewers who explore.

## 9. Pre-demo operations checklist (people, not code)

- LiveAvatar credits > 0 and `agent_config.avatar.sandbox = false` (watermark
  otherwise); confirm in `/dev`.
- Interactivity config as rehearsed (answer-button flow).
- Warm prod after any push; verify by rendered DOM; no pushes during
  reviewer-likely hours.
- Seed the demo device *before* presenting (mint reads the coach note at
  session start; seeding requires the self-serve space to exist — the one-tap
  handles both).
- Rehearse the practice beat once on the day; credits are per-minute.

## 10. Implementation map

| Area | Files |
| --- | --- |
| Seed v2 (EN/ES content, note, plan, marker, clear) | `src/lib/data/demoSeed.ts`, `demoTools.ts`, tests |
| One-tap open-with-example | `src/routes/judges.tsx` |
| Offer card, banner, chips, dialog | `src/routes/home.tsx`, copy bundles EN/ES |
| Practice delivery lines | `supabase/functions/_shared/advocatePrompts.ts` (+ function redeploys) |
| Opener pre-generation | `src/lib/voice/useLiveAvatarPractice.ts` |
| Rights chips | session witness-stage component, copy bundles |

## 11. Testing

- Seed: EN/ES parity (shape + counts), private statement present exactly once,
  plan items created, marker lifecycle, gate still throws when disabled.
- Home: offer card renders only when (demo on ∧ empty ∧ no marker); banner only
  when marker; neither exists with demo tools off.
- Prompts: existing guardrail tests unchanged and passing (additions are
  additive); parity test between client practice-story mirror untouched.
- Opener pre-generation: unit test with a slow fake `defense_turn` — spoken
  only after CONNECTED, exactly once, fallback path covered.
- Live pass on prod after deploy: the seven-step path in §7, EN and ES.

## 12. Out of scope

- Seeding uploaded documents (client-side encryption makes fixture files a
  separate design).
- Any `/tour` changes.
- The recognition-refusal moment as a featured beat.
- Returning-device adaptivity (already deferred).
