-- The in-app guide chat ("helper") joins the agent stats so the /dev Monitor
-- shows its opens, clean closes, tripwire intercepts, and errors alongside the
-- voice agents. Aggregate counts only — never content, never identity.

-- Widen the agent allowlist on the stats table. The original check was
-- unnamed, so drop it by its generated name if present, then re-add.
do $$
declare
  conname text;
begin
  select c.conname into conname
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  where t.relname = 'agent_daily_stats'
    and c.contype = 'c'
    and pg_get_constraintdef(c.oid) like '%agent%in%'
    and pg_get_constraintdef(c.oid) not like '%medium%';
  if conname is not null then
    execute format('alter table public.agent_daily_stats drop constraint %I', conname);
  end if;
end $$;

alter table public.agent_daily_stats
  add constraint agent_daily_stats_agent_check
  check (agent in ('base', 'regulator', 'interview', 'defense', 'helper'));

-- Same widening inside the security-definer RPC (it re-validates on write).
create or replace function public.increment_agent_stat(_agent text, _medium text, _field text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if _field not in ('started', 'ended_clean', 'tripwire_stops', 'errors') then
    raise exception 'unknown stat field';
  end if;
  if _agent not in ('base', 'regulator', 'interview', 'defense', 'helper') then
    raise exception 'unknown agent';
  end if;
  if _medium not in ('voice', 'avatar', 'text') then
    raise exception 'unknown medium';
  end if;

  insert into public.agent_daily_stats (day, agent, medium)
  values (current_date, _agent, _medium)
  on conflict (day, agent, medium) do nothing;

  execute format(
    'update public.agent_daily_stats set %I = %I + 1, updated_at = now()
      where day = current_date and agent = $1 and medium = $2',
    _field, _field
  ) using _agent, _medium;
end;
$$;

revoke all on function public.increment_agent_stat(text, text, text) from public;
grant execute on function public.increment_agent_stat(text, text, text) to service_role;
