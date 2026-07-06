-- Document FILE encryption (the binary bytes, not just the note).
--
-- Files are encrypted in the browser with AES-GCM before upload, so Supabase
-- Storage holds only ciphertext. The key is derived SERVER-SIDE — HMAC-SHA256 of
-- the survivor id with the Vault content key — and handed only to the owning
-- survivor or an authorized gatekeeper via get_document_key(). Same threat model
-- as the DB content: a Storage breach yields ciphertext; you'd also need the
-- Vault key. Per-survivor derivation means a leaked key only affects one person.
--
-- The filename used to sit in the storage path (…/{uuid}_{filename}) — a leak in
-- a bucket listing — so it moves into an encrypted column, and the storage path
-- becomes just {survivor_id}/{uuid}. MIME type is kept (low-sensitivity, needed
-- to re-open the file). No data backfill: there are zero existing documents.

alter table public.documents add column if not exists file_name_enc bytea;
alter table public.documents add column if not exists mime_type text;

-- Per-survivor file key (base64). Authorized to the owner OR a gatekeeper of
-- the target survivor (the gatekeeper path powers the professional shared view).
create or replace function public.get_document_key(p_survivor_id uuid default null)
  returns text
  language plpgsql security definer set search_path = public, extensions as $$
declare
  v_caller uuid := public.current_survivor_id();
  v_target uuid := coalesce(p_survivor_id, v_caller);
begin
  if v_caller is null then raise exception 'not authenticated'; end if;
  if not (v_target = v_caller or public.is_gatekeeper_for(v_target)) then
    raise exception 'not authorized';
  end if;
  return encode(hmac(v_target::text, public.app_secret('content_key'), 'sha256'), 'base64');
end;
$$;
grant execute on function public.get_document_key(uuid) to authenticated;

-- Replace the document save RPC to carry the (encrypted) filename + mime.
drop function if exists public.app_save_document(text, text, public.content_visibility);
create or replace function public.app_save_document(
    p_storage_path text, p_note text, p_visibility public.content_visibility,
    p_file_name text, p_mime_type text)
  returns table (id uuid, storage_path text, note text, file_name text,
                 mime_type text, visibility public.content_visibility, uploaded_at timestamptz)
  language plpgsql security definer set search_path = public, extensions as $$
declare v_sv uuid := public.current_survivor_id(); v_id uuid;
begin
  if v_sv is null then raise exception 'not authenticated'; end if;
  insert into public.documents (survivor_id, storage_path, note_enc, file_name_enc, mime_type, visibility)
  values (v_sv, p_storage_path, public.content_encrypt(nullif(p_note, '')),
          public.content_encrypt(nullif(p_file_name, '')), p_mime_type, p_visibility)
  returning documents.id into v_id;
  return query
    select d.id, d.storage_path, public.content_decrypt(d.note_enc),
           public.content_decrypt(d.file_name_enc), d.mime_type, d.visibility, d.uploaded_at
    from public.documents d where d.id = v_id;
end;
$$;
grant execute on function public.app_save_document(text, text, public.content_visibility, text, text) to authenticated;

-- Changed return shape (added file_name + mime_type) → must drop, not replace.
drop function if exists public.app_list_documents();
create or replace function public.app_list_documents()
  returns table (id uuid, storage_path text, note text, file_name text,
                 mime_type text, visibility public.content_visibility, uploaded_at timestamptz)
  language sql security definer set search_path = public, extensions as $$
  select d.id, d.storage_path, public.content_decrypt(d.note_enc),
         public.content_decrypt(d.file_name_enc), d.mime_type, d.visibility, d.uploaded_at
  from public.documents d
  where d.survivor_id = public.current_survivor_id()
  order by d.uploaded_at desc;
$$;
grant execute on function public.app_list_documents() to authenticated;
