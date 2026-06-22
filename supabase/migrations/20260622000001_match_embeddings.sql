-- Survivor-scoped semantic search over the survivor's own embeddings (RAG retrieval).
-- SECURITY DEFINER + current_survivor_id() bind: a caller only ever sees THEIR vectors.
-- Returns ONLY safe columns (no name/contact) — the no-PII-to-model boundary.

create or replace function public.match_embeddings(
  query_embedding extensions.vector(1536),
  match_count int
)
returns table (
  source_type public.embedding_source,
  source_id   uuid,
  chunk_text  text,
  language    text,
  score       double precision
)
language sql stable security definer set search_path = public, extensions as $$
  select e.source_type, e.source_id, e.chunk_text, e.language,
         1 - (e.embedding <=> query_embedding) as score
  from public.embeddings e
  where e.survivor_id = public.current_survivor_id()
    and e.embedding is not null
  order by e.embedding <=> query_embedding
  limit greatest(1, least(coalesce(match_count, 6), 20));
$$;

grant execute on function public.match_embeddings(extensions.vector, int) to authenticated;

-- One embedding row per source (N2: no chunking). Enables the edge function's
-- upsert(onConflict: 'source_id'). A future chunking pass would drop this and key
-- on (source_id, chunk_index) instead.
create unique index if not exists embeddings_source_id_key on public.embeddings (source_id);
