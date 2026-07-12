-- Fix PL/pgSQL 42702 "column reference is ambiguous" bugs.
--
-- BUG CLASS: a plpgsql function declared `returns table (id uuid, ...)` implicitly
-- declares each output column name as a variable. Any UNQUALIFIED reference to such
-- a name inside embedded SQL (WHERE clauses, subselects, etc.) is ambiguous between
-- the variable and a table column, and raises error 42702 at RUNTIME (plpgsql's
-- default variable_conflict = error) when that statement first executes.
--
-- Five functions referenced a bare `id` in a WHERE clause while also returning an
-- `id` output column. Fix: qualify the reference with the table name. Each function
-- below is otherwise byte-identical to its latest definition (20260705000006 /
-- 20260706000002). `create or replace` preserves existing grants — none re-issued.

-- Was broken in both branches: `where id = v_sv` (insert subselect) and
-- `where id = p_id` (update) collided with the `id` output column.
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
            (select preferred_language from public.survivors where survivors.id = v_sv))
    returning statements.id into v_id;
  else
    update public.statements
       set raw_text_enc = public.content_encrypt(p_text),
           visibility = p_visibility, updated_at = now()
     where statements.id = p_id and survivor_id = v_sv
    returning statements.id into v_id;
    if v_id is null then raise exception 'not found'; end if;
  end if;
  return query
    select s.id, public.content_decrypt(s.raw_text_enc), s.visibility, s.language,
           s.created_at, s.updated_at
    from public.statements s where s.id = v_id;
end;
$$;

-- Was broken in the update branch: `where id = p_id` collided with the `id`
-- output column (editing an existing event failed; creating one did not).
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
     where timeline_events.id = p_id and survivor_id = v_sv
    returning timeline_events.id into v_id;
    if v_id is null then raise exception 'not found'; end if;
  end if;
  return query
    select t.id, t.event_date, t.relative_anchor, public.content_decrypt(t.description_enc),
           t.visibility, t.created_at, t.updated_at
    from public.timeline_events t where t.id = v_id;
end;
$$;

-- Was broken on every call: `where id = p_workspace_id` collided with the `id`
-- output column.
create or replace function public.app_list_shared_statements(p_workspace_id uuid)
  returns table (id uuid, raw_text text, created_at timestamptz)
  language plpgsql security definer set search_path = public, extensions as $$
declare v_sv uuid;
begin
  if not public.has_active_client_access(p_workspace_id, 'shared_statements') then
    raise exception 'not authorized';
  end if;
  select survivor_id into v_sv from public.client_workspaces where client_workspaces.id = p_workspace_id;
  return query
    select s.id, public.content_decrypt(s.raw_text_enc), s.created_at
    from public.statements s
    where s.survivor_id = v_sv and s.visibility = 'shareable'
    order by s.created_at desc;
end;
$$;

-- Same bug as app_list_shared_statements.
create or replace function public.app_list_shared_timeline(p_workspace_id uuid)
  returns table (id uuid, event_date date, relative_anchor text, description text, created_at timestamptz)
  language plpgsql security definer set search_path = public, extensions as $$
declare v_sv uuid;
begin
  if not public.has_active_client_access(p_workspace_id, 'shared_timeline') then
    raise exception 'not authorized';
  end if;
  select survivor_id into v_sv from public.client_workspaces where client_workspaces.id = p_workspace_id;
  return query
    select t.id, t.event_date, t.relative_anchor, public.content_decrypt(t.description_enc), t.created_at
    from public.timeline_events t
    where t.survivor_id = v_sv and t.visibility = 'shareable'
    order by t.created_at desc;
end;
$$;

-- Missing table grant: client_workspaces has RLS enabled and a
-- workspaces_client_or_grantee_read policy (20260623000001), but SELECT was
-- never granted to authenticated. Any policy whose USING clause subqueries the
-- table — e.g. storage.objects documents_shared_read (20260706000002) — then
-- fails the WHOLE query with "permission denied for table client_workspaces",
-- which breaks a survivor signing a URL to view their OWN document. RLS still
-- restricts rows: survivor sees own workspace, grantee sees granted ones.
grant select on public.client_workspaces to authenticated;

-- Same bug as app_list_shared_statements.
create or replace function public.app_list_shared_documents(p_workspace_id uuid)
  returns table (id uuid, storage_path text, note text, file_name text,
                 mime_type text, uploaded_at timestamptz)
  language plpgsql security definer set search_path = public, extensions as $$
declare v_sv uuid;
begin
  if not public.has_active_client_access(p_workspace_id, 'shared_documents') then
    raise exception 'not authorized';
  end if;
  select survivor_id into v_sv from public.client_workspaces where client_workspaces.id = p_workspace_id;
  return query
    select d.id, d.storage_path, public.content_decrypt(d.note_enc),
           public.content_decrypt(d.file_name_enc), d.mime_type, d.uploaded_at
    from public.documents d
    where d.survivor_id = v_sv and d.visibility = 'shareable'
    order by d.uploaded_at desc;
end;
$$;
