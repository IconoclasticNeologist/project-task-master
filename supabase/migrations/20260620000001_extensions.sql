-- Foundation: required Postgres extensions, isolated in the `extensions` schema
-- (Supabase convention — keeps `public` clean). On a fresh project these are not
-- pre-installed; we choose the schema here so later `extensions.*` references resolve.

create schema if not exists extensions;

-- pgvector: semantic retrieval for the RAG layer (embeddings table, migration 12).
create extension if not exists vector with schema extensions;

-- pgcrypto: column encryption at rest (support-contact phone) + bcrypt access-code hashing.
create extension if not exists pgcrypto with schema extensions;
