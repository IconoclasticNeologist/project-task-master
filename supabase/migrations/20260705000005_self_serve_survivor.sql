-- Self-serve entry: a person with no advocate can create their own anonymous
-- survivor identity — no code, no gatekeeper. Mirrors redeem_access_code minus
-- the code lookup and gatekeeper binding.
--
-- gatekeeper_id has been nullable since 20260623000001, and a NULL gatekeeper is
-- exactly what marks a self-serve survivor: they belong to no organization, and
-- no human gatekeeper can read their space (is_gatekeeper_for never matches).
-- The advocate's individualized tech-safety planning is replaced by an in-app
-- safety check (src/routes/begin.tsx) shown before any identity is created.
--
-- SECURITY DEFINER so the insert runs past RLS, exactly like redeem_access_code.

create or replace function public.create_self_serve_survivor()
  returns uuid
  language plpgsql security definer set search_path = public, extensions as $$
declare
  v_uid      uuid := auth.uid();
  v_survivor uuid;
begin
  if v_uid is null then
    raise exception 'must be authenticated';
  end if;

  -- Idempotent: auth_user_id is unique, so a retry returns the same survivor.
  select id into v_survivor from public.survivors where auth_user_id = v_uid;
  if v_survivor is not null then
    return v_survivor;
  end if;

  insert into public.survivors (auth_user_id, gatekeeper_id)
  values (v_uid, null)
  returning id into v_survivor;

  return v_survivor;
end;
$$;

grant execute on function public.create_self_serve_survivor() to authenticated;
