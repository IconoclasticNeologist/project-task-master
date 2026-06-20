-- ─────────────────────────────────────────────────────────────────────────────
-- RLS + encryption regression guard for The Advocate.
--
-- Run:   supabase test db        (requires the local Supabase stack / Docker)
-- pgTAP must be available; this file enables it if needed.
--
-- Proves:
--   • a survivor cannot read another survivor's statements/documents/timeline/flags
--   • a gatekeeper sees ONLY `shareable` content for survivors they granted, nothing else
--   • support_contact_phone_enc is ciphertext at rest and only the identity-gated
--     decrypt RPC returns plaintext
--
-- Self-contained: creates its own fixtures and rolls everything back. Re-runnable
-- after future migrations as a standing regression guard.
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists pgtap with schema extensions;

begin;
set local search_path = public, extensions, pg_temp;
select * from no_plan();

-- ── Helper: run a query as a given authenticated user (RLS enforced) ──
-- Switches to the non-superuser `authenticated` role with the user's JWT claim, runs
-- the query, then resets. Only the inner query runs under RLS; pgTAP assertions stay
-- on the superuser session.
create function pg_temp.count_as(p_uid uuid, p_sql text) returns bigint
  language plpgsql as $$
declare n bigint;
begin
  perform set_config('request.jwt.claims',
                     json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  set local role authenticated;
  execute p_sql into n;
  reset role;
  return n;
end;
$$;

-- ── Fixtures (created as the superuser test role; RLS is bypassed for setup) ──
insert into auth.users (instance_id, id, aud, role, email, created_at, updated_at) values
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'a@test.dev',  now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'b0000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'b@test.dev',  now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'g1@test.dev', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'g2@test.dev', now(), now());

insert into public.gatekeepers (id, auth_user_id, role) values
  ('10000000-0000-0000-0000-0000000000c1', '10000000-0000-0000-0000-000000000001', 'advocate'),
  ('20000000-0000-0000-0000-0000000000c2', '20000000-0000-0000-0000-000000000001', 'attorney');

insert into public.survivors (id, auth_user_id, gatekeeper_id, first_name) values
  ('a0000000-0000-0000-0000-0000000000aa', 'a0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-0000000000c1', 'A'),
  ('b0000000-0000-0000-0000-0000000000bb', 'b0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-0000000000c2', 'B');

insert into public.statements (survivor_id, raw_text, visibility) values
  ('a0000000-0000-0000-0000-0000000000aa', 'A shareable', 'shareable'),
  ('a0000000-0000-0000-0000-0000000000aa', 'A private',   'private'),
  ('b0000000-0000-0000-0000-0000000000bb', 'B shareable', 'shareable');

insert into public.documents (survivor_id, storage_path, visibility) values
  ('a0000000-0000-0000-0000-0000000000aa', 'a0000000-0000-0000-0000-0000000000aa/doc1.pdf', 'shareable'),
  ('a0000000-0000-0000-0000-0000000000aa', 'a0000000-0000-0000-0000-0000000000aa/doc2.pdf', 'private');

insert into public.timeline_events (survivor_id, title, visibility) values
  ('a0000000-0000-0000-0000-0000000000aa', 'A event shareable', 'shareable'),
  ('a0000000-0000-0000-0000-0000000000aa', 'A event private',   'private'),
  ('b0000000-0000-0000-0000-0000000000bb', 'B event shareable', 'shareable');

insert into public.flags (survivor_id, flag_type, note) values
  ('a0000000-0000-0000-0000-0000000000aa', 'gap',   'needs detail'),
  ('b0000000-0000-0000-0000-0000000000bb', 'other', 'B flag');

-- ── Survivor isolation: A sees only their own rows ──
select is(pg_temp.count_as('a0000000-0000-0000-0000-000000000001', 'select count(*) from public.statements'),
          2::bigint, 'survivor A sees only their 2 statements');
select is(pg_temp.count_as('a0000000-0000-0000-0000-000000000001', 'select count(*) from public.statements where survivor_id = ''b0000000-0000-0000-0000-0000000000bb'''),
          0::bigint, 'survivor A cannot read B''s statements');
select is(pg_temp.count_as('a0000000-0000-0000-0000-000000000001', 'select count(*) from public.documents'),
          2::bigint, 'survivor A sees only their 2 documents');
select is(pg_temp.count_as('a0000000-0000-0000-0000-000000000001', 'select count(*) from public.documents where survivor_id = ''b0000000-0000-0000-0000-0000000000bb'''),
          0::bigint, 'survivor A cannot read B''s documents');
select is(pg_temp.count_as('a0000000-0000-0000-0000-000000000001', 'select count(*) from public.timeline_events'),
          2::bigint, 'survivor A sees only their 2 timeline events');
select is(pg_temp.count_as('a0000000-0000-0000-0000-000000000001', 'select count(*) from public.flags'),
          1::bigint, 'survivor A sees flags on their own account');
select is(pg_temp.count_as('a0000000-0000-0000-0000-000000000001', 'select count(*) from public.timeline_events where survivor_id = ''b0000000-0000-0000-0000-0000000000bb'''),
          0::bigint, 'survivor A cannot read B''s timeline events');
select is(pg_temp.count_as('a0000000-0000-0000-0000-000000000001', 'select count(*) from public.flags where survivor_id = ''b0000000-0000-0000-0000-0000000000bb'''),
          0::bigint, 'survivor A cannot read B''s flags');

-- ── Survivor isolation: B sees only their own rows ──
select is(pg_temp.count_as('b0000000-0000-0000-0000-000000000001', 'select count(*) from public.statements'),
          1::bigint, 'survivor B sees only their statement');
select is(pg_temp.count_as('b0000000-0000-0000-0000-000000000001', 'select count(*) from public.statements where survivor_id = ''a0000000-0000-0000-0000-0000000000aa'''),
          0::bigint, 'survivor B cannot read A''s statements');

-- ── Gatekeeper G1 (granted A): only A's SHAREABLE content, nothing private, nothing of B ──
select is(pg_temp.count_as('10000000-0000-0000-0000-000000000001', 'select count(*) from public.statements'),
          1::bigint, 'gatekeeper G1 sees only A''s shareable statement');
select is(pg_temp.count_as('10000000-0000-0000-0000-000000000001', 'select count(*) from public.statements where visibility = ''private'''),
          0::bigint, 'gatekeeper G1 cannot see private statements');
select is(pg_temp.count_as('10000000-0000-0000-0000-000000000001', 'select count(*) from public.statements where survivor_id = ''b0000000-0000-0000-0000-0000000000bb'''),
          0::bigint, 'gatekeeper G1 cannot see B''s statements');
select is(pg_temp.count_as('10000000-0000-0000-0000-000000000001', 'select count(*) from public.documents'),
          1::bigint, 'gatekeeper G1 sees only A''s shareable document');
select is(pg_temp.count_as('10000000-0000-0000-0000-000000000001', 'select count(*) from public.timeline_events'),
          1::bigint, 'gatekeeper G1 sees only A''s shareable timeline event');
select is(pg_temp.count_as('10000000-0000-0000-0000-000000000001', 'select count(*) from public.survivors'),
          1::bigint, 'gatekeeper G1 sees only survivor A');
select is(pg_temp.count_as('10000000-0000-0000-0000-000000000001', 'select count(*) from public.survivors where id = ''b0000000-0000-0000-0000-0000000000bb'''),
          0::bigint, 'gatekeeper G1 cannot see survivor B');

-- ── Gatekeeper G2 (granted B): only B's shareable, nothing of A ──
select is(pg_temp.count_as('20000000-0000-0000-0000-000000000001', 'select count(*) from public.statements'),
          1::bigint, 'gatekeeper G2 sees only B''s shareable statement');
select is(pg_temp.count_as('20000000-0000-0000-0000-000000000001', 'select count(*) from public.statements where survivor_id = ''a0000000-0000-0000-0000-0000000000aa'''),
          0::bigint, 'gatekeeper G2 cannot see A''s statements');

-- ── Encryption at rest ──
select col_type_is('public', 'survivors', 'support_contact_phone_enc', 'bytea',
                   'support_contact_phone_enc is stored as bytea (ciphertext at rest)');
select is((select prosecdef from pg_proc where proname = 'get_support_contact' and pronamespace = 'public'::regnamespace),
          true, 'get_support_contact is SECURITY DEFINER');
select is((select prosecdef from pg_proc where proname = 'set_support_contact' and pronamespace = 'public'::regnamespace),
          true, 'set_support_contact is SECURITY DEFINER');

-- a survivor cannot decrypt another survivor's support contact (identity gate)
select set_config('request.jwt.claims',
                  json_build_object('sub', 'a0000000-0000-0000-0000-000000000001')::text, true);
select throws_ok(
  $$ select public.get_support_contact('b0000000-0000-0000-0000-0000000000bb'::uuid) $$,
  'not authorized',
  'survivor A cannot decrypt B''s support contact');
select set_config('request.jwt.claims', '', true);

-- full round-trip (only when the Vault key exists; skipped cleanly otherwise)
create function pg_temp.enc_roundtrip_ok() returns boolean language plpgsql as $$
declare v_enc bytea; v_dec text;
begin
  perform set_config('request.jwt.claims',
                     json_build_object('sub', 'a0000000-0000-0000-0000-000000000001')::text, true);
  perform public.set_support_contact('a0000000-0000-0000-0000-0000000000aa', 'Aunt May', '555-0100');
  select support_contact_phone_enc into v_enc from public.survivors
    where id = 'a0000000-0000-0000-0000-0000000000aa';
  select phone into v_dec from public.get_support_contact('a0000000-0000-0000-0000-0000000000aa');
  return v_enc is not null
     and v_enc <> convert_to('555-0100', 'utf8')  -- stored bytes are NOT the plaintext
     and v_dec = '555-0100';                       -- RPC decrypts correctly
end;
$$;

select case
  when public.app_secret('support_contact_key') is null
    then pass('(skipped) Vault secret support_contact_key not set — set it to test the encryption round-trip')
    else ok(pg_temp.enc_roundtrip_ok(),
            'support_contact_phone_enc is ciphertext at rest; get_support_contact decrypts to plaintext')
end;

select * from finish();
rollback;
