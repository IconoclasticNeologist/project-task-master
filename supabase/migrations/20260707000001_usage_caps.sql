-- usage_counters: per-day, per-scope daily caps for the model-calling edge functions.
--
-- Motivation: advocate-agent and advocate-rag had NO cost cap, and the voice cap was
-- global-only (day as sole key) — so any anonymous session could either run up unbounded
-- Gemini/Anthropic spend or exhaust the single daily voice budget for every survivor.
-- This adds a per-SUBJECT (auth uid) daily counter AND a global daily counter per scope.
-- The per-user cap stops a single session running away; the global cap is the backstop
-- against an attacker looping anonymous sign-ins to mint fresh uids.
--
-- Written/read exclusively by the edge functions via service role. No survivor content,
-- no cross-linkable identity beyond the auth uid the caller already holds.

create table if not exists public.usage_counters (
  day date not null,
  scope text not null, -- 'agent' | 'rag' | 'voice' | 'avatar'
  subject text not null, -- caller auth uid, or '*' for the global bucket
  count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (day, scope, subject)
);

grant all on public.usage_counters to service_role;

alter table public.usage_counters enable row level security;
-- No policies: anon/authenticated have no access. Service role bypasses RLS.

-- bump_usage: atomically increment the per-user and/or global counter for (day, scope)
-- and raise if either exceeds its cap. A cap <= 0 disables that dimension (e.g. voice
-- keeps its existing global counter and uses this only for the per-user guard).
--
-- Like increment_voice_session_count, the raise rolls the increment back, so an
-- over-cap call never permanently inflates the counter — it just stays pinned at the
-- cap and every further call is rejected until the day rolls over.
create or replace function public.bump_usage(
  _scope text,
  _subject text,
  _per_user_cap integer,
  _global_cap integer
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _user_count integer;
  _global_count integer;
begin
  if _subject is null or _subject = '' then
    _subject := 'anon';
  end if;

  if _per_user_cap > 0 then
    insert into public.usage_counters as u (day, scope, subject, count)
    values (current_date, _scope, _subject, 1)
    on conflict (day, scope, subject) do update
      set count = u.count + 1, updated_at = now()
    returning count into _user_count;
    if _user_count > _per_user_cap then
      raise exception 'usage_per_user_cap_exceeded' using errcode = 'P0001';
    end if;
  end if;

  if _global_cap > 0 then
    insert into public.usage_counters as u (day, scope, subject, count)
    values (current_date, _scope, '*', 1)
    on conflict (day, scope, subject) do update
      set count = u.count + 1, updated_at = now()
    returning count into _global_count;
    if _global_count > _global_cap then
      raise exception 'usage_global_cap_exceeded' using errcode = 'P0001';
    end if;
  end if;
end;
$$;

revoke all on function public.bump_usage(text, text, integer, integer) from public;
grant execute on function public.bump_usage(text, text, integer, integer) to service_role;
