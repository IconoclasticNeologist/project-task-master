-- "A note to your Coach" — survivor-authored session context.
--
-- The app keeps no transcripts (deliberate), so every session starts from
-- zero. This note is the survivor-CONTROLLED middle path: they write it,
-- they see it, they can change or clear it any time, and the Coach reads it
-- at the start of a session. It is never shown to professionals, never given
-- to practice modes, and it is encrypted at rest like every other free-text
-- store (content_encrypt / vault key).

alter table public.survivors add column if not exists coach_note_enc bytea;

-- Survivor writes their own note (empty/whitespace clears it). Capped server-side.
create or replace function public.app_set_coach_note(p_note text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if p_note is null or length(btrim(p_note)) = 0 then
    update public.survivors set coach_note_enc = null where auth_user_id = v_uid;
  else
    update public.survivors
       set coach_note_enc = public.content_encrypt(left(btrim(p_note), 600))
     where auth_user_id = v_uid;
  end if;
end $$;

-- Survivor reads their own note back (Settings shows it in the clear to them).
create or replace function public.app_get_coach_note()
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_note text;
begin
  if v_uid is null then
    return null;
  end if;
  select public.content_decrypt(coach_note_enc)
    into v_note
    from public.survivors
   where auth_user_id = v_uid;
  return v_note;
end $$;

-- Service-role read for the voice-token mint (coach modes only; the function
-- layer decides that — this just resolves note-for-caller).
create or replace function public.coach_note_for_auth_user(p_auth uuid)
returns text
language sql security definer set search_path = public as $$
  select public.content_decrypt(coach_note_enc)
    from public.survivors
   where auth_user_id = p_auth;
$$;

revoke all on function public.app_set_coach_note(text) from public, anon;
grant execute on function public.app_set_coach_note(text) to authenticated;
revoke all on function public.app_get_coach_note() from public, anon;
grant execute on function public.app_get_coach_note() to authenticated;
revoke all on function public.coach_note_for_auth_user(uuid) from public, anon, authenticated;
grant execute on function public.coach_note_for_auth_user(uuid) to service_role;
