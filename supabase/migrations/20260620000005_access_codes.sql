-- Access codes: per-invite, expiring codes a gatekeeper mints to grant survivor access.
-- The code is stored ONLY as a bcrypt hash (never plaintext). Mint/verify RPCs are in
-- migration 06 (after the identity helpers exist).

create table public.access_codes (
  id            uuid primary key default gen_random_uuid(),
  gatekeeper_id uuid not null references public.gatekeepers (id) on delete cascade,
  code_hash     text not null,                                   -- bcrypt; never plaintext
  label         text,                                            -- e.g. "intake 2026-06"
  expires_at    timestamptz,
  redeemed_by   uuid references public.survivors (id) on delete set null,
  redeemed_at   timestamptz,
  created_at    timestamptz not null default now()
);

alter table public.access_codes enable row level security;
create index access_codes_gatekeeper_idx on public.access_codes (gatekeeper_id);

-- A gatekeeper manages only their own codes. The hash is never exposed to survivors
-- (no survivor-facing policy); redemption goes through verify_access_code() (migration 06).
create policy access_codes_owner on public.access_codes
  for all
  using (gatekeeper_id = (select id from public.gatekeepers where auth_user_id = auth.uid()))
  with check (gatekeeper_id = (select id from public.gatekeepers where auth_user_id = auth.uid()));
