-- Developer-editable agent prompts + project knowledge that feeds the AI brains.
--
-- agent_prompts        — dev overrides for any prompt key (git default when absent)
-- agent_prompt_revisions — full history of every saved prompt (restore/audit)
-- project_knowledge    — expert-curated knowledge stuffed into agent context;
--                        global (not per-survivor), published items only reach agents
--
-- All three are service-role only (edge functions mediate every read/write).
-- Prompts: dev-owned. Knowledge: expert-owned via the professional workspace,
-- but the AGENT-facing read path is a published-only projection through the
-- edge functions, never a direct table read.

create table public.agent_prompts (
  key        text primary key,
  content    text not null check (char_length(content) between 1 and 20000),
  updated_at timestamptz not null default now(),
  updated_by text
);
alter table public.agent_prompts enable row level security;
grant select, insert, update, delete on public.agent_prompts to service_role;

create table public.agent_prompt_revisions (
  id         uuid primary key default gen_random_uuid(),
  key        text not null,
  content    text not null,
  source     text not null default 'manual' check (source in ('manual', 'ai', 'restore', 'seed')),
  updated_by text,
  created_at timestamptz not null default now()
);
alter table public.agent_prompt_revisions enable row level security;
grant select, insert on public.agent_prompt_revisions to service_role;
create index agent_prompt_revisions_key_idx on public.agent_prompt_revisions (key, created_at desc);

create type public.project_knowledge_status as enum ('draft', 'published', 'retired');

create table public.project_knowledge (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(trim(title)) between 1 and 200),
  body        text not null check (char_length(trim(body)) between 1 and 8000),
  -- Which agents this knowledge is offered to. Empty array = all agents.
  agent_keys  text[] not null default '{}',
  status      public.project_knowledge_status not null default 'draft',
  created_by  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.project_knowledge enable row level security;
grant select, insert, update, delete on public.project_knowledge to service_role;
create index project_knowledge_status_idx on public.project_knowledge (status);
