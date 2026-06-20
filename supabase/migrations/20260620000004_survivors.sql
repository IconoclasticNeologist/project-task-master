-- Survivors: the gated user record. MINIMAL PII BY DESIGN — optional first name only.
-- NO legal names, NO addresses, NO government IDs.

create table public.survivors (
  id                        uuid primary key default gen_random_uuid(),
  auth_user_id              uuid unique references auth.users (id) on delete set null,
  gatekeeper_id             uuid not null references public.gatekeepers (id) on delete restrict,
  first_name                text,                 -- max PII allowed; nullable
  preferred_language        text,
  session_length_pref       text,
  support_contact_name      text,
  -- ENCRYPTED AT REST (pgcrypto pgp_sym_*, key from Vault). bytea so a future
  -- client-side-encryption envelope can store opaque ciphertext here with NO schema
  -- change — the server-side->E2E migration path. Written/read only via the RPCs in
  -- migration 06; the boundary where "first-name-max reaches any model" lives there.
  support_contact_phone_enc bytea,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

alter table public.survivors enable row level security;
create index survivors_gatekeeper_idx on public.survivors (gatekeeper_id);

create trigger survivors_updated_at
  before update on public.survivors
  for each row execute function public.set_updated_at();

-- Survivor: full control of their own row (identified by auth.uid()).
create policy survivors_self on public.survivors
  for all
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

-- Gatekeeper: read only the survivors they granted access to.
create policy survivors_gatekeeper_read on public.survivors
  for select
  using (gatekeeper_id = (select id from public.gatekeepers where auth_user_id = auth.uid()));
