# Timeline Helper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (inline, author-executed; spec: docs/superpowers/specs/2026-07-15-timeline-helper-design.md — founder pre-approved brainstorm→plan→execute).

**Goal:** Ship the founding timeline idea: messy words in, an organized draft timeline out, with ≤2 gentle skippable ordering questions per round; nothing saved until the person keeps a row. Portray it in the tour.

**Architecture:** per the spec — stateless `timeline_builder` agent branch (JSON contract, server-validated), registry prompt + per-agent guardrails, bounded refine-loop UI card on the timeline tab, existing save path, tour beat.

## Global Constraints
Same as the practice-story plan: EN+ES survivor copy in both bundles; guardrail floor untouched and auto-applied; deterministic client tripwire before network; no persistence of the thread; modest commit wording; functions redeployed; tour stays replay-honest.

### Task 1: Prompt + server agent
`_shared/advocatePrompts.ts` gains TIMELINE_BUILDER_PROMPT (spec hard rules; absorbs and deletes the client stub `src/lib/agents/timeline-builder.ts`); registry key `timeline.builder`; `guardrails.ts` byAgent entry. `advocate-agent` gains the `timeline_builder` branch: turns→contents (helper→model), strict-JSON generateReply, `parseTimelineReply` validation (entries≤12, when≤80ch, what≤300ch, questions≤2 each ≤200ch, note≤200ch; strip code fences; one retry on invalid). Deploy.

### Task 2: Client runner + validator tests
`src/lib/agents/timelineBuilder.ts` (replaces stub): `runTimelineBuilder(turns, language)` → invoke + parse (shared shape guard, defensive re-validation) + `TimelineProposal` types. Vitest: validator accepts/clamps/rejects fixtures.

### Task 3: UI — "Put it in order" card
`src/components/account/TimelineHelper.tsx`: thread state (memory only), composer, crisis tripwire pre-network (reuse statements' crisis util), proposal rows with Keep (upsertTimeline; kept-state feedback), question chips (tap to insert "About …: " into composer or Skip → sends "skip that question"), busy/error states, wipe on unmount. Mount in TimelineList above the list + purpose lede. Copy EN+ES (`account.timelineHelper.*`).

### Task 4: Tour beat
Ch05: messy line → two assembling draft rows + question bubble → existing fuzzy row; dur +2s; EN desc + es strings via tour copy module (drift-guard where strings exist in app bundles).

### Task 5: Verify + ship
vitest all, tsc, eslint; deploy advocate-agent; live probes (scatter → order + questions; skip retires; no invention); UI screenshots (helper card, proposal with Keep, ES variant); tour screenshot; push; memory update.
