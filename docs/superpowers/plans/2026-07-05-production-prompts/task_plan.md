# Production prompts + scripts from the trafficking research

Source: the Perplexity research doc (US federal criminal, trauma-informed,
source-cited). Its own hard rules are our north star and MATCH our existing
invariants — reinforce, never weaken:
- Never coach, script, shape, or change testimony. No sample answers, no
  "practice questions" that rehearse the account, no persuasion tips.
- Cross-examination = PROCESS familiarization (short/leading/yes-no questions,
  repetition, answering only what's asked, asking for clarification/breaks),
  NOT content rehearsal.
- FRE 412: never touch sexual behavior/history.
- Never say "victim" (unless quoting law). Never diagnose/conclude trafficking.
- Trauma & memory: gaps/out-of-order/emotion are common and never a credibility
  judgment.
- Only a qualified attorney explains how a rule applies to their case.

## Phases
1. **Knowledge ingest** — turn the research into ~14 published `project_knowledge`
   entries (court journey, rights/CVRA, accommodations/ADA, FRE 412, trauma &
   memory, process-not-scripts, grounding, sentencing, resources). Target the
   right agents. Insert via service-role REST (live + expert-editable).
2. **Production prompts (git defaults)** — rewrite all 10 prompt defaults to be
   production-ready and research-grounded, in advocatePrompts.ts (coach ×4 +
   defense.practice) and promptRegistry.ts (translator/organizer/reframer/
   recognition/interviewer). Commit + deploy → new baseline, still dev-editable.
3. **Scripts** — court-relevant opening lines + a warm-up→process ladder baked
   into the Coach and Practice prompts. FIX the "describe the room" warm-up:
   warm up with name/comfort + the FEEL of the format, never breakfast, never
   rehearsing events.
4. **Global guardrails** — the cross-cutting hard rules set once (agent_config
   guardrails.global) so every agent inherits them.
5. **Verify** — live-test Coach, Practice person, Recognition refusal,
   Translator; confirm knowledge + guardrails inject; commit; summarize.

## Out of scope / SME gate (unchanged)
Real-survivor launch still needs attorney + trauma-therapist sign-off (the doc
says so explicitly — "do not ship without review"). These prompts are
production-QUALITY placeholders, clearly better than before, still gated at ship.
