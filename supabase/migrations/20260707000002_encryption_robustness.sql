-- Encryption robustness: fail-closed writes + per-row-resilient reads.
--
-- Two hazards in the at-rest encryption (20260705000006) are closed here, WITHOUT
-- changing any RPC signature — both helpers keep their name, arg types, and grants, so
-- every caller (app_list_*, match_embeddings, the shared-content and document-file
-- readers) inherits the new behavior automatically.
--
--   1. Fail-closed writes. If the Vault content_key is ABSENT, pgp_sym_encrypt(p, NULL)
--      is STRICT and returns NULL — so content_encrypt silently stored NULL and a save
--      "succeeded" while discarding the survivor's text. Their statement IS their court
--      evidence, so silent loss is unacceptable. content_encrypt now RAISES instead; the
--      save surfaces an error the survivor can act on rather than losing the text.
--
--   2. Per-row-resilient reads. content_decrypt ran inline with no exception handling, so
--      a SINGLE corrupt/undecryptable row (bad restore, bitrot, a row written under a
--      rotated key) made the ENTIRE list/timeline/draft-export fail — all evidence
--      inaccessible, not just the bad row. Decrypt is now per-row exception-safe: a bad
--      row yields a visible marker; every good row still loads.

create or replace function public.content_encrypt(p text) returns bytea
  language plpgsql security definer set search_path = public, extensions as $$
declare
  v_key text := public.app_secret('content_key');
begin
  if p is null then
    return null;
  end if;
  if v_key is null or v_key = '' then
    raise exception 'content_key is unavailable; refusing to store content unencrypted';
  end if;
  return pgp_sym_encrypt(p, v_key);
end;
$$;
revoke all on function public.content_encrypt(text) from public, anon, authenticated;

create or replace function public.content_decrypt(p bytea) returns text
  language plpgsql security definer set search_path = public, extensions as $$
begin
  if p is null then
    return null;
  end if;
  return pgp_sym_decrypt(p, public.app_secret('content_key'));
exception
  when others then
    -- One unreadable row (corruption, or a wrong/rotated key) must not take down the
    -- whole list. Mark just this row; the caller renders it as ordinary text.
    return '[This entry could not be opened]';
end;
$$;
revoke all on function public.content_decrypt(bytea) from public, anon, authenticated;
