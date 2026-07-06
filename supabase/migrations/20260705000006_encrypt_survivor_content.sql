-- Encrypt survivor free-text content at rest.
--
-- THREAT MODEL: a leaked database dump / backup / read-replica must not reveal
-- who said what. We encrypt every free-text content column with pgcrypto's
-- pgp_sym_encrypt, using a key held in Supabase Vault (NOT in any table) — the
-- exact pattern already used for survivors.support_contact_phone_enc. All
-- read/write of the content goes through SECURITY DEFINER RPCs that hold the
-- key; a raw table dump yields only bytea ciphertext. (This does NOT defend a
-- full server compromise that also has the Vault key — an accepted trade, and
-- there is deliberately no user passphrase to lose.)
--
-- Content lives in FIVE places, all handled here:
--   statements.raw_text, timeline_events.description, documents.note +
--   extracted_text, embeddings.chunk_text, and content_revisions.snapshot
--   (which to_jsonb()'s the whole prior row on every edit).
-- timeline_events.title is unused legacy (nullable, never written) → dropped.

-- ── 1. Content key in Vault (provision once, strong random) ─────────────────
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'content_key') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'content_key');
  end if;
end $$;

-- ── 2. Internal encrypt/decrypt helpers (NEVER granted to clients) ──────────
-- SECURITY DEFINER so they can read the Vault key via app_secret(); revoked
-- from anon/authenticated so only our other DEFINER RPCs (which enforce row
-- ownership) can reach them. A client can never decrypt arbitrary ciphertext.
create or replace function public.content_encrypt(p text) returns bytea
  language sql security definer set search_path = public, extensions as $$
  select case when p is null then null
              else pgp_sym_encrypt(p, public.app_secret('content_key')) end;
$$;
revoke all on function public.content_encrypt(text) from public, anon, authenticated;

create or replace function public.content_decrypt(p bytea) returns text
  language sql security definer set search_path = public, extensions as $$
  select case when p is null then null
              else pgp_sym_decrypt(p, public.app_secret('content_key')) end;
$$;
revoke all on function public.content_decrypt(bytea) from public, anon, authenticated;

-- ── 3. Drop revision triggers (they depend on the columns we're dropping) ───
drop trigger if exists statements_capture_revision on public.statements;
drop trigger if exists timeline_capture_revision on public.timeline_events;

-- ── 4. Encrypt each content column: add _enc, migrate, drop plaintext ───────
-- statements.raw_text
alter table public.statements add column if not exists raw_text_enc bytea;
update public.statements set raw_text_enc = public.content_encrypt(raw_text)
  where raw_text is not null and raw_text_enc is null;
alter table public.statements drop column if exists raw_text;

-- timeline_events.description (+ drop unused legacy title)
alter table public.timeline_events add column if not exists description_enc bytea;
update public.timeline_events set description_enc = public.content_encrypt(description)
  where description is not null and description_enc is null;
alter table public.timeline_events drop column if exists description;
alter table public.timeline_events drop column if exists title;

-- documents.note + documents.extracted_text (extracted_text is dormant/OCR-future)
alter table public.documents add column if not exists note_enc bytea;
alter table public.documents add column if not exists extracted_text_enc bytea;
update public.documents set note_enc = public.content_encrypt(note)
  where note is not null and note_enc is null;
update public.documents set extracted_text_enc = public.content_encrypt(extracted_text)
  where extracted_text is not null and extracted_text_enc is null;
alter table public.documents drop column if exists note;
alter table public.documents drop column if exists extracted_text;

-- embeddings.chunk_text (the RAG search-index copy)
alter table public.embeddings add column if not exists chunk_text_enc bytea;
update public.embeddings set chunk_text_enc = public.content_encrypt(chunk_text)
  where chunk_text is not null and chunk_text_enc is null;
alter table public.embeddings drop column if exists chunk_text;

-- content_revisions.snapshot: re-encrypt plaintext captured in prior snapshots.
-- Going forward, to_jsonb(old) captures the _enc bytea (ciphertext) automatically.
update public.content_revisions
   set snapshot = (snapshot - 'raw_text')
     || jsonb_build_object('raw_text_enc',
          encode(public.content_encrypt(snapshot->>'raw_text'), 'base64'))
 where entity_type = 'statement' and snapshot ? 'raw_text';

update public.content_revisions
   set snapshot = (snapshot - 'description' - 'title')
     || jsonb_build_object('description_enc',
          case when snapshot ? 'description'
               then encode(public.content_encrypt(snapshot->>'description'), 'base64')
               else null end)
 where entity_type = 'timeline_event' and (snapshot ? 'description' or snapshot ? 'title');

-- ── 5. Recreate revision triggers, now keyed on the _enc columns ────────────
create trigger statements_capture_revision
  before update on public.statements
  for each row when (old.raw_text_enc is distinct from new.raw_text_enc)
  execute function public.capture_statement_revision();

create trigger timeline_capture_revision
  before update on public.timeline_events
  for each row when (
    old.description_enc is distinct from new.description_enc
    or old.event_date is distinct from new.event_date
  )
  execute function public.capture_timeline_revision();

-- ── 6. Content RPCs (DEFINER, ownership-enforced, encrypt on write / decrypt
--      on read). Clients no longer touch the content columns directly. DELETE
--      stays direct (RLS) — it never touches ciphertext. ─────────────────────

-- Statements
create or replace function public.app_list_statements()
  returns table (id uuid, raw_text text, visibility public.content_visibility,
                 language text, created_at timestamptz, updated_at timestamptz)
  language sql security definer set search_path = public, extensions as $$
  select s.id, public.content_decrypt(s.raw_text_enc), s.visibility, s.language,
         s.created_at, s.updated_at
  from public.statements s
  where s.survivor_id = public.current_survivor_id()
  order by s.created_at desc;
$$;
grant execute on function public.app_list_statements() to authenticated;

create or replace function public.app_save_statement(
    p_id uuid, p_text text, p_visibility public.content_visibility)
  returns table (id uuid, raw_text text, visibility public.content_visibility,
                 language text, created_at timestamptz, updated_at timestamptz)
  language plpgsql security definer set search_path = public, extensions as $$
declare
  v_sv uuid := public.current_survivor_id();
  v_id uuid;
begin
  if v_sv is null then raise exception 'not authenticated'; end if;
  if p_id is null then
    insert into public.statements (survivor_id, raw_text_enc, visibility, language)
    values (v_sv, public.content_encrypt(p_text), p_visibility,
            (select preferred_language from public.survivors where id = v_sv))
    returning statements.id into v_id;
  else
    update public.statements
       set raw_text_enc = public.content_encrypt(p_text),
           visibility = p_visibility, updated_at = now()
     where id = p_id and survivor_id = v_sv
    returning statements.id into v_id;
    if v_id is null then raise exception 'not found'; end if;
  end if;
  return query
    select s.id, public.content_decrypt(s.raw_text_enc), s.visibility, s.language,
           s.created_at, s.updated_at
    from public.statements s where s.id = v_id;
end;
$$;
grant execute on function public.app_save_statement(uuid, text, public.content_visibility) to authenticated;

-- Timeline
create or replace function public.app_list_timeline()
  returns table (id uuid, event_date date, relative_anchor text, description text,
                 visibility public.content_visibility, created_at timestamptz, updated_at timestamptz)
  language sql security definer set search_path = public, extensions as $$
  select t.id, t.event_date, t.relative_anchor, public.content_decrypt(t.description_enc),
         t.visibility, t.created_at, t.updated_at
  from public.timeline_events t
  where t.survivor_id = public.current_survivor_id()
  order by t.created_at desc;
$$;
grant execute on function public.app_list_timeline() to authenticated;

create or replace function public.app_save_timeline_event(
    p_id uuid, p_event_date date, p_relative_anchor text, p_description text,
    p_visibility public.content_visibility)
  returns table (id uuid, event_date date, relative_anchor text, description text,
                 visibility public.content_visibility, created_at timestamptz, updated_at timestamptz)
  language plpgsql security definer set search_path = public, extensions as $$
declare
  v_sv uuid := public.current_survivor_id();
  v_id uuid;
begin
  if v_sv is null then raise exception 'not authenticated'; end if;
  if p_id is null then
    insert into public.timeline_events (survivor_id, event_date, relative_anchor, description_enc, visibility)
    values (v_sv, p_event_date, p_relative_anchor, public.content_encrypt(p_description), p_visibility)
    returning timeline_events.id into v_id;
  else
    update public.timeline_events
       set event_date = p_event_date, relative_anchor = p_relative_anchor,
           description_enc = public.content_encrypt(p_description),
           visibility = p_visibility, updated_at = now()
     where id = p_id and survivor_id = v_sv
    returning timeline_events.id into v_id;
    if v_id is null then raise exception 'not found'; end if;
  end if;
  return query
    select t.id, t.event_date, t.relative_anchor, public.content_decrypt(t.description_enc),
           t.visibility, t.created_at, t.updated_at
    from public.timeline_events t where t.id = v_id;
end;
$$;
grant execute on function public.app_save_timeline_event(uuid, date, text, text, public.content_visibility) to authenticated;

-- Documents (insert-only from the client; note is encrypted, file stays in Storage)
create or replace function public.app_list_documents()
  returns table (id uuid, storage_path text, note text,
                 visibility public.content_visibility, uploaded_at timestamptz)
  language sql security definer set search_path = public, extensions as $$
  select d.id, d.storage_path, public.content_decrypt(d.note_enc), d.visibility, d.uploaded_at
  from public.documents d
  where d.survivor_id = public.current_survivor_id()
  order by d.uploaded_at desc;
$$;
grant execute on function public.app_list_documents() to authenticated;

create or replace function public.app_save_document(
    p_storage_path text, p_note text, p_visibility public.content_visibility)
  returns table (id uuid, storage_path text, note text,
                 visibility public.content_visibility, uploaded_at timestamptz)
  language plpgsql security definer set search_path = public, extensions as $$
declare
  v_sv uuid := public.current_survivor_id();
  v_id uuid;
begin
  if v_sv is null then raise exception 'not authenticated'; end if;
  insert into public.documents (survivor_id, storage_path, note_enc, visibility)
  values (v_sv, p_storage_path, public.content_encrypt(nullif(p_note, '')), p_visibility)
  returning documents.id into v_id;
  return query
    select d.id, d.storage_path, public.content_decrypt(d.note_enc), d.visibility, d.uploaded_at
    from public.documents d where d.id = v_id;
end;
$$;
grant execute on function public.app_save_document(text, text, public.content_visibility) to authenticated;

-- Embeddings: the RAG edge function indexes through this (encrypts the chunk).
create or replace function public.app_index_embedding(
    p_source_type public.embedding_source, p_source_id uuid, p_chunk_text text,
    p_language text, p_embedding extensions.vector)
  returns void
  language plpgsql security definer set search_path = public, extensions as $$
declare v_sv uuid := public.current_survivor_id();
begin
  if v_sv is null then raise exception 'not authenticated'; end if;
  insert into public.embeddings (survivor_id, source_type, source_id, chunk_text_enc, language, embedding)
  values (v_sv, p_source_type, p_source_id, public.content_encrypt(p_chunk_text), p_language, p_embedding)
  on conflict (survivor_id, source_id) do update
    set chunk_text_enc = excluded.chunk_text_enc,
        language = excluded.language,
        embedding = excluded.embedding,
        source_type = excluded.source_type;
end;
$$;
grant execute on function public.app_index_embedding(public.embedding_source, uuid, text, text, extensions.vector) to authenticated;

-- match_embeddings: same signature/callers, now decrypts the stored chunk.
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
  select e.source_type, e.source_id, public.content_decrypt(e.chunk_text_enc), e.language,
         1 - (e.embedding <=> query_embedding) as score
  from public.embeddings e
  where e.survivor_id = public.current_survivor_id()
    and e.embedding is not null
  order by e.embedding <=> query_embedding
  limit greatest(1, least(coalesce(match_count, 6), 20));
$$;
grant execute on function public.match_embeddings(extensions.vector, int) to authenticated;
