-- Flags: gap / inconsistency / trauma flags for the legal partner. Own table (not scattered
-- booleans). Polymorphic reference to the entity a flag pertains to.

create table public.flags (
  id                  uuid primary key default gen_random_uuid(),
  survivor_id         uuid not null references public.survivors (id) on delete cascade,
  flag_type           public.flag_type not null,
  related_entity_type text,        -- 'statement' | 'document' | 'timeline_event' | null
  related_entity_id   uuid,
  note                text,
  status              public.flag_status not null default 'open',
  created_at          timestamptz not null default now()
);

alter table public.flags enable row level security;
create index flags_survivor_idx on public.flags (survivor_id);

-- Flags are produced for/by the legal partner (and, later, AI via the service role).
-- Survivor can SEE flags on their own account; gatekeeper has full control for granted survivors.
create policy flags_survivor_read on public.flags
  for select
  using (survivor_id = public.current_survivor_id());

create policy flags_gatekeeper_all on public.flags
  for all
  using (public.is_gatekeeper_for(survivor_id))
  with check (public.is_gatekeeper_for(survivor_id));
