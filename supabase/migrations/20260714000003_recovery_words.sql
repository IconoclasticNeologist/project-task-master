-- Recovery words: an opt-in, identity-free way back into an anonymous space
-- (spec: docs/superpowers/specs/2026-07-14-recovery-words-design.md).
--
-- The client never sends the phrase itself — only its SHA-256 hex. The server
-- stores a bcrypt of that hex, so neither a DB read nor a backup reveals a
-- usable phrase. Recovery re-points survivors.auth_user_id to the caller's
-- anonymous uid; every content table hangs off survivors.id, so the whole
-- space moves atomically and the old device's key stops opening it.

alter table public.survivors
  add column if not exists recovery_hash text,
  add column if not exists recovery_set_at timestamptz;

-- Attempt log for rate limiting. RLS on with no policies: clients can never
-- read or write it; only the DEFINER functions below touch it.
create table if not exists public.recovery_attempts (
  id bigint generated always as identity primary key,
  auth_user_id uuid not null,
  attempted_at timestamptz not null default now()
);
alter table public.recovery_attempts enable row level security;
create index if not exists recovery_attempts_uid_time
  on public.recovery_attempts (auth_user_id, attempted_at desc);

-- Set (or clear, with null) the caller's recovery words. Returns the new
-- recovery_set_at (null after clearing).
create or replace function public.app_set_recovery_words(p_hash text)
  returns timestamptz
  language plpgsql security definer set search_path = public, extensions as $$
declare
  v_uid uuid := auth.uid();
  v_set timestamptz;
begin
  if v_uid is null then
    raise exception 'must be authenticated';
  end if;

  if p_hash is null then
    update public.survivors
       set recovery_hash = null, recovery_set_at = null
     where auth_user_id = v_uid;
    return null;
  end if;

  update public.survivors
     set recovery_hash = crypt(p_hash, gen_salt('bf')),
         recovery_set_at = now()
   where auth_user_id = v_uid
  returning recovery_set_at into v_set;

  if v_set is null then
    raise exception 'no space for this user';
  end if;
  return v_set;
end;
$$;

-- When the caller set recovery words, says when; null otherwise.
create or replace function public.app_recovery_status()
  returns timestamptz
  language sql security definer set search_path = public as $$
  select recovery_set_at from public.survivors where auth_user_id = auth.uid();
$$;

-- Reconnect the space matching these recovery words to the caller's uid.
-- Returns true on success, false when nothing matches. Raises 'rate_limited'
-- after 5 tries in an hour, and 'space_exists_here' if this uid already owns
-- a space (recovery is for fresh devices, never on top of an existing space).
create or replace function public.app_recover_space(p_hash text)
  returns boolean
  language plpgsql security definer set search_path = public, extensions as $$
declare
  v_uid uuid := auth.uid();
  v_target uuid;
begin
  if v_uid is null then
    raise exception 'must be authenticated';
  end if;
  if p_hash is null or length(p_hash) < 32 then
    return false;
  end if;

  if exists (select 1 from public.survivors where auth_user_id = v_uid) then
    raise exception 'space_exists_here';
  end if;

  if (
    select count(*) from public.recovery_attempts
     where auth_user_id = v_uid and attempted_at > now() - interval '1 hour'
  ) >= 5 then
    raise exception 'rate_limited';
  end if;
  insert into public.recovery_attempts (auth_user_id) values (v_uid);

  select id into v_target
    from public.survivors
   where recovery_hash is not null
     and recovery_hash = crypt(p_hash, recovery_hash)
   limit 1;

  if v_target is null then
    return false;
  end if;

  update public.survivors set auth_user_id = v_uid where id = v_target;
  return true;
end;
$$;

grant execute on function public.app_set_recovery_words(text) to authenticated;
grant execute on function public.app_recovery_status() to authenticated;
grant execute on function public.app_recover_space(text) to authenticated;
