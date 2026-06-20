-- Statements: captured narrative fragments. The survivor controls visibility per fragment.

create table public.statements (
  id          uuid primary key default gen_random_uuid(),
  survivor_id uuid not null references public.survivors (id) on delete cascade,
  session_id  uuid,
  raw_text    text not null,
  language    text,
  visibility  public.content_visibility not null default 'private',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.statements enable row level security;
create index statements_survivor_idx on public.statements (survivor_id);

create trigger statements_updated_at
  before update on public.statements
  for each row execute function public.set_updated_at();

-- Survivor: full control of their own statements.
create policy statements_survivor_all on public.statements
  for all
  using (survivor_id = public.current_survivor_id())
  with check (survivor_id = public.current_survivor_id());

-- Gatekeeper: read ONLY shareable statements, and only for survivors they granted.
create policy statements_gatekeeper_read on public.statements
  for select
  using (visibility = 'shareable' and public.is_gatekeeper_for(survivor_id));
