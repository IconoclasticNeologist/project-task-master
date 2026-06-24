-- CRITICAL FIX: the survivor-facing tables had NO table-level privileges granted
-- to the `authenticated` role, so every survivor query failed with SQLSTATE 42501
-- (permission denied) BEFORE row-level security was ever evaluated. The gate kept
-- working because it goes through SECURITY DEFINER RPCs (which bypass grants), so
-- the problem stayed hidden: a person could sign in but never load a single
-- statement, timeline entry, document, or setting.
--
-- RLS already restricts WHICH rows each survivor can see; these grants restore the
-- table-level access that Supabase normally provides. Anonymous survivors use the
-- `authenticated` role (with an is_anonymous claim), so granting to `authenticated`
-- covers them.

grant select, insert, update, delete on public.statements      to authenticated;
grant select, insert, update, delete on public.timeline_events  to authenticated;
grant select, insert, update, delete on public.documents        to authenticated;
grant select, insert, update, delete on public.embeddings       to authenticated;
grant select, update                 on public.survivors        to authenticated;
