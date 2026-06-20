-- Documents: uploaded-file METADATA only. Binary lives in a PRIVATE Storage bucket.

create table public.documents (
  id                uuid primary key default gen_random_uuid(),
  survivor_id       uuid not null references public.survivors (id) on delete cascade,
  storage_path      text not null,                                  -- path within the 'documents' bucket
  document_type     public.document_type not null default 'other',
  detected_language text,
  extracted_text    text,
  visibility        public.content_visibility not null default 'private',
  uploaded_at       timestamptz not null default now()
);

alter table public.documents enable row level security;
create index documents_survivor_idx on public.documents (survivor_id);

create policy documents_survivor_all on public.documents
  for all
  using (survivor_id = public.current_survivor_id())
  with check (survivor_id = public.current_survivor_id());

create policy documents_gatekeeper_read on public.documents
  for select
  using (visibility = 'shareable' and public.is_gatekeeper_for(survivor_id));

-- ── Private Storage bucket (NOT public) ───────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Storage RLS: a survivor accesses ONLY their own folder, keyed {survivor_id}/...
-- (Gatekeeper access to binaries is deferred to the later legal-partner export flow;
--  shareable-document metadata is already readable via documents_gatekeeper_read.)
create policy "documents bucket: survivor read" on storage.objects
  for select using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.current_survivor_id()::text
  );
create policy "documents bucket: survivor insert" on storage.objects
  for insert with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.current_survivor_id()::text
  );
create policy "documents bucket: survivor update" on storage.objects
  for update using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.current_survivor_id()::text
  );
create policy "documents bucket: survivor delete" on storage.objects
  for delete using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.current_survivor_id()::text
  );
