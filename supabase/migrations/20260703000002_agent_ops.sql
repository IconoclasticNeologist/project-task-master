-- Agent operations layer: dashboard-editable OPERATIONAL config + aggregate
-- daily stats for the voice/practice agents.
--
-- Safety shape:
--   - agent_config holds operational knobs ONLY (voices, caps, model chain,
--     avatar choice). Prompt/guardrail CONTENT stays in git (SME-gated).
--   - agent_daily_stats is aggregate-only: counts per (day, agent, medium).
--     No survivor ids, no session ids, no content. This is the monitoring
--     the product can afford without becoming surveillance.
--   - Both tables are service-role only (RLS on, no policies).

create table public.agent_config (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.agent_config enable row level security;
grant select, insert, update, delete on public.agent_config to service_role;

create table public.agent_daily_stats (
  day            date not null default current_date,
  agent          text not null,
  medium         text not null,
  started        integer not null default 0,
  ended_clean    integer not null default 0,
  tripwire_stops integer not null default 0,
  errors         integer not null default 0,
  updated_at     timestamptz not null default now(),
  primary key (day, agent, medium),
  check (agent in ('base', 'regulator', 'interview', 'defense')),
  check (medium in ('voice', 'avatar', 'text'))
);

alter table public.agent_daily_stats enable row level security;
grant select, insert, update on public.agent_daily_stats to service_role;

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
  if _agent not in ('base', 'regulator', 'interview', 'defense') then
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
