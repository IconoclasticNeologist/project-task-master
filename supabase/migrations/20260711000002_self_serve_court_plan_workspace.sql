-- Self-serve survivors could never use "Your plan": client_workspaces required an
-- organization (organization_id NOT NULL), and a workspace was only ever created by
-- the org-invite / legacy-gatekeeper redeem paths. A survivor who entered through
-- /begin (no code, no gatekeeper, no organization) had no workspace, so
-- get_my_court_plan_workspace() returned null and every plan save failed.
--
-- A workspace is just the container for a person's own court plan. It must not
-- require an organization. Personal (organization-less) workspaces are invisible
-- to all professional tooling by construction: grants join through organization
-- memberships, and org dashboards join organizations on w.organization_id.

-- 1. Allow personal workspaces.
alter table public.client_workspaces
  alter column organization_id drop not null;

-- unique (organization_id, survivor_id) treats NULLs as distinct, so enforce at
-- most one PERSONAL workspace per survivor separately.
create unique index if not exists client_workspaces_one_personal_per_survivor
  on public.client_workspaces (survivor_id)
  where organization_id is null;

-- 2. Self-serve entry now provisions the personal workspace. Byte-identical to
-- 20260705000005 apart from the workspace block; retry-safe and race-safe.
create or replace function public.create_self_serve_survivor()
  returns uuid
  language plpgsql security definer set search_path = public, extensions as $$
declare
  v_uid      uuid := auth.uid();
  v_survivor uuid;
begin
  if v_uid is null then
    raise exception 'must be authenticated';
  end if;

  -- Idempotent: auth_user_id is unique, so a retry returns the same survivor.
  select id into v_survivor from public.survivors where auth_user_id = v_uid;
  if v_survivor is null then
    insert into public.survivors (auth_user_id, gatekeeper_id)
    values (v_uid, null)
    returning id into v_survivor;
  end if;

  -- A personal court-plan workspace, only when the survivor has none at all
  -- (an org workspace acquired later already serves as their plan container —
  -- get_my_court_plan_workspace() picks the oldest workspace deterministically).
  if not exists (
    select 1 from public.client_workspaces w where w.survivor_id = v_survivor
  ) then
    insert into public.client_workspaces (organization_id, survivor_id)
    values (null, v_survivor)
    on conflict (survivor_id) where organization_id is null do nothing;
  end if;

  return v_survivor;
end;
$$;

-- 3. Backfill: every existing survivor with no workspace at all (self-serve
-- entrants to date, and any legacy survivor whose gatekeeper never became an
-- organization) gets a personal one, so their /plan starts working immediately.
insert into public.client_workspaces (organization_id, survivor_id)
select null, s.id
from public.survivors s
where not exists (
  select 1 from public.client_workspaces w where w.survivor_id = s.id
);
