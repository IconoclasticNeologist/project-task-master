# Supabase — The Advocate

Version-controlled backend. **RLS is enabled on every table.**

## Layout
- `migrations/` — ordered SQL migrations (the source of truth).
- `tests/` — pgTAP RLS + encryption regression guard (`supabase test db`, needs the local stack / Docker).
- `config.toml` — local CLI config.

## Applying migrations
- **Automatic:** on push to `main`, the Supabase GitHub integration ("Deploy to production") applies any pending migrations to the linked project.
- **Manual:** `bun run db:push` (after `supabase login` + `supabase link`; prompts for the database password).

Then `bun run gen:types` regenerates `src/lib/supabase/types.ts`.

## Encryption
`survivors.support_contact_phone_enc` is encrypted at rest via pgcrypto using a key stored in
Supabase Vault under the name `support_contact_key`. Create it once before the phone RPCs are used:

    select vault.create_secret('<32-byte base64>', 'support_contact_key');
