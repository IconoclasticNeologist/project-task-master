-- Gatekeepers: advocates/attorneys who hold access codes and grant survivor access.
-- Access codes live in their own table (migration 05), per the per-invite model.

create table public.gatekeepers (
  id           uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users (id) on delete set null,
  role         public.gatekeeper_role not null,
  org_name     text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.gatekeepers enable row level security;

create trigger gatekeepers_updated_at
  before update on public.gatekeepers
  for each row execute function public.set_updated_at();

-- A gatekeeper sees and edits only their own record.
create policy gatekeeper_self on public.gatekeepers
  for all
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());
