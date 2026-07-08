-- Two-person review for project_knowledge (the curated text injected into EVERY agent's
-- system prompt for EVERY survivor).
--
-- Before this, any single approved professional could set status='published' and their
-- text reached all survivors' agents on the next call — a cross-tenant prompt-poisoning
-- vector with no second set of eyes. This adds a reviewer who must be DIFFERENT from the
-- author. The enforcement that matters (only reviewed knowledge reaches agents) lives in
-- _shared/knowledge.ts; these columns are what it checks. Additive and safe to apply.
--
-- Fail-closed by design: existing published-but-unreviewed entries stop reaching agents
-- until a second professional approves them. That is the correct default for text that
-- speaks to survivors in crisis.

alter table public.project_knowledge
  add column if not exists reviewed_by text,
  add column if not exists reviewed_at timestamptz;
