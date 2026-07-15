# Practice Story + Coach Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (inline, author-executed — continuation of the approved assessment; items 1,2,3,4,6; item 5 deliberately routed to SME instead).

**Goal:** Every survivor gets a real, case-anchored pressure practice via a fictional story (the safe default tier); the Coach gains survivor-controlled continuity and a name-the-win close; silence no longer contradicts the idle disconnect; practice follows the person's language.

**Architecture:** The fictional story is a server-canonical constant (`_shared/practiceStory.ts`, EN+ES) mirrored in the client copy bundles with a parity test (same pattern as appMap). The material tier is a server-side switch — clients send `material: "fictional" | "own"`, never story text. Voice practice injects the story at token mint; avatar practice injects it in `defense_turn`. The Coach note is survivor-authored text stored with the same encryption posture as other free text, injected only into coach modes (never practice). Ordinary session closes get a deterministic client-side "named win" card (no transcripts, no AI). Idle check-in happens client-side one minute before the idle cap in coach modes only.

**Tech stack:** existing — TanStack/React client, Deno edge functions, pgcrypto+vault RPC pattern, vitest.

## Global Constraints
- Survivor-facing copy ships EN + ES (usted, es-419, no urgency words, no labels) in BOTH bundles; parity is compile/test-enforced.
- The fictional story: everyday incident (no trafficking content, no violence, nothing sexual), concrete pressable details (time, weather, order), explicitly labeled made-up, ≤6 short sentences.
- Practice prompts keep every hard rule (IDK-retires-question, no daily-life quizzes — the STORY's details are fair game, that's the point; FRE 412; stop).
- The Coach note is NEVER injected into defense/practice modes.
- Commits modest ("interactive practice improvements"), functions redeployed when `_shared` changes, no repo-address changes.

### Task 1: Fictional practice story — shared constant + copy + parity test
Create `supabase/functions/_shared/practiceStory.ts` (EN+ES story + fenced prompt block builder with fictional framing), mirror story text in `src/lib/copy/en.ts` + `es/index.ts` under `session.witness.story*`, parity test in `src/lib/tour/`-style location (`src/lib/copy/practiceStory.test.ts`) asserting client story === server story (import server file directly like appMap parity test does).

### Task 2: Material tier — server switch
`advocate-agent` `defense_turn`: accept `material` + `language`; fictional → inject story block (ignore client account), own → existing framing; append language line. `advocate-voice-token`: accept `material` for mode=defense → append story block to systemText (voice defense becomes story-anchored). DEFENSE_PRACTICE_PROMPT + COACH_DEFENSE: replace no-excerpts paragraphs with material-aware wording (story mode: question ONLY from the story; the format-rights moves stay woven in).

### Task 3: Material tier — client flow
`session.tsx`: consent stage gains the choice (primary: "Practice with a made-up story" / secondary when shareable content exists: "Use my own shared words"); fictional → new `story` stage showing the labeled story + "I've read it — begin". `useLiveAvatarPractice` passes `material`+`language` through; voice fallback token request passes `material`. Copy EN+ES.

### Task 4: Idle check-in before disconnect (coach modes)
In the voice hook where the idle timer lives: at cap−60s send a quiet instruction turn ("the person has been quiet — check in gently once; silence is okay"); disconnect only at the cap. Defense modes keep the deterministic handoff.

### Task 5: Name-the-win close for ordinary sessions
Client-side: ordinary `finishSession` shows a small close card naming the session's category deterministically (talked with Coach / practiced questions / typed things through) + care plan + Done. One line added to COACH_BASE for voice closes.

### Task 6: Coach note ("Things I want my Coach to remember")
Migration: encrypted column via existing pgcrypto/vault RPC pattern + definer read RPC. Settings card (cap ~500 chars, honest copy, EN+ES). `advocate-voice-token`: coach modes fetch + append fenced note ("the person wrote this themselves; follow it, never probe beyond it").

### Task 7: Verify + ship
Full vitest; live probes: defense_turn fictional (questions reference story details; IDK still retires); voice token mint (material accepted); coach note round-trip on live DB; deploy advocate-agent/voice-token/defense-llm; push; tour unaffected check.

## Self-review
Items map: #1→T1-3, #4→T4, #3→T5, #2→T6, #6→inside T2/T3 (language passing); #5 absent by decision. Copy parity + encryption posture honored. Voice-own-account explicitly out of scope (future).
