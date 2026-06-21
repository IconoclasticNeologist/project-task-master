-- voice_session_counters: aggregate-only daily count for the voice cost cap.
-- Written/read exclusively by the advocate-voice-token edge function via
-- service role. No user data, no per-user rows.

create table if not exists public.voice_session_counters (
  day date primary key,
  session_count integer not null default 0,
  updated_at timestamptz not null default now()
);

grant all on public.voice_session_counters to service_role;

alter table public.voice_session_counters enable row level security;
-- No policies: anon/authenticated have no access. Service role bypasses RLS.

create or replace function public.increment_voice_session_count(_cap integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  _new_count integer;
begin
  insert into public.voice_session_counters as v (day, session_count)
  values (current_date, 1)
  on conflict (day) do update
    set session_count = v.session_count + 1,
        updated_at = now()
  returning session_count into _new_count;

  if _new_count > _cap then
    raise exception 'voice_daily_cap_exceeded' using errcode = 'P0001';
  end if;

  return _new_count;
end;
$$;

revoke all on function public.increment_voice_session_count(integer) from public;
grant execute on function public.increment_voice_session_count(integer) to service_role;
