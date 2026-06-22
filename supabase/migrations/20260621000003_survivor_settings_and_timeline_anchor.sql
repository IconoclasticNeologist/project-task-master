-- Settings/aftercare columns the built UI needs + the onboarding-completion marker,
-- and the timeline reconciliation (free-text relative "when" + no-title rows).
-- All on existing tables already covered by survivors_self / timeline_events RLS.

alter table public.survivors
  add column onboarded_at        timestamptz,
  add column calming_anchor      text,
  add column default_visibility  public.content_visibility not null default 'private';

alter table public.timeline_events
  add column relative_anchor text,
  alter column title drop not null;
