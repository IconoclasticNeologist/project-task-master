-- Service-role grants for the admin control plane (advocate-admin).
--
-- This database does not apply default privileges automatically (the same
-- 42501 class fixed earlier for authenticated on survivor tables), so the
-- edge functions' service role needs explicit grants. Metadata tables only;
-- the single survivor-table grant is SELECT for a count — the admin surface
-- never reads survivor content by design.
--
-- NOTE: these statements may already have been applied by hand via the SQL
-- editor (2026-07-03). Grants are idempotent; re-applying is a no-op.

grant select, insert on public.gatekeepers to service_role;
grant select, insert, update on public.professional_approvals to service_role;
grant select on public.access_codes to service_role;
grant select on public.client_invites to service_role;
grant select on public.organizations to service_role;
grant select on public.organization_memberships to service_role;
grant select on public.client_workspaces to service_role;
grant select on public.client_access_grants to service_role;
grant select on public.survivors to service_role;

-- Prevent recurrence for tables created by future migrations.
alter default privileges in schema public grant all on tables to service_role;
