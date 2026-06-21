-- DEV SEED — local / preview ONLY. A dev gatekeeper + a known access code so the
-- onboarding gate is testable without the (later) gatekeeper provisioning UI.
-- Production codes are minted via mint_access_code(); never depend on this seed in prod.

insert into public.gatekeepers (id, role, org_name)
values ('00000000-0000-0000-0000-0000000000aa', 'advocate', 'DEV — local only')
on conflict (id) do nothing;

insert into public.access_codes (gatekeeper_id, code_hash, label)
select
  '00000000-0000-0000-0000-0000000000aa',
  extensions.crypt('DEV-CALM-PATH', extensions.gen_salt('bf')),
  'dev seed — DEV-CALM-PATH'
where not exists (
  select 1 from public.access_codes where label = 'dev seed — DEV-CALM-PATH'
);
