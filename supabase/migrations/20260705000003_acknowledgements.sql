-- Public acknowledgements (subject-matter experts) for the judge-facing
-- sources page. Images are stored as data URIs in-row (a handful of small
-- profile images) — no storage bucket needed. Public read; dev writes go
-- through advocate-admin (service role).

create table public.acknowledgements (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(trim(name)) between 1 and 160),
  role       text,
  bio        text,
  image      text,               -- data URI (image/*;base64), optional
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.acknowledgements enable row level security;
grant select on public.acknowledgements to anon, authenticated;
grant all on public.acknowledgements to service_role;

-- Public, non-sensitive: anyone may read (the judge-facing page uses the anon key).
create policy acknowledgements_public_read on public.acknowledgements
  for select using (true);
