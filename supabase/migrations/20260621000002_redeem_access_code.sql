-- Atomically turn a valid access code + the caller's (anonymous) auth identity into a
-- survivor row. The client calls verify_access_code (migration 06) FIRST, pre-auth, so a
-- bad code never creates an orphan anonymous user; redeem_access_code is the authoritative,
-- locked write.

create or replace function public.redeem_access_code(p_code text)
  returns uuid
  language plpgsql security definer set search_path = public, extensions as $$
declare
  v_uid        uuid := auth.uid();
  v_survivor   uuid;
  v_code_id    uuid;
  v_gatekeeper uuid;
begin
  if v_uid is null then
    raise exception 'must be authenticated';
  end if;

  -- Idempotent: auth_user_id is unique, so an auth user maps to exactly one survivor.
  -- A double-submit / retry returns the existing row instead of erroring.
  select id into v_survivor from public.survivors where auth_user_id = v_uid;
  if v_survivor is not null then
    return v_survivor;
  end if;

  -- Lock the matching unredeemed, unexpired code so two concurrent redeems can't both win.
  select id, gatekeeper_id into v_code_id, v_gatekeeper
    from public.access_codes
   where code_hash = crypt(p_code, code_hash)
     and redeemed_by is null
     and (expires_at is null or expires_at > now())
   order by created_at
   limit 1
   for update;

  if v_code_id is null then
    raise exception 'invalid or expired code';
  end if;

  insert into public.survivors (auth_user_id, gatekeeper_id)
  values (v_uid, v_gatekeeper)
  returning id into v_survivor;

  update public.access_codes
     set redeemed_by = v_survivor, redeemed_at = now()
   where id = v_code_id;

  return v_survivor;
end;
$$;

grant execute on function public.redeem_access_code(text) to authenticated;
-- verify_access_code must be reachable before sign-in (anon role):
grant execute on function public.verify_access_code(text) to anon, authenticated;
