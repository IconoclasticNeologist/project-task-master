-- RLS identity helpers + privileged RPCs. Defined after gatekeepers/survivors/access_codes
-- exist so SQL-language function bodies resolve cleanly. SECURITY DEFINER + locked
-- search_path keeps policies DRY and immune to search_path attacks.

create or replace function public.current_survivor_id() returns uuid
  language sql stable security definer set search_path = public as $$
  select id from public.survivors where auth_user_id = auth.uid()
$$;

create or replace function public.current_gatekeeper_id() returns uuid
  language sql stable security definer set search_path = public as $$
  select id from public.gatekeepers where auth_user_id = auth.uid()
$$;

create or replace function public.is_gatekeeper_for(p_survivor_id uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.survivors s
    join public.gatekeepers g on g.id = s.gatekeeper_id
    where s.id = p_survivor_id and g.auth_user_id = auth.uid()
  )
$$;

-- ── Support-contact phone: encrypted set/get (key from Vault, never client-side) ──
create or replace function public.set_support_contact(p_survivor_id uuid, p_name text, p_phone text)
  returns void
  language plpgsql security definer set search_path = public, extensions as $$
begin
  if not (p_survivor_id = public.current_survivor_id() or public.is_gatekeeper_for(p_survivor_id)) then
    raise exception 'not authorized';
  end if;
  update public.survivors
     set support_contact_name = p_name,
         support_contact_phone_enc = case
           when p_phone is null then null
           else pgp_sym_encrypt(p_phone, public.app_secret('support_contact_key'))
         end
   where id = p_survivor_id;
end;
$$;

create or replace function public.get_support_contact(p_survivor_id uuid)
  returns table (name text, phone text)
  language plpgsql security definer set search_path = public, extensions as $$
begin
  if not (p_survivor_id = public.current_survivor_id() or public.is_gatekeeper_for(p_survivor_id)) then
    raise exception 'not authorized';
  end if;
  return query
    select s.support_contact_name,
           case when s.support_contact_phone_enc is null then null
                else pgp_sym_decrypt(s.support_contact_phone_enc, public.app_secret('support_contact_key')) end
    from public.survivors s
    where s.id = p_survivor_id;
end;
$$;

-- ── Access codes: mint (gatekeeper) + verify (prospective survivor) ──
-- Primitives for the later gatekeeper provisioning flow. No UI/session logic here.
create or replace function public.mint_access_code(p_code text, p_label text, p_expires_at timestamptz)
  returns uuid
  language plpgsql security definer set search_path = public, extensions as $$
declare v_gatekeeper uuid; v_id uuid;
begin
  v_gatekeeper := public.current_gatekeeper_id();
  if v_gatekeeper is null then raise exception 'not a gatekeeper'; end if;
  insert into public.access_codes (gatekeeper_id, code_hash, label, expires_at)
  values (v_gatekeeper, crypt(p_code, gen_salt('bf')), p_label, p_expires_at)
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.verify_access_code(p_code text)
  returns uuid
  language plpgsql security definer set search_path = public, extensions as $$
declare v_gatekeeper uuid;
begin
  select gatekeeper_id into v_gatekeeper
    from public.access_codes
   where code_hash = crypt(p_code, code_hash)
     and redeemed_by is null
     and (expires_at is null or expires_at > now())
   limit 1;
  return v_gatekeeper;  -- null when invalid / expired / already used
end;
$$;
