-- Embeddings/RAG: a single pgvector table fed by the domain tables. Holds NO name/contact
-- columns — only survivor_id (uuid), the survivor's own chunk text, language, metadata.
-- This is the "no PII to model context" boundary: the future context-assembler sends
-- chunk_text + at most first_name, never the survivors PII columns.

create table public.embeddings (
  id          uuid primary key default gen_random_uuid(),
  survivor_id uuid not null references public.survivors (id) on delete cascade,
  source_type public.embedding_source not null,        -- 'statement' | 'document'
  source_id   uuid not null,
  chunk_text  text not null,
  language    text,
  -- ⚠️ EMBEDDING DIMENSION: 1536 is a PLACEHOLDER (OpenAI text-embedding-3-small).
  -- The final model MUST be confirmed for MULTILINGUAL quality (English + Spanish now,
  -- more languages later) BEFORE any real data exists. Changing the dimension after
  -- embeddings are populated means re-embedding everything. Free to change now.
  embedding   extensions.vector(1536),
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

alter table public.embeddings enable row level security;

-- HNSW (cosine): incremental inserts (survivors add statements over time), no training
-- step, better recall/latency on small/growing tables than ivfflat. Cosine fits
-- normalized text embeddings.
create index embeddings_hnsw_idx on public.embeddings
  using hnsw (embedding extensions.vector_cosine_ops)
  with (m = 16, ef_construction = 64);

create index embeddings_survivor_idx on public.embeddings (survivor_id);

-- Survivor-scoped. The server-side RAG pipeline uses the service role (bypasses RLS);
-- gatekeepers never query vectors directly.
create policy embeddings_survivor_all on public.embeddings
  for all
  using (survivor_id = public.current_survivor_id())
  with check (survivor_id = public.current_survivor_id());
