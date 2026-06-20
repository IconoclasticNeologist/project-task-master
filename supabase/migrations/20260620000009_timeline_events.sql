-- Timeline events: survivor-editable. Absolute date is OPTIONAL; relative ordering fields
-- let events sequence against each other when exact dates are unknown.

create table public.timeline_events (
  id                  uuid primary key default gen_random_uuid(),
  survivor_id         uuid not null references public.survivors (id) on delete cascade,
  title               text not null,
  description         text,
  event_date          date,                                            -- nullable: may be unknown
  order_index         integer not null default 0,                      -- relative ordering
  before_event_id     uuid references public.timeline_events (id) on delete set null,
  after_event_id      uuid references public.timeline_events (id) on delete set null,
  source_statement_id uuid references public.statements (id) on delete set null,   -- provenance
  source_document_id  uuid references public.documents (id) on delete set null,    -- provenance
  visibility          public.content_visibility not null default 'private',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.timeline_events enable row level security;
create index timeline_survivor_idx on public.timeline_events (survivor_id, order_index);

create trigger timeline_updated_at
  before update on public.timeline_events
  for each row execute function public.set_updated_at();

create policy timeline_survivor_all on public.timeline_events
  for all
  using (survivor_id = public.current_survivor_id())
  with check (survivor_id = public.current_survivor_id());

create policy timeline_gatekeeper_read on public.timeline_events
  for select
  using (visibility = 'shareable' and public.is_gatekeeper_for(survivor_id));
