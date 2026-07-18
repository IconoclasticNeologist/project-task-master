-- PostgREST needs SELECT alongside DELETE to evaluate the id filter of the
-- clear-example delete (42501 with exactly this hint otherwise). RLS still
-- scopes every read through workspaces_client_or_grantee_read — the survivor's
-- own workspace only.
grant select on table public.court_plan_items to authenticated;
