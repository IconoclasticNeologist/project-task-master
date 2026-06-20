-- Versioning/provenance: a single generic history table. BEFORE UPDATE triggers snapshot
-- the prior row to jsonb. Embeddings are (re)built from CURRENT rows only, so redacted text
-- leaves the AI substrate while history is preserved here.

create table public.content_revisions (
  id          uuid primary key default gen_random_uuid(),
  entity_type public.revision_entity not null,
  entity_id   uuid not null,
  survivor_id uuid not null references public.survivors (id) on delete cascade,
  snapshot    jsonb not null,
  edited_at   timestamptz not null default now()
);

alter table public.content_revisions enable row level security;
create index revisions_entity_idx on public.content_revisions (entity_type, entity_id);

-- SECURITY DEFINER so the system-controlled provenance insert succeeds even though
-- content_revisions has no INSERT policy (writes happen only via these triggers).
create or replace function public.capture_statement_revision() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  insert into public.content_revisions (entity_type, entity_id, survivor_id, snapshot)
  values ('statement', old.id, old.survivor_id, to_jsonb(old));
  return new;
end;
$$;

create trigger statements_capture_revision
  before update on public.statements
  for each row when (old.raw_text is distinct from new.raw_text)
  execute function public.capture_statement_revision();

create or replace function public.capture_timeline_revision() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  insert into public.content_revisions (entity_type, entity_id, survivor_id, snapshot)
  values ('timeline_event', old.id, old.survivor_id, to_jsonb(old));
  return new;
end;
$$;

create trigger timeline_capture_revision
  before update on public.timeline_events
  for each row when (
    old.title is distinct from new.title
    or old.description is distinct from new.description
    or old.event_date is distinct from new.event_date
  )
  execute function public.capture_timeline_revision();

-- Conservative default: survivor reads their OWN history only. The legal-partner
-- "see what changed" view is a deliberate later export feature (service role), not a
-- broad gatekeeper read — avoids over-exposing content that was never shared.
create policy revisions_survivor_read on public.content_revisions
  for select
  using (survivor_id = public.current_survivor_id());
