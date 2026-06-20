-- Enum types, the shared updated_at trigger, and the Vault key reader.
-- None of these reference application tables, so they are safe to create first.

-- ── Enums ─────────────────────────────────────────────────────────────────────
create type public.gatekeeper_role  as enum ('advocate', 'attorney', 'prosecutor', 'case_manager');
create type public.content_visibility as enum ('shareable', 'private');
create type public.document_type     as enum ('identification', 'legal', 'medical', 'correspondence', 'evidence', 'other');
create type public.flag_type         as enum ('gap', 'inconsistency', 'trauma', 'other');
create type public.flag_status       as enum ('open', 'reviewed', 'resolved', 'dismissed');
create type public.embedding_source  as enum ('statement', 'document');
create type public.revision_entity   as enum ('statement', 'timeline_event');

-- ── updated_at trigger function ───────────────────────────────────────────────
create or replace function public.set_updated_at() returns trigger
  language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── Vault key reader ──────────────────────────────────────────────────────────
-- Pulls a symmetric encryption key from Supabase Vault by name. The key is NEVER
-- hardcoded or committed. plpgsql so creation does not require Vault to be set up yet;
-- it resolves at call time. Create the secret once with:
--   select vault.create_secret('<random base64 key>', 'support_contact_key');
create or replace function public.app_secret(p_name text) returns text
  language plpgsql stable security definer set search_path = '' as $$
declare v text;
begin
  select decrypted_secret into v from vault.decrypted_secrets where name = p_name;
  return v;
end;
$$;
-- Only privileged definer functions should read secrets — never the client roles.
revoke all on function public.app_secret(text) from anon, authenticated;
