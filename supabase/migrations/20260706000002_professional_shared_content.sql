-- Professional shared-content view: an approved professional reads a client's
-- SHARED (visibility='shareable') statements, timeline, and documents — decrypted,
-- read-only. This is the "subsequent migration" the org/access model deferred:
-- content access is authorized by the SCOPED CONSENT model, has_active_client_access
-- (workspace_id, scope), NOT the legacy is_gatekeeper_for. The professional only
-- ever holds workspace_id; each DEFINER RPC resolves survivor_id internally.

-- ── Fix get_document_key: a professional's current_survivor_id() is NULL, which
--    the old guard rejected before the gatekeeper branch could run. Authorize on
--    identity, not on "is a survivor". (Own survivor OR legacy gatekeeper.)
create or replace function public.get_document_key(p_survivor_id uuid default null)
  returns text
  language plpgsql security definer set search_path = public, extensions as $$
declare
  v_caller uuid := public.current_survivor_id();
  v_target uuid := coalesce(p_survivor_id, v_caller);
begin
  if v_target is null then raise exception 'not authenticated'; end if;
  if not ((v_caller is not null and v_target = v_caller) or public.is_gatekeeper_for(v_target)) then
    raise exception 'not authorized';
  end if;
  return encode(hmac(v_target::text, public.app_secret('content_key'), 'sha256'), 'base64');
end;
$$;

-- ── List the clients who've shared CONTENT with me (parallel to
--    list_my_client_workspaces, which is court-plan-scoped and excludes these).
create or replace function public.list_my_shared_content_clients()
  returns table (workspace_id uuid, organization_name text, client_name text,
                 scopes public.client_access_scope[])
  language sql stable security definer set search_path = public as $$
  select w.id, o.name,
         coalesce(nullif(s.first_name, ''), 'Client') as client_name,
         array_agg(distinct scope_value order by scope_value)
  from public.client_access_grants g
  join public.organization_memberships m on m.id = g.membership_id
  join public.client_workspaces w on w.id = g.workspace_id
  join public.organizations o on o.id = w.organization_id
  join public.survivors s on s.id = w.survivor_id
  cross join unnest(g.scopes) as scope_value
  where m.auth_user_id = auth.uid()
    and m.status = 'active' and g.status = 'active'
    and (g.expires_at is null or g.expires_at > now())
    and public.is_approved_professional()
    and scope_value in ('shared_statements', 'shared_timeline', 'shared_documents')
  group by w.id, o.name, s.first_name
  order by o.name, client_name;
$$;
grant execute on function public.list_my_shared_content_clients() to authenticated;

-- ── Shared statements
create or replace function public.app_list_shared_statements(p_workspace_id uuid)
  returns table (id uuid, raw_text text, created_at timestamptz)
  language plpgsql security definer set search_path = public, extensions as $$
declare v_sv uuid;
begin
  if not public.has_active_client_access(p_workspace_id, 'shared_statements') then
    raise exception 'not authorized';
  end if;
  select survivor_id into v_sv from public.client_workspaces where id = p_workspace_id;
  return query
    select s.id, public.content_decrypt(s.raw_text_enc), s.created_at
    from public.statements s
    where s.survivor_id = v_sv and s.visibility = 'shareable'
    order by s.created_at desc;
end;
$$;
grant execute on function public.app_list_shared_statements(uuid) to authenticated;

-- ── Shared timeline
create or replace function public.app_list_shared_timeline(p_workspace_id uuid)
  returns table (id uuid, event_date date, relative_anchor text, description text, created_at timestamptz)
  language plpgsql security definer set search_path = public, extensions as $$
declare v_sv uuid;
begin
  if not public.has_active_client_access(p_workspace_id, 'shared_timeline') then
    raise exception 'not authorized';
  end if;
  select survivor_id into v_sv from public.client_workspaces where id = p_workspace_id;
  return query
    select t.id, t.event_date, t.relative_anchor, public.content_decrypt(t.description_enc), t.created_at
    from public.timeline_events t
    where t.survivor_id = v_sv and t.visibility = 'shareable'
    order by t.created_at desc;
end;
$$;
grant execute on function public.app_list_shared_timeline(uuid) to authenticated;

-- ── Shared documents (metadata; the file bytes stay encrypted in Storage)
create or replace function public.app_list_shared_documents(p_workspace_id uuid)
  returns table (id uuid, storage_path text, note text, file_name text,
                 mime_type text, uploaded_at timestamptz)
  language plpgsql security definer set search_path = public, extensions as $$
declare v_sv uuid;
begin
  if not public.has_active_client_access(p_workspace_id, 'shared_documents') then
    raise exception 'not authorized';
  end if;
  select survivor_id into v_sv from public.client_workspaces where id = p_workspace_id;
  return query
    select d.id, d.storage_path, public.content_decrypt(d.note_enc),
           public.content_decrypt(d.file_name_enc), d.mime_type, d.uploaded_at
    from public.documents d
    where d.survivor_id = v_sv and d.visibility = 'shareable'
    order by d.uploaded_at desc;
end;
$$;
grant execute on function public.app_list_shared_documents(uuid) to authenticated;

-- ── The per-survivor file key for a professional, keyed by workspace + scope.
--    Same derivation as get_document_key, so the pro decrypts the same bytes.
create or replace function public.get_document_key_for_workspace(p_workspace_id uuid)
  returns text
  language plpgsql security definer set search_path = public, extensions as $$
declare v_sv uuid;
begin
  if not public.has_active_client_access(p_workspace_id, 'shared_documents') then
    raise exception 'not authorized';
  end if;
  select survivor_id into v_sv from public.client_workspaces where id = p_workspace_id;
  return encode(hmac(v_sv::text, public.app_secret('content_key'), 'sha256'), 'base64');
end;
$$;
grant execute on function public.get_document_key_for_workspace(uuid) to authenticated;

-- ── Storage: let an authorized professional read the ciphertext object for a
--    SHAREABLE document (the owning-survivor-only policies otherwise block them).
--    They still need the workspace key (above) to decrypt.
drop policy if exists documents_shared_read on storage.objects;
create policy documents_shared_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documents'
    and exists (
      select 1
      from public.documents d
      join public.client_workspaces w on w.survivor_id = d.survivor_id
      where d.storage_path = storage.objects.name
        and d.visibility = 'shareable'
        and public.has_active_client_access(w.id, 'shared_documents')
    )
  );
