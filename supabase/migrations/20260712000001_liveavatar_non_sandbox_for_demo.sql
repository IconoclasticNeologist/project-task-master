-- Restore full-length Witness Stand practice.
--
-- Sandbox LiveAvatar sessions are capped upstream (~60s), which shrank the
-- visible practice timer to under a minute while the consent screen promises
-- "8 minutes at most". The /dev dashboard's stored avatar config OVERRIDES the
-- LIVEAVATAR_SANDBOX env secret (supabase/functions/_shared/agentConfig.ts:
-- `ops.avatar.id ? ops.avatar.sandbox : env`), so the stored row must carry
-- the change; the env secret has been set to "false" as well for the
-- fresh-database fallback path.
--
-- No-op when no dashboard avatar row exists.
update public.agent_config
   set value = jsonb_set(value, '{sandbox}', 'false'::jsonb),
       updated_at = now()
 where key = 'avatar'
   and (value ->> 'sandbox') is distinct from 'false';
