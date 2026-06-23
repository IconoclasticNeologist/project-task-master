-- Organizations + consent-based client access.
--
-- This migration deliberately leaves the existing gatekeeper model in place
-- for backwards compatibility, but mirrors every legacy relationship into a
-- survivor-visible access grant. Revoking that grant also closes the legacy
-- gatekeeper read path.

create type public.organization_member_role as enum (
  'owner',
  'admin',
  'content_editor',
  'legal_reviewer',
  'wellbeing_reviewer',
  'lived_experience_reviewer',
  'legal_professional',
  'advocate',
  'case_worker',
  'clinical_professional',
  'justice_partner'
);

create type public.organization_membership_status as enum ('active', 'suspended');
create type public.client_access_scope as enum (
  'logistics',
  'support_plan',
  'shared_statements',
  'shared_timeline',
  'shared_documents',
  'client_questions'
);
create type public.client_access_status as enum ('pending', 'active', 'declined', 'revoked', 'expired');
create type public.knowledge_source_type as enum (
  'law_or_rule',
  'official_guidance',
  'research',
  'professional_practice',
  'local_operations'
);
create type public.knowledge_item_status as enum ('draft', 'in_review', 'published', 'retired');
create type public.knowledge_risk_class as enum ('low', 'legal_sensitive', 'wellbeing_sensitive', 'critical');
create type public.knowledge_review_area as enum ('legal', 'wellbeing', 'lived_experience');
create type public.knowledge_review_decision as enum ('approved', 'changes_requested', 'rejected');
create type public.court_plan_category as enum (
  'hearing_details',
  'travel',
  'accommodation',
  'support',
  'question'
);
create type public.court_plan_item_status as enum ('not_started', 'in_progress', 'done');
create type public.resource_category as enum ('crisis', 'legal', 'local', 'court', 'accommodation');
create type public.resource_status as enum ('draft', 'published', 'retired');
create type public.resource_verification_decision as enum ('verified', 'needs_update');

create table public.organizations (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null check (char_length(trim(name)) between 1 and 160),
  default_jurisdiction  text,
  legacy_gatekeeper_id  uuid unique references public.gatekeepers (id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create table public.organization_memberships (
  id            uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  auth_user_id  uuid not null references auth.users (id) on delete cascade,
  display_name  text,
  role          public.organization_member_role not null,
  status        public.organization_membership_status not null default 'active',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (organization_id, auth_user_id)
);

-- Platform approval is intentionally separate from an organization membership.
-- An email address alone is not proof that someone may handle client data.
create table public.professional_approvals (
  auth_user_id                  uuid primary key references auth.users (id) on delete cascade,
  organization_creation_allowed boolean not null default false,
  approved_at                   timestamptz not null default now(),
  revoked_at                    timestamptz
);

create table public.client_workspaces (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  survivor_id     uuid not null references public.survivors (id) on delete cascade,
  label           text not null default 'My court plan' check (char_length(trim(label)) between 1 and 160),
  jurisdiction    text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organization_id, survivor_id)
);

create table public.client_access_grants (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.client_workspaces (id) on delete cascade,
  membership_id   uuid not null references public.organization_memberships (id) on delete cascade,
  scopes          public.client_access_scope[] not null,
  purpose         text not null check (char_length(trim(purpose)) between 1 and 600),
  status          public.client_access_status not null default 'pending',
  origin          text not null default 'organization_request'
                  check (origin in ('organization_request', 'legacy_gatekeeper')),
  requested_at    timestamptz not null default now(),
  responded_at    timestamptz,
  expires_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (cardinality(scopes) > 0),
  check (expires_at is null or expires_at > requested_at)
);

create table public.client_invites (
  id                        uuid primary key default gen_random_uuid(),
  organization_id           uuid not null references public.organizations (id) on delete cascade,
  requested_by_membership_id uuid not null references public.organization_memberships (id) on delete restrict,
  code_hash                 text not null,
  label                     text,
  scopes                    public.client_access_scope[] not null,
  purpose                   text not null check (char_length(trim(purpose)) between 1 and 600),
  expires_at                timestamptz,
  redeemed_by               uuid references public.survivors (id) on delete set null,
  redeemed_at               timestamptz,
  created_at                timestamptz not null default now(),
  check (cardinality(scopes) > 0),
  check (expires_at is null or expires_at > created_at)
);

create table public.organization_member_invites (
  id                        uuid primary key default gen_random_uuid(),
  organization_id           uuid not null references public.organizations (id) on delete cascade,
  invited_by_membership_id  uuid not null references public.organization_memberships (id) on delete restrict,
  code_hash                 text not null,
  role                      public.organization_member_role not null,
  expires_at                timestamptz not null,
  redeemed_by_membership_id uuid unique references public.organization_memberships (id) on delete set null,
  redeemed_at               timestamptz,
  created_at                timestamptz not null default now(),
  check (role <> 'owner'),
  check (expires_at > created_at)
);

-- Source records are provenance, not AI context. Only a reviewed, published
-- knowledge item may later be retrieved by the application or an AI feature.
create table public.knowledge_sources (
  id                        uuid primary key default gen_random_uuid(),
  organization_id           uuid not null references public.organizations (id) on delete cascade,
  created_by_membership_id  uuid not null references public.organization_memberships (id) on delete restrict,
  title                     text not null check (char_length(trim(title)) between 1 and 300),
  publisher                 text,
  source_url                text not null check (char_length(trim(source_url)) between 1 and 2000),
  source_type               public.knowledge_source_type not null,
  jurisdiction              text,
  publication_date          date,
  source_notes              text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create table public.knowledge_items (
  id                        uuid primary key default gen_random_uuid(),
  organization_id           uuid not null references public.organizations (id) on delete cascade,
  primary_source_id         uuid not null references public.knowledge_sources (id) on delete restrict,
  created_by_membership_id  uuid not null references public.organization_memberships (id) on delete restrict,
  title                     text not null check (char_length(trim(title)) between 1 and 160),
  body                      text not null check (char_length(trim(body)) between 1 and 3000),
  jurisdiction              text,
  language                  text not null default 'en',
  risk_class                public.knowledge_risk_class not null default 'low',
  status                    public.knowledge_item_status not null default 'draft',
  revision                  integer not null default 1 check (revision > 0),
  published_at              timestamptz,
  retired_at                timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  check (
    (status = 'published' and published_at is not null and retired_at is null)
    or (status = 'retired' and retired_at is not null)
    or (status in ('draft', 'in_review') and published_at is null and retired_at is null)
  )
);

create table public.knowledge_item_reviews (
  id                      uuid primary key default gen_random_uuid(),
  knowledge_item_id       uuid not null references public.knowledge_items (id) on delete cascade,
  reviewer_membership_id  uuid not null references public.organization_memberships (id) on delete restrict,
  review_area             public.knowledge_review_area not null,
  decision                public.knowledge_review_decision not null,
  notes                   text,
  reviewed_revision       integer not null check (reviewed_revision > 0),
  created_at              timestamptz not null default now(),
  unique (knowledge_item_id, reviewer_membership_id, review_area, reviewed_revision)
);

create table public.court_plan_items (
  id                      uuid primary key default gen_random_uuid(),
  workspace_id            uuid not null references public.client_workspaces (id) on delete cascade,
  category                public.court_plan_category not null,
  title                   text not null check (char_length(trim(title)) between 1 and 200),
  details                 text,
  status                  public.court_plan_item_status not null default 'not_started',
  due_date                date,
  sort_order              integer not null default 0,
  created_by_auth_user_id uuid references auth.users (id) on delete set null default auth.uid(),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create table public.resource_directory_entries (
  id                        uuid primary key default gen_random_uuid(),
  organization_id           uuid not null references public.organizations (id) on delete cascade,
  created_by_membership_id  uuid not null references public.organization_memberships (id) on delete restrict,
  category                  public.resource_category not null,
  name                      text not null check (char_length(trim(name)) between 1 and 200),
  phone                     text,
  text_contact              text,
  website_url               text,
  hours                     text,
  languages                 text,
  eligibility               text,
  geographic_scope          text,
  description               text,
  source_url                text not null check (char_length(trim(source_url)) between 1 and 2000),
  status                    public.resource_status not null default 'draft',
  published_at              timestamptz,
  retired_at                timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  check (
    (status = 'published' and published_at is not null and retired_at is null)
    or (status = 'retired' and retired_at is not null)
    or (status = 'draft' and published_at is null and retired_at is null)
  )
);

create table public.resource_verifications (
  id                      uuid primary key default gen_random_uuid(),
  resource_entry_id       uuid not null references public.resource_directory_entries (id) on delete cascade,
  reviewer_membership_id  uuid not null references public.organization_memberships (id) on delete restrict,
  decision                public.resource_verification_decision not null,
  verified_at             timestamptz not null default now(),
  next_review_at          timestamptz,
  notes                   text,
  unique (resource_entry_id, reviewer_membership_id, verified_at)
);

create table public.client_access_audit (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid not null references public.client_workspaces (id) on delete cascade,
  access_grant_id   uuid references public.client_access_grants (id) on delete set null,
  action            text not null check (action in ('requested', 'activated', 'declined', 'revoked', 'expired')),
  actor_auth_user_id uuid references auth.users (id) on delete set null,
  occurred_at       timestamptz not null default now()
);

alter table public.survivors
  add column legacy_gatekeeper_revoked_at timestamptz;
alter table public.survivors
  alter column gatekeeper_id drop not null;

create index organization_memberships_auth_idx on public.organization_memberships (auth_user_id);
create index client_workspaces_survivor_idx on public.client_workspaces (survivor_id);
create index client_access_grants_workspace_idx on public.client_access_grants (workspace_id, status);
create index client_access_grants_membership_idx on public.client_access_grants (membership_id, status);
create index client_invites_organization_idx on public.client_invites (organization_id, created_at desc);
create index organization_member_invites_org_idx on public.organization_member_invites (organization_id, created_at desc);
create index knowledge_sources_organization_idx on public.knowledge_sources (organization_id, created_at desc);
create index knowledge_items_organization_status_idx on public.knowledge_items (organization_id, status, updated_at desc);
create index knowledge_item_reviews_item_revision_idx on public.knowledge_item_reviews (knowledge_item_id, reviewed_revision);
create index court_plan_items_workspace_idx on public.court_plan_items (workspace_id, sort_order, created_at);
create index resource_directory_entries_org_status_idx on public.resource_directory_entries (organization_id, status, category);
create index resource_verifications_entry_idx on public.resource_verifications (resource_entry_id, verified_at desc);
create unique index client_access_grants_one_live_grant_idx
  on public.client_access_grants (workspace_id, membership_id)
  where status in ('pending', 'active');
create index client_access_audit_workspace_idx on public.client_access_audit (workspace_id, occurred_at desc);

create trigger organizations_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();
create trigger organization_memberships_updated_at
  before update on public.organization_memberships
  for each row execute function public.set_updated_at();
create trigger client_workspaces_updated_at
  before update on public.client_workspaces
  for each row execute function public.set_updated_at();
create trigger client_access_grants_updated_at
  before update on public.client_access_grants
  for each row execute function public.set_updated_at();
create trigger knowledge_sources_updated_at
  before update on public.knowledge_sources
  for each row execute function public.set_updated_at();
create trigger knowledge_items_updated_at
  before update on public.knowledge_items
  for each row execute function public.set_updated_at();
create trigger court_plan_items_updated_at
  before update on public.court_plan_items
  for each row execute function public.set_updated_at();
create trigger resource_directory_entries_updated_at
  before update on public.resource_directory_entries
  for each row execute function public.set_updated_at();

create or replace function public.is_non_anonymous_user() returns boolean
  language sql stable security definer set search_path = public as $$
  select auth.uid() is not null
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
$$;

create or replace function public.is_approved_professional() returns boolean
  language sql stable security definer set search_path = public as $$
  select public.is_non_anonymous_user()
    and exists (
      select 1
      from public.professional_approvals p
      where p.auth_user_id = auth.uid()
        and p.revoked_at is null
    )
$$;

-- Membership checks are SECURITY DEFINER so RLS policies do not recurse through
-- organization_memberships. They expose booleans only.
create or replace function public.is_active_organization_member(p_organization_id uuid)
  returns boolean
  language sql stable security definer set search_path = public as $$
  select public.is_approved_professional() and exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = p_organization_id
      and m.auth_user_id = auth.uid()
      and m.status = 'active'
  )
$$;

create or replace function public.is_organization_admin(p_organization_id uuid)
  returns boolean
  language sql stable security definer set search_path = public as $$
  select public.is_approved_professional() and exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = p_organization_id
      and m.auth_user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin')
  )
$$;

create or replace function public.has_active_client_access(
  p_workspace_id uuid,
  p_scope public.client_access_scope default null
)
  returns boolean
  language sql stable security definer set search_path = public as $$
  select public.is_approved_professional() and exists (
    select 1
    from public.client_access_grants g
    join public.organization_memberships m on m.id = g.membership_id
    where g.workspace_id = p_workspace_id
      and m.auth_user_id = auth.uid()
      and m.status = 'active'
      and g.status = 'active'
      and (g.expires_at is null or g.expires_at > now())
      and (p_scope is null or p_scope = any(g.scopes))
  )
$$;

create or replace function public.can_create_organization() returns boolean
  language sql stable security definer set search_path = public as $$
  select public.is_approved_professional()
    and exists (
      select 1
      from public.professional_approvals p
      where p.auth_user_id = auth.uid()
        and p.revoked_at is null
        and p.organization_creation_allowed
    )
$$;

create or replace function public.can_manage_organization_clients(p_organization_id uuid)
  returns boolean
  language sql stable security definer set search_path = public as $$
  select public.is_approved_professional() and exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = p_organization_id
      and m.auth_user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner', 'admin', 'legal_professional', 'advocate', 'case_worker', 'clinical_professional')
  )
$$;

create or replace function public.current_organization_membership_id(p_organization_id uuid)
  returns uuid
  language sql stable security definer set search_path = public as $$
  select m.id
  from public.organization_memberships m
  where m.organization_id = p_organization_id
    and m.auth_user_id = auth.uid()
    and m.status = 'active'
    and public.is_approved_professional()
  limit 1
$$;

create or replace function public.can_manage_organization_knowledge(p_organization_id uuid)
  returns boolean
  language sql stable security definer set search_path = public as $$
  select public.is_approved_professional() and exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = p_organization_id
      and m.auth_user_id = auth.uid()
      and m.status = 'active'
      and m.role in (
        'owner', 'admin', 'content_editor', 'legal_reviewer',
        'wellbeing_reviewer', 'lived_experience_reviewer'
      )
  )
$$;

create or replace function public.can_review_knowledge(
  p_organization_id uuid,
  p_area public.knowledge_review_area
)
  returns boolean
  language sql stable security definer set search_path = public as $$
  select public.is_approved_professional() and exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = p_organization_id
      and m.auth_user_id = auth.uid()
      and m.status = 'active'
      and (
        (p_area = 'legal' and m.role = 'legal_reviewer')
        or (p_area = 'wellbeing' and m.role = 'wellbeing_reviewer')
        or (p_area = 'lived_experience' and m.role = 'lived_experience_reviewer')
      )
  )
$$;

create or replace function public.has_active_court_plan_access(
  p_workspace_id uuid,
  p_category public.court_plan_category
)
  returns boolean
  language sql stable security definer set search_path = public as $$
  select
    case
      when p_category = 'support'
        then public.has_active_client_access(p_workspace_id, 'support_plan')
      when p_category = 'question'
        then public.has_active_client_access(p_workspace_id, 'client_questions')
      else public.has_active_client_access(p_workspace_id, 'logistics')
    end
$$;

-- Preserve the old narrow shareable-content policy until each data type is
-- migrated to scoped grants. A client can now close it through the new grant UI.
create or replace function public.is_gatekeeper_for(p_survivor_id uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.survivors s
    join public.gatekeepers g on g.id = s.gatekeeper_id
    where s.id = p_survivor_id
      and g.auth_user_id = auth.uid()
      and s.legacy_gatekeeper_revoked_at is null
  )
$$;

drop policy if exists survivors_gatekeeper_read on public.survivors;
create policy survivors_gatekeeper_read on public.survivors
  for select
  using (public.is_gatekeeper_for(id));

alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.professional_approvals enable row level security;
alter table public.client_workspaces enable row level security;
alter table public.client_access_grants enable row level security;
alter table public.client_invites enable row level security;
alter table public.organization_member_invites enable row level security;
alter table public.knowledge_sources enable row level security;
alter table public.knowledge_items enable row level security;
alter table public.knowledge_item_reviews enable row level security;
alter table public.court_plan_items enable row level security;
alter table public.resource_directory_entries enable row level security;
alter table public.resource_verifications enable row level security;
alter table public.client_access_audit enable row level security;

create policy organizations_member_read on public.organizations
  for select using (public.is_active_organization_member(id));

create policy memberships_self_or_admin_read on public.organization_memberships
  for select using (
    (auth_user_id = auth.uid() and public.is_approved_professional())
    or public.is_organization_admin(organization_id)
  );

create policy workspaces_client_or_grantee_read on public.client_workspaces
  for select using (
    survivor_id = public.current_survivor_id()
    or public.has_active_client_access(id)
  );

create policy grants_client_or_member_read on public.client_access_grants
  for select using (
    exists (
      select 1
      from public.client_workspaces w
      where w.id = workspace_id
        and w.survivor_id = public.current_survivor_id()
    )
    or exists (
      select 1
      from public.organization_memberships m
      where m.id = membership_id
        and m.auth_user_id = auth.uid()
        and m.status = 'active'
    ) and public.is_approved_professional()
  );

create policy invites_manager_read on public.client_invites
  for select using (public.can_manage_organization_clients(organization_id));

create policy member_invites_admin_read on public.organization_member_invites
  for select using (public.is_organization_admin(organization_id));

create policy knowledge_sources_manager_read on public.knowledge_sources
  for select using (public.can_manage_organization_knowledge(organization_id));

create policy knowledge_items_manager_read on public.knowledge_items
  for select using (public.can_manage_organization_knowledge(organization_id));

create policy knowledge_reviews_manager_read on public.knowledge_item_reviews
  for select using (
    exists (
      select 1
      from public.knowledge_items i
      where i.id = knowledge_item_id
        and public.can_manage_organization_knowledge(i.organization_id)
    )
  );

create policy court_plan_items_client_or_grantee_read on public.court_plan_items
  for select using (
    exists (
      select 1 from public.client_workspaces w
      where w.id = workspace_id
        and w.survivor_id = public.current_survivor_id()
    )
    or public.has_active_court_plan_access(workspace_id, category)
  );

create policy court_plan_items_client_or_grantee_insert on public.court_plan_items
  for insert with check (
    exists (
      select 1 from public.client_workspaces w
      where w.id = workspace_id
        and w.survivor_id = public.current_survivor_id()
    )
    or public.has_active_court_plan_access(workspace_id, category)
  );

create policy court_plan_items_client_or_grantee_update on public.court_plan_items
  for update using (
    exists (
      select 1 from public.client_workspaces w
      where w.id = workspace_id
        and w.survivor_id = public.current_survivor_id()
    )
    or public.has_active_court_plan_access(workspace_id, category)
  )
  with check (
    exists (
      select 1 from public.client_workspaces w
      where w.id = workspace_id
        and w.survivor_id = public.current_survivor_id()
    )
    or public.has_active_court_plan_access(workspace_id, category)
  );

create policy court_plan_items_client_delete on public.court_plan_items
  for delete using (
    exists (
      select 1 from public.client_workspaces w
      where w.id = workspace_id
        and w.survivor_id = public.current_survivor_id()
    )
  );

create policy resources_manager_read on public.resource_directory_entries
  for select using (
    public.can_manage_organization_knowledge(organization_id)
    or public.can_manage_organization_clients(organization_id)
  );

create policy resources_client_published_read on public.resource_directory_entries
  for select using (
    status = 'published'
    and exists (
      select 1
      from public.client_workspaces w
      where w.organization_id = resource_directory_entries.organization_id
        and w.survivor_id = public.current_survivor_id()
    )
  );

create policy resource_verifications_manager_read on public.resource_verifications
  for select using (
    exists (
      select 1
      from public.resource_directory_entries r
      where r.id = resource_entry_id
        and (
          public.can_manage_organization_knowledge(r.organization_id)
          or public.can_manage_organization_clients(r.organization_id)
        )
    )
  );

create policy audit_client_or_grantee_read on public.client_access_audit
  for select using (
    exists (
      select 1
      from public.client_workspaces w
      where w.id = workspace_id
        and w.survivor_id = public.current_survivor_id()
    )
    or exists (
      select 1
      from public.client_access_grants g
      join public.organization_memberships m on m.id = g.membership_id
      where g.id = access_grant_id
        and m.auth_user_id = auth.uid()
        and m.status = 'active'
        and g.status = 'active'
        and public.is_approved_professional()
    )
  );

-- Survivor-facing projection: this is intentionally the only client-facing
-- access-management read surface. It avoids exposing staff email addresses or
-- internal organization data.
create or replace function public.list_my_client_access_grants()
  returns table (
    grant_id uuid,
    organization_name text,
    professional_name text,
    professional_role public.organization_member_role,
    scopes public.client_access_scope[],
    purpose text,
    status public.client_access_status,
    origin text,
    requested_at timestamptz,
    responded_at timestamptz,
    expires_at timestamptz
  )
  language sql stable security definer set search_path = public as $$
  select
    g.id,
    o.name,
    m.display_name,
    m.role,
    g.scopes,
    g.purpose,
    g.status,
    g.origin,
    g.requested_at,
    g.responded_at,
    g.expires_at
  from public.client_access_grants g
  join public.client_workspaces w on w.id = g.workspace_id
  join public.organizations o on o.id = w.organization_id
  join public.organization_memberships m on m.id = g.membership_id
  where w.survivor_id = public.current_survivor_id()
  order by
    case g.status when 'pending' then 0 when 'active' then 1 else 2 end,
    g.requested_at desc
$$;

-- Professional onboarding is intentionally email-account only; anonymous
-- survivor sessions cannot create an organization or invite another person.
create or replace function public.create_organization(
  p_name text,
  p_default_jurisdiction text default null,
  p_display_name text default null
)
  returns uuid
  language plpgsql security definer set search_path = public as $$
declare
  v_organization_id uuid;
begin
  if not public.can_create_organization() then
    raise exception 'professional sign-in required';
  end if;

  insert into public.organizations (name, default_jurisdiction)
  values (p_name, nullif(trim(p_default_jurisdiction), ''))
  returning id into v_organization_id;

  insert into public.organization_memberships (
    organization_id, auth_user_id, display_name, role
  ) values (
    v_organization_id, auth.uid(), nullif(trim(p_display_name), ''), 'owner'
  );

  return v_organization_id;
end;
$$;

create or replace function public.list_my_organizations()
  returns table (
    organization_id uuid,
    organization_name text,
    default_jurisdiction text,
    role public.organization_member_role
  )
  language sql stable security definer set search_path = public as $$
  select o.id, o.name, o.default_jurisdiction, m.role
  from public.organization_memberships m
  join public.organizations o on o.id = m.organization_id
  where m.auth_user_id = auth.uid()
    and m.status = 'active'
    and public.is_approved_professional()
  order by o.name
$$;

create or replace function public.create_organization_member_invite(
  p_organization_id uuid,
  p_code text,
  p_role public.organization_member_role,
  p_expires_at timestamptz
)
  returns uuid
  language plpgsql security definer set search_path = public, extensions as $$
declare
  v_membership_id uuid;
  v_invite_id uuid;
begin
  if not public.is_approved_professional()
    or not public.is_organization_admin(p_organization_id) then
    raise exception 'not authorized';
  end if;
  if p_role = 'owner' then
    raise exception 'owner invitations are not allowed';
  end if;
  if p_code !~ '^[A-HJ-NP-Z2-9]{8,32}$' then
    raise exception 'invalid invite code';
  end if;
  if p_expires_at <= now() or p_expires_at > now() + interval '14 days' then
    raise exception 'invite expiry must be within 14 days';
  end if;

  select id into v_membership_id
  from public.organization_memberships
  where organization_id = p_organization_id
    and auth_user_id = auth.uid()
    and status = 'active';

  insert into public.organization_member_invites (
    organization_id, invited_by_membership_id, code_hash, role, expires_at
  ) values (
    p_organization_id, v_membership_id, crypt(p_code, gen_salt('bf')), p_role, p_expires_at
  )
  returning id into v_invite_id;

  return v_invite_id;
end;
$$;

create or replace function public.redeem_organization_member_invite(
  p_code text,
  p_display_name text
)
  returns uuid
  language plpgsql security definer set search_path = public, extensions as $$
declare
  v_invite_id uuid;
  v_organization_id uuid;
  v_role public.organization_member_role;
  v_membership_id uuid;
begin
  if not public.is_approved_professional() then
    raise exception 'professional approval required';
  end if;

  select id, organization_id, role
    into v_invite_id, v_organization_id, v_role
  from public.organization_member_invites
  where code_hash = crypt(p_code, code_hash)
    and redeemed_by_membership_id is null
    and expires_at > now()
  limit 1
  for update;

  if v_invite_id is null then
    raise exception 'invalid or expired code';
  end if;

  insert into public.organization_memberships (
    organization_id, auth_user_id, display_name, role
  ) values (
    v_organization_id, auth.uid(), nullif(trim(p_display_name), ''), v_role
  )
  returning id into v_membership_id;

  update public.organization_member_invites
    set redeemed_by_membership_id = v_membership_id, redeemed_at = now()
  where id = v_invite_id;

  return v_membership_id;
end;
$$;

create or replace function public.create_knowledge_source(
  p_organization_id uuid,
  p_title text,
  p_publisher text,
  p_source_url text,
  p_source_type public.knowledge_source_type,
  p_jurisdiction text default null,
  p_publication_date date default null,
  p_source_notes text default null
)
  returns uuid
  language plpgsql security definer set search_path = public as $$
declare
  v_membership_id uuid;
  v_source_id uuid;
begin
  if not public.can_manage_organization_knowledge(p_organization_id) then
    raise exception 'not authorized';
  end if;

  v_membership_id := public.current_organization_membership_id(p_organization_id);
  if v_membership_id is null then
    raise exception 'not authorized';
  end if;

  insert into public.knowledge_sources (
    organization_id, created_by_membership_id, title, publisher, source_url,
    source_type, jurisdiction, publication_date, source_notes
  ) values (
    p_organization_id, v_membership_id, p_title, nullif(trim(p_publisher), ''),
    p_source_url, p_source_type, nullif(trim(p_jurisdiction), ''),
    p_publication_date, nullif(trim(p_source_notes), '')
  )
  returning id into v_source_id;

  return v_source_id;
end;
$$;

create or replace function public.create_knowledge_item(
  p_organization_id uuid,
  p_primary_source_id uuid,
  p_title text,
  p_body text,
  p_risk_class public.knowledge_risk_class,
  p_jurisdiction text default null,
  p_language text default 'en'
)
  returns uuid
  language plpgsql security definer set search_path = public as $$
declare
  v_membership_id uuid;
  v_item_id uuid;
begin
  if not public.can_manage_organization_knowledge(p_organization_id) then
    raise exception 'not authorized';
  end if;
  if not exists (
    select 1
    from public.knowledge_sources s
    where s.id = p_primary_source_id
      and s.organization_id = p_organization_id
  ) then
    raise exception 'source does not belong to this organization';
  end if;

  v_membership_id := public.current_organization_membership_id(p_organization_id);
  if v_membership_id is null then
    raise exception 'not authorized';
  end if;

  insert into public.knowledge_items (
    organization_id, primary_source_id, created_by_membership_id, title, body,
    risk_class, jurisdiction, language
  ) values (
    p_organization_id, p_primary_source_id, v_membership_id, p_title, p_body,
    p_risk_class, nullif(trim(p_jurisdiction), ''), coalesce(nullif(trim(p_language), ''), 'en')
  )
  returning id into v_item_id;

  return v_item_id;
end;
$$;

create or replace function public.revise_knowledge_item(
  p_knowledge_item_id uuid,
  p_primary_source_id uuid,
  p_title text,
  p_body text,
  p_risk_class public.knowledge_risk_class,
  p_jurisdiction text default null,
  p_language text default 'en'
)
  returns void
  language plpgsql security definer set search_path = public as $$
declare
  v_organization_id uuid;
  v_status public.knowledge_item_status;
begin
  select organization_id, status into v_organization_id, v_status
  from public.knowledge_items
  where id = p_knowledge_item_id
  for update;

  if v_organization_id is null
    or not public.can_manage_organization_knowledge(v_organization_id) then
    raise exception 'not authorized';
  end if;
  if v_status not in ('draft', 'in_review') then
    raise exception 'published content must be retired and replaced';
  end if;
  if not exists (
    select 1
    from public.knowledge_sources s
    where s.id = p_primary_source_id
      and s.organization_id = v_organization_id
  ) then
    raise exception 'source does not belong to this organization';
  end if;

  update public.knowledge_items
    set primary_source_id = p_primary_source_id,
        title = p_title,
        body = p_body,
        risk_class = p_risk_class,
        jurisdiction = nullif(trim(p_jurisdiction), ''),
        language = coalesce(nullif(trim(p_language), ''), 'en'),
        status = 'draft',
        revision = revision + 1
  where id = p_knowledge_item_id;
end;
$$;

create or replace function public.request_knowledge_review(p_knowledge_item_id uuid)
  returns void
  language plpgsql security definer set search_path = public as $$
declare
  v_organization_id uuid;
  v_status public.knowledge_item_status;
begin
  select organization_id, status into v_organization_id, v_status
  from public.knowledge_items
  where id = p_knowledge_item_id
  for update;

  if v_organization_id is null
    or not public.can_manage_organization_knowledge(v_organization_id) then
    raise exception 'not authorized';
  end if;
  if v_status <> 'draft' then
    raise exception 'only drafts can be sent for review';
  end if;

  update public.knowledge_items
    set status = 'in_review'
  where id = p_knowledge_item_id;
end;
$$;

create or replace function public.review_knowledge_item(
  p_knowledge_item_id uuid,
  p_review_area public.knowledge_review_area,
  p_decision public.knowledge_review_decision,
  p_notes text default null
)
  returns void
  language plpgsql security definer set search_path = public as $$
declare
  v_organization_id uuid;
  v_status public.knowledge_item_status;
  v_revision integer;
  v_creator_membership_id uuid;
  v_reviewer_membership_id uuid;
begin
  select organization_id, status, revision, created_by_membership_id
    into v_organization_id, v_status, v_revision, v_creator_membership_id
  from public.knowledge_items
  where id = p_knowledge_item_id
  for update;

  if v_organization_id is null or v_status <> 'in_review'
    or not public.can_review_knowledge(v_organization_id, p_review_area) then
    raise exception 'not authorized to review this item';
  end if;

  v_reviewer_membership_id := public.current_organization_membership_id(v_organization_id);
  if v_reviewer_membership_id is null
    or v_reviewer_membership_id = v_creator_membership_id then
    raise exception 'a different reviewer is required';
  end if;

  insert into public.knowledge_item_reviews (
    knowledge_item_id, reviewer_membership_id, review_area, decision, notes, reviewed_revision
  ) values (
    p_knowledge_item_id, v_reviewer_membership_id, p_review_area, p_decision,
    nullif(trim(p_notes), ''), v_revision
  );
end;
$$;

create or replace function public.publish_knowledge_item(p_knowledge_item_id uuid)
  returns void
  language plpgsql security definer set search_path = public as $$
declare
  v_organization_id uuid;
  v_status public.knowledge_item_status;
  v_risk public.knowledge_risk_class;
  v_revision integer;
begin
  select organization_id, status, risk_class, revision
    into v_organization_id, v_status, v_risk, v_revision
  from public.knowledge_items
  where id = p_knowledge_item_id
  for update;

  if v_organization_id is null
    or not public.is_organization_admin(v_organization_id) then
    raise exception 'not authorized';
  end if;
  if v_status <> 'in_review' then
    raise exception 'item must be in review before publishing';
  end if;

  if v_risk in ('legal_sensitive', 'critical')
    and not exists (
      select 1 from public.knowledge_item_reviews r
      where r.knowledge_item_id = p_knowledge_item_id
        and r.reviewed_revision = v_revision
        and r.review_area = 'legal'
        and r.decision = 'approved'
    ) then
    raise exception 'legal review is required';
  end if;
  if v_risk in ('wellbeing_sensitive', 'critical')
    and not exists (
      select 1 from public.knowledge_item_reviews r
      where r.knowledge_item_id = p_knowledge_item_id
        and r.reviewed_revision = v_revision
        and r.review_area = 'wellbeing'
        and r.decision = 'approved'
    ) then
    raise exception 'wellbeing review is required';
  end if;
  if v_risk = 'critical'
    and not exists (
      select 1 from public.knowledge_item_reviews r
      where r.knowledge_item_id = p_knowledge_item_id
        and r.reviewed_revision = v_revision
        and r.review_area = 'lived_experience'
        and r.decision = 'approved'
    ) then
    raise exception 'lived-experience review is required';
  end if;
  if exists (
    select 1 from public.knowledge_item_reviews r
    where r.knowledge_item_id = p_knowledge_item_id
      and r.reviewed_revision = v_revision
      and r.decision in ('changes_requested', 'rejected')
  ) then
    raise exception 'review changes must be resolved before publishing';
  end if;

  update public.knowledge_items
    set status = 'published', published_at = now()
  where id = p_knowledge_item_id;
end;
$$;

create or replace function public.list_organization_knowledge(p_organization_id uuid)
  returns table (
    knowledge_item_id uuid,
    title text,
    body text,
    jurisdiction text,
    language text,
    risk_class public.knowledge_risk_class,
    status public.knowledge_item_status,
    revision integer,
    source_id uuid,
    source_title text,
    source_url text,
    source_type public.knowledge_source_type
  )
  language sql stable security definer set search_path = public as $$
  select
    i.id, i.title, i.body, i.jurisdiction, i.language, i.risk_class,
    i.status, i.revision, s.id, s.title, s.source_url, s.source_type
  from public.knowledge_items i
  join public.knowledge_sources s on s.id = i.primary_source_id
  where i.organization_id = p_organization_id
    and public.can_manage_organization_knowledge(p_organization_id)
  order by
    case i.status
      when 'draft' then 0
      when 'in_review' then 1
      when 'published' then 2
      else 3
    end,
    i.updated_at desc
$$;

create or replace function public.list_organization_knowledge_sources(p_organization_id uuid)
  returns table (
    source_id uuid,
    title text,
    publisher text,
    source_url text,
    source_type public.knowledge_source_type,
    jurisdiction text,
    publication_date date
  )
  language sql stable security definer set search_path = public as $$
  select
    s.id, s.title, s.publisher, s.source_url, s.source_type,
    s.jurisdiction, s.publication_date
  from public.knowledge_sources s
  where s.organization_id = p_organization_id
    and public.can_manage_organization_knowledge(p_organization_id)
  order by s.created_at desc
$$;

create or replace function public.list_my_court_plan_items()
  returns table (
    court_plan_item_id uuid,
    workspace_id uuid,
    category public.court_plan_category,
    title text,
    details text,
    status public.court_plan_item_status,
    due_date date,
    sort_order integer
  )
  language sql stable security definer set search_path = public as $$
  select
    p.id, p.workspace_id, p.category, p.title, p.details, p.status,
    p.due_date, p.sort_order
  from public.court_plan_items p
  join public.client_workspaces w on w.id = p.workspace_id
  where w.survivor_id = public.current_survivor_id()
  order by p.due_date nulls last, p.sort_order, p.created_at
$$;

create or replace function public.get_my_court_plan_workspace()
  returns uuid
  language sql stable security definer set search_path = public as $$
  select w.id
  from public.client_workspaces w
  where w.survivor_id = public.current_survivor_id()
  order by w.created_at
  limit 1
$$;

create or replace function public.create_court_plan_item(
  p_workspace_id uuid,
  p_category public.court_plan_category,
  p_title text,
  p_details text default null,
  p_due_date date default null
)
  returns uuid
  language plpgsql security definer set search_path = public as $$
declare
  v_survivor_id uuid;
  v_item_id uuid;
begin
  select survivor_id into v_survivor_id
  from public.client_workspaces
  where id = p_workspace_id;

  if v_survivor_id is null
    or (
      v_survivor_id is distinct from public.current_survivor_id()
      and not public.has_active_court_plan_access(p_workspace_id, p_category)
    ) then
    raise exception 'not authorized';
  end if;

  insert into public.court_plan_items (
    workspace_id, category, title, details, due_date
  ) values (
    p_workspace_id, p_category, p_title, nullif(trim(p_details), ''), p_due_date
  )
  returning id into v_item_id;

  return v_item_id;
end;
$$;

create or replace function public.update_court_plan_item_status(
  p_court_plan_item_id uuid,
  p_status public.court_plan_item_status
)
  returns void
  language plpgsql security definer set search_path = public as $$
declare
  v_workspace_id uuid;
  v_survivor_id uuid;
  v_category public.court_plan_category;
begin
  select p.workspace_id, w.survivor_id, p.category
    into v_workspace_id, v_survivor_id, v_category
  from public.court_plan_items p
  join public.client_workspaces w on w.id = p.workspace_id
  where p.id = p_court_plan_item_id
  for update;

  if v_workspace_id is null
    or (
      v_survivor_id is distinct from public.current_survivor_id()
      and not public.has_active_court_plan_access(v_workspace_id, v_category)
    ) then
    raise exception 'not authorized';
  end if;

  update public.court_plan_items
    set status = p_status
  where id = p_court_plan_item_id;
end;
$$;

create or replace function public.list_my_client_workspaces()
  returns table (
    workspace_id uuid,
    organization_name text,
    client_name text,
    scopes public.client_access_scope[]
  )
  language sql stable security definer set search_path = public as $$
  select
    w.id,
    o.name,
    coalesce(nullif(s.first_name, ''), 'Client'),
    array_agg(distinct scope_value order by scope_value)
  from public.client_access_grants g
  join public.organization_memberships m on m.id = g.membership_id
  join public.client_workspaces w on w.id = g.workspace_id
  join public.organizations o on o.id = w.organization_id
  join public.survivors s on s.id = w.survivor_id
  cross join unnest(g.scopes) as scope_value
  where m.auth_user_id = auth.uid()
    and m.status = 'active'
    and g.status = 'active'
    and (g.expires_at is null or g.expires_at > now())
    and public.is_approved_professional()
    and scope_value in ('logistics', 'support_plan', 'client_questions')
  group by w.id, o.name, s.first_name
  order by o.name, client_name
$$;

create or replace function public.list_court_plan_items_for_workspace(p_workspace_id uuid)
  returns table (
    court_plan_item_id uuid,
    category public.court_plan_category,
    title text,
    details text,
    status public.court_plan_item_status,
    due_date date,
    sort_order integer
  )
  language sql stable security definer set search_path = public as $$
  select
    p.id, p.category, p.title, p.details, p.status, p.due_date, p.sort_order
  from public.court_plan_items p
  where p.workspace_id = p_workspace_id
    and public.has_active_court_plan_access(p_workspace_id, p.category)
  order by p.due_date nulls last, p.sort_order, p.created_at
$$;

create or replace function public.create_resource_directory_entry(
  p_organization_id uuid,
  p_category public.resource_category,
  p_name text,
  p_source_url text,
  p_phone text default null,
  p_text_contact text default null,
  p_website_url text default null,
  p_hours text default null,
  p_languages text default null,
  p_eligibility text default null,
  p_geographic_scope text default null,
  p_description text default null
)
  returns uuid
  language plpgsql security definer set search_path = public as $$
declare
  v_membership_id uuid;
  v_resource_id uuid;
begin
  if not (
    public.can_manage_organization_knowledge(p_organization_id)
    or public.can_manage_organization_clients(p_organization_id)
  ) then
    raise exception 'not authorized';
  end if;

  v_membership_id := public.current_organization_membership_id(p_organization_id);
  if v_membership_id is null then
    raise exception 'not authorized';
  end if;

  insert into public.resource_directory_entries (
    organization_id, created_by_membership_id, category, name, source_url,
    phone, text_contact, website_url, hours, languages, eligibility,
    geographic_scope, description
  ) values (
    p_organization_id, v_membership_id, p_category, p_name, p_source_url,
    nullif(trim(p_phone), ''), nullif(trim(p_text_contact), ''),
    nullif(trim(p_website_url), ''), nullif(trim(p_hours), ''),
    nullif(trim(p_languages), ''), nullif(trim(p_eligibility), ''),
    nullif(trim(p_geographic_scope), ''), nullif(trim(p_description), '')
  )
  returning id into v_resource_id;

  return v_resource_id;
end;
$$;

create or replace function public.verify_resource_directory_entry(
  p_resource_entry_id uuid,
  p_decision public.resource_verification_decision,
  p_next_review_at timestamptz default null,
  p_notes text default null
)
  returns void
  language plpgsql security definer set search_path = public as $$
declare
  v_organization_id uuid;
  v_creator_membership_id uuid;
  v_reviewer_membership_id uuid;
begin
  select organization_id, created_by_membership_id
    into v_organization_id, v_creator_membership_id
  from public.resource_directory_entries
  where id = p_resource_entry_id
  for update;

  if v_organization_id is null
    or not public.is_organization_admin(v_organization_id) then
    raise exception 'not authorized';
  end if;
  v_reviewer_membership_id := public.current_organization_membership_id(v_organization_id);
  if v_reviewer_membership_id is null
    or v_reviewer_membership_id = v_creator_membership_id then
    raise exception 'a different verifier is required';
  end if;
  if p_decision = 'verified'
    and (
      p_next_review_at is null
      or p_next_review_at <= now()
      or p_next_review_at > now() + interval '365 days'
    ) then
    raise exception 'a future review date within one year is required';
  end if;

  insert into public.resource_verifications (
    resource_entry_id, reviewer_membership_id, decision, next_review_at, notes
  ) values (
    p_resource_entry_id, v_reviewer_membership_id, p_decision,
    p_next_review_at, nullif(trim(p_notes), '')
  );
end;
$$;

create or replace function public.publish_resource_directory_entry(p_resource_entry_id uuid)
  returns void
  language plpgsql security definer set search_path = public as $$
declare
  v_organization_id uuid;
  v_status public.resource_status;
begin
  select organization_id, status into v_organization_id, v_status
  from public.resource_directory_entries
  where id = p_resource_entry_id
  for update;

  if v_organization_id is null
    or not public.is_organization_admin(v_organization_id) then
    raise exception 'not authorized';
  end if;
  if v_status <> 'draft' then
    raise exception 'only drafts can be published';
  end if;
  if not exists (
    select 1
    from public.resource_verifications v
    where v.resource_entry_id = p_resource_entry_id
      and v.decision = 'verified'
      and v.next_review_at > now()
  ) then
    raise exception 'a current verification is required';
  end if;
  if exists (
    select 1
    from public.resource_verifications v
    where v.resource_entry_id = p_resource_entry_id
      and v.decision = 'needs_update'
      and v.verified_at > (
        select max(v2.verified_at)
        from public.resource_verifications v2
        where v2.resource_entry_id = p_resource_entry_id
          and v2.decision = 'verified'
      )
  ) then
    raise exception 'resource needs an updated verification';
  end if;

  update public.resource_directory_entries
    set status = 'published', published_at = now()
  where id = p_resource_entry_id;
end;
$$;

create or replace function public.list_organization_resources(p_organization_id uuid)
  returns table (
    resource_entry_id uuid,
    category public.resource_category,
    name text,
    phone text,
    text_contact text,
    website_url text,
    hours text,
    languages text,
    eligibility text,
    geographic_scope text,
    description text,
    source_url text,
    status public.resource_status
  )
  language sql stable security definer set search_path = public as $$
  select
    r.id, r.category, r.name, r.phone, r.text_contact, r.website_url,
    r.hours, r.languages, r.eligibility, r.geographic_scope, r.description,
    r.source_url, r.status
  from public.resource_directory_entries r
  where r.organization_id = p_organization_id
    and (
      public.can_manage_organization_knowledge(p_organization_id)
      or public.can_manage_organization_clients(p_organization_id)
    )
  order by r.category, r.name
$$;

create or replace function public.list_my_published_resources()
  returns table (
    resource_entry_id uuid,
    category public.resource_category,
    name text,
    phone text,
    text_contact text,
    website_url text,
    hours text,
    languages text,
    eligibility text,
    geographic_scope text,
    description text
  )
  language sql stable security definer set search_path = public as $$
  select distinct on (r.id)
    r.id, r.category, r.name, r.phone, r.text_contact, r.website_url,
    r.hours, r.languages, r.eligibility, r.geographic_scope, r.description
  from public.resource_directory_entries r
  join public.client_workspaces w on w.organization_id = r.organization_id
  where w.survivor_id = public.current_survivor_id()
    and r.status = 'published'
  order by r.id, r.updated_at desc
$$;

-- Retrieval boundary for a future AI or plain-language explainer. It exposes
-- only published, source-linked organization content for a workspace the
-- caller may access. Drafts, review notes, raw source notes, and other
-- organizations' material never cross this boundary.
create or replace function public.list_published_knowledge_for_workspace(
  p_workspace_id uuid,
  p_jurisdiction text default null
)
  returns table (
    knowledge_item_id uuid,
    title text,
    body text,
    jurisdiction text,
    language text,
    source_title text,
    source_url text,
    source_type public.knowledge_source_type
  )
  language plpgsql security definer set search_path = public as $$
declare
  v_survivor_id uuid;
begin
  select survivor_id into v_survivor_id
  from public.client_workspaces
  where id = p_workspace_id;

  if v_survivor_id is null
    or (
      v_survivor_id is distinct from public.current_survivor_id()
      and not public.has_active_client_access(p_workspace_id)
    ) then
    raise exception 'not authorized';
  end if;

  return query
  select
    i.id, i.title, i.body, i.jurisdiction, i.language,
    s.title, s.source_url, s.source_type
  from public.knowledge_items i
  join public.knowledge_sources s on s.id = i.primary_source_id
  join public.client_workspaces w on w.organization_id = i.organization_id
  where w.id = p_workspace_id
    and i.status = 'published'
    and (
      p_jurisdiction is null
      or i.jurisdiction is null
      or lower(i.jurisdiction) = lower(p_jurisdiction)
    )
  order by i.updated_at desc;
end;
$$;

-- Codes are generated by the professional's browser and displayed once. Only
-- a bcrypt hash reaches the database. A future delivery service can send the
-- same code without changing this consent model.
create or replace function public.create_client_invite(
  p_organization_id uuid,
  p_code text,
  p_label text,
  p_scopes public.client_access_scope[],
  p_purpose text,
  p_expires_at timestamptz default null
)
  returns uuid
  language plpgsql security definer set search_path = public, extensions as $$
declare
  v_membership_id uuid;
  v_invite_id uuid;
begin
  if not public.is_approved_professional()
    or not public.can_manage_organization_clients(p_organization_id) then
    raise exception 'not authorized';
  end if;

  if p_code !~ '^[A-HJ-NP-Z2-9]{8,32}$' then
    raise exception 'invalid invite code';
  end if;
  if cardinality(p_scopes) is null or cardinality(p_scopes) = 0 then
    raise exception 'at least one scope is required';
  end if;
  if p_expires_at is null
    or p_expires_at <= now()
    or p_expires_at > now() + interval '30 days' then
    raise exception 'invite expiry must be within 30 days';
  end if;

  select id into v_membership_id
  from public.organization_memberships
  where organization_id = p_organization_id
    and auth_user_id = auth.uid()
    and status = 'active';

  insert into public.client_invites (
    organization_id, requested_by_membership_id, code_hash, label,
    scopes, purpose, expires_at
  ) values (
    p_organization_id, v_membership_id, crypt(p_code, gen_salt('bf')),
    nullif(trim(p_label), ''), p_scopes, p_purpose, p_expires_at
  )
  returning id into v_invite_id;

  return v_invite_id;
end;
$$;

-- This pre-auth check lets the welcome screen reject a bad code before it
-- creates an anonymous identity. It intentionally returns no organization or
-- staff information.
create or replace function public.verify_client_invite(p_code text)
  returns uuid
  language sql stable security definer set search_path = public, extensions as $$
  select id
  from public.client_invites
  where code_hash = crypt(p_code, code_hash)
    and redeemed_by is null
    and (expires_at is null or expires_at > now())
  limit 1
$$;

create or replace function public.redeem_client_invite(p_code text)
  returns uuid
  language plpgsql security definer set search_path = public, extensions as $$
declare
  v_uid        uuid := auth.uid();
  v_survivor   uuid;
  v_invite_id  uuid;
  v_organization_id uuid;
  v_membership_id uuid;
  v_scopes public.client_access_scope[];
  v_purpose text;
  v_workspace uuid;
begin
  if v_uid is null then
    raise exception 'must be authenticated';
  end if;

  select id into v_survivor
  from public.survivors
  where auth_user_id = v_uid;
  if v_survivor is not null then
    return v_survivor;
  end if;

  select id, organization_id, requested_by_membership_id, scopes, purpose
    into v_invite_id, v_organization_id, v_membership_id, v_scopes, v_purpose
  from public.client_invites
  where code_hash = crypt(p_code, code_hash)
    and redeemed_by is null
    and (expires_at is null or expires_at > now())
  limit 1
  for update;

  if v_invite_id is null then
    raise exception 'invalid or expired code';
  end if;

  insert into public.survivors (auth_user_id, gatekeeper_id)
  values (v_uid, null)
  returning id into v_survivor;

  insert into public.client_workspaces (organization_id, survivor_id)
  values (v_organization_id, v_survivor)
  returning id into v_workspace;

  insert into public.client_access_grants (
    workspace_id, membership_id, scopes, purpose, status, origin
  ) values (
    v_workspace, v_membership_id, v_scopes, v_purpose, 'pending', 'organization_request'
  );

  update public.client_invites
    set redeemed_by = v_survivor, redeemed_at = now()
  where id = v_invite_id;

  return v_survivor;
end;
$$;

-- Only the client can turn a pending request on or end an active relationship.
-- Scope, purpose, and recipient are immutable here; changing any of them
-- requires a new request and a new consent decision.
create or replace function public.respond_to_client_access_grant(
  p_grant_id uuid,
  p_decision text
)
  returns void
  language plpgsql security definer set search_path = public as $$
declare
  v_workspace_id uuid;
  v_survivor_id uuid;
  v_status public.client_access_status;
  v_origin text;
  v_legacy_gatekeeper_id uuid;
begin
  if p_decision not in ('accept', 'decline', 'revoke') then
    raise exception 'invalid access decision';
  end if;

  select g.workspace_id, w.survivor_id, g.status, g.origin, o.legacy_gatekeeper_id
    into v_workspace_id, v_survivor_id, v_status, v_origin, v_legacy_gatekeeper_id
  from public.client_access_grants g
  join public.client_workspaces w on w.id = g.workspace_id
  join public.organizations o on o.id = w.organization_id
  where g.id = p_grant_id
  for update;

  if v_workspace_id is null or v_survivor_id is distinct from public.current_survivor_id() then
    raise exception 'not authorized';
  end if;

  if p_decision = 'accept' and v_status = 'pending' then
    update public.client_access_grants
      set status = 'active', responded_at = now()
      where id = p_grant_id;
  elsif p_decision = 'decline' and v_status = 'pending' then
    update public.client_access_grants
      set status = 'declined', responded_at = now()
      where id = p_grant_id;
  elsif p_decision = 'revoke' and v_status = 'active' then
    update public.client_access_grants
      set status = 'revoked', responded_at = now()
      where id = p_grant_id;

    -- Legacy records still use gatekeeper RLS for existing shareable content.
    -- Ending this visible grant closes that read path immediately.
    if v_origin = 'legacy_gatekeeper' and v_legacy_gatekeeper_id is not null then
      update public.survivors
        set legacy_gatekeeper_revoked_at = now()
        where id = v_survivor_id;
    end if;
  else
    raise exception 'this access request cannot be changed';
  end if;
end;
$$;

create or replace function public.capture_client_access_audit() returns trigger
  language plpgsql security definer set search_path = public as $$
declare
  v_action text;
begin
  if tg_op = 'INSERT' then
    v_action := 'requested';
  elsif new.status = 'active' and old.status = 'pending' then
    v_action := 'activated';
  elsif new.status = 'declined' and old.status = 'pending' then
    v_action := 'declined';
  elsif new.status = 'revoked' and old.status = 'active' then
    v_action := 'revoked';
  elsif new.status = 'expired' then
    v_action := 'expired';
  else
    return new;
  end if;

  insert into public.client_access_audit (
    workspace_id, access_grant_id, action, actor_auth_user_id
  ) values (
    new.workspace_id, new.id, v_action, auth.uid()
  );
  return new;
end;
$$;

create trigger client_access_grants_audit
  after insert or update of status on public.client_access_grants
  for each row execute function public.capture_client_access_audit();

-- Map the existing one-gatekeeper model into the new organization and access
-- representation. The old tables remain authoritative for existing content
-- until per-content scoped grants are introduced in a subsequent migration.
insert into public.organizations (name, legacy_gatekeeper_id)
select
  coalesce(nullif(trim(g.org_name), ''), 'A support organization'),
  g.id
from public.gatekeepers g
on conflict (legacy_gatekeeper_id) do nothing;

insert into public.organization_memberships (
  organization_id, auth_user_id, display_name, role
)
select
  o.id,
  g.auth_user_id,
  null,
  case g.role
    when 'attorney' then 'legal_professional'::public.organization_member_role
    when 'advocate' then 'advocate'::public.organization_member_role
    when 'case_manager' then 'case_worker'::public.organization_member_role
    when 'prosecutor' then 'justice_partner'::public.organization_member_role
  end
from public.gatekeepers g
join public.organizations o on o.legacy_gatekeeper_id = g.id
where g.auth_user_id is not null
on conflict (organization_id, auth_user_id) do nothing;

insert into public.client_workspaces (organization_id, survivor_id)
select o.id, s.id
from public.survivors s
join public.organizations o on o.legacy_gatekeeper_id = s.gatekeeper_id
on conflict (organization_id, survivor_id) do nothing;

insert into public.client_access_grants (
  workspace_id, membership_id, scopes, purpose, status, origin, responded_at
)
select
  w.id,
  m.id,
  array[
    'shared_statements'::public.client_access_scope,
    'shared_timeline'::public.client_access_scope,
    'shared_documents'::public.client_access_scope
  ],
  'This person can read only the things you mark “okay to share.”',
  'active',
  'legacy_gatekeeper',
  now()
from public.client_workspaces w
join public.organizations o on o.id = w.organization_id
join public.organization_memberships m on m.organization_id = o.id
where o.legacy_gatekeeper_id is not null
on conflict (workspace_id, membership_id) where status in ('pending', 'active') do nothing;

-- New survivor redeems continue to work and are immediately represented in the
-- new consent model, so the survivor can see and revoke the connection.
create or replace function public.redeem_access_code(p_code text)
  returns uuid
  language plpgsql security definer set search_path = public, extensions as $$
declare
  v_uid        uuid := auth.uid();
  v_survivor   uuid;
  v_code_id    uuid;
  v_gatekeeper uuid;
  v_org        uuid;
  v_workspace  uuid;
  v_membership uuid;
begin
  if v_uid is null then
    raise exception 'must be authenticated';
  end if;

  select id into v_survivor from public.survivors where auth_user_id = v_uid;
  if v_survivor is not null then
    return v_survivor;
  end if;

  select id, gatekeeper_id into v_code_id, v_gatekeeper
    from public.access_codes
   where code_hash = crypt(p_code, code_hash)
     and redeemed_by is null
     and (expires_at is null or expires_at > now())
   order by created_at
   limit 1
   for update;

  if v_code_id is null then
    raise exception 'invalid or expired code';
  end if;

  insert into public.survivors (auth_user_id, gatekeeper_id)
  values (v_uid, v_gatekeeper)
  returning id into v_survivor;

  update public.access_codes
     set redeemed_by = v_survivor, redeemed_at = now()
   where id = v_code_id;

  select id into v_org
  from public.organizations
  where legacy_gatekeeper_id = v_gatekeeper;

  if v_org is not null then
    insert into public.client_workspaces (organization_id, survivor_id)
    values (v_org, v_survivor)
    on conflict (organization_id, survivor_id) do update
      set updated_at = now()
    returning id into v_workspace;

    select m.id into v_membership
    from public.organization_memberships m
    join public.gatekeepers g on g.auth_user_id = m.auth_user_id
    where m.organization_id = v_org
      and g.id = v_gatekeeper
      and m.status = 'active';

    if v_membership is not null then
      insert into public.client_access_grants (
        workspace_id, membership_id, scopes, purpose, status, origin, responded_at
      ) values (
        v_workspace,
        v_membership,
        array[
          'shared_statements'::public.client_access_scope,
          'shared_timeline'::public.client_access_scope,
          'shared_documents'::public.client_access_scope
        ],
        'This person can read only the things you mark “okay to share.”',
        'active',
        'legacy_gatekeeper',
        now()
      )
      on conflict (workspace_id, membership_id) where status in ('pending', 'active') do nothing;
    end if;
  end if;

  return v_survivor;
end;
$$;

grant execute on function public.list_my_client_access_grants() to authenticated;
grant execute on function public.respond_to_client_access_grant(uuid, text) to authenticated;
grant execute on function public.is_approved_professional() to authenticated;
grant execute on function public.can_create_organization() to authenticated;
grant execute on function public.create_organization(text, text, text) to authenticated;
grant execute on function public.list_my_organizations() to authenticated;
grant execute on function public.create_organization_member_invite(uuid, text, public.organization_member_role, timestamptz) to authenticated;
grant execute on function public.redeem_organization_member_invite(text, text) to authenticated;
grant execute on function public.create_knowledge_source(uuid, text, text, text, public.knowledge_source_type, text, date, text) to authenticated;
grant execute on function public.create_knowledge_item(uuid, uuid, text, text, public.knowledge_risk_class, text, text) to authenticated;
grant execute on function public.revise_knowledge_item(uuid, uuid, text, text, public.knowledge_risk_class, text, text) to authenticated;
grant execute on function public.request_knowledge_review(uuid) to authenticated;
grant execute on function public.review_knowledge_item(uuid, public.knowledge_review_area, public.knowledge_review_decision, text) to authenticated;
grant execute on function public.publish_knowledge_item(uuid) to authenticated;
grant execute on function public.list_organization_knowledge(uuid) to authenticated;
grant execute on function public.list_organization_knowledge_sources(uuid) to authenticated;
grant execute on function public.list_my_court_plan_items() to authenticated;
grant execute on function public.get_my_court_plan_workspace() to authenticated;
grant execute on function public.create_court_plan_item(uuid, public.court_plan_category, text, text, date) to authenticated;
grant execute on function public.update_court_plan_item_status(uuid, public.court_plan_item_status) to authenticated;
grant execute on function public.list_my_client_workspaces() to authenticated;
grant execute on function public.list_court_plan_items_for_workspace(uuid) to authenticated;
grant execute on function public.create_resource_directory_entry(uuid, public.resource_category, text, text, text, text, text, text, text, text, text, text) to authenticated;
grant execute on function public.verify_resource_directory_entry(uuid, public.resource_verification_decision, timestamptz, text) to authenticated;
grant execute on function public.publish_resource_directory_entry(uuid) to authenticated;
grant execute on function public.list_organization_resources(uuid) to authenticated;
grant execute on function public.list_my_published_resources() to authenticated;
grant execute on function public.list_published_knowledge_for_workspace(uuid, text) to authenticated;
grant execute on function public.create_client_invite(uuid, text, text, public.client_access_scope[], text, timestamptz) to authenticated;
grant execute on function public.redeem_client_invite(text) to authenticated;
grant execute on function public.redeem_access_code(text) to authenticated;
grant execute on function public.verify_client_invite(text) to anon, authenticated;
