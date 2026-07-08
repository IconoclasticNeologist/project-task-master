-- Account lifecycle: self-serve erasure of a survivor's entire space.
--
-- Before this, there was no way for a survivor to delete their account/data, and
-- deleting the auth user only NULLed survivors.auth_user_id (orphaning the encrypted
-- content rather than erasing it). For EU/UK users that's GDPR Art. 17; for everyone
-- it's the right of a person to remove sensitive abuse narratives on demand.
--
-- delete_my_space() removes the survivor row for the caller. Every survivor-owned table
-- (statements, timeline_events, documents, embeddings, content_revisions, flags, court
-- plan, client_workspaces and their children, acknowledgements) is FK'd
-- `on delete cascade`, so one delete erases all of it. The only inbound links that
-- survive are access_codes/client_invitations.redeemed_by, which are `on delete set
-- null` and hold no content — they simply forget who redeemed the code.
--
-- NOTE: document *file bytes* live in Storage, not in these tables. The client removes
-- those blobs before calling this RPC (it can, under Storage RLS, for its own folder);
-- this function erases the database side.

create or replace function public.delete_my_space()
  returns void
  language plpgsql security definer set search_path = public, auth
as $$
declare
  v_sv uuid := public.current_survivor_id();
  v_uid uuid := auth.uid();
begin
  if v_sv is null then
    raise exception 'not authenticated';
  end if;

  -- Cascade-erase all survivor-owned rows.
  delete from public.survivors where id = v_sv;

  -- Best-effort: also remove the (anonymous) auth user so no identity lingers. Wrapped
  -- so a permissions restriction can't fail the erase — the content is already gone,
  -- which is the part that matters.
  begin
    delete from auth.users where id = v_uid;
  exception
    when others then
      null;
  end;
end;
$$;

revoke all on function public.delete_my_space() from public, anon;
grant execute on function public.delete_my_space() to authenticated;
