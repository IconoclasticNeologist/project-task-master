# The Advocate — Foundation Build Implementation Plan

> **For agentic workers:** This plan was authored with the superpowers:writing-plans skill. It builds the FOUNDATION only — no AI agents, no voice, no persona logic, no auth UI, no survivor-facing screen content. Two independent lanes: Part A (PWA infrastructure) and Part B (Supabase schema + RAG scaffold). Do not disturb the existing UI scaffold.

**Goal:** Add an installable, offline-capable PWA layer and a fully RLS-protected Supabase schema + RAG scaffold to the existing Lovable-scaffolded TanStack Start app, without touching the calm UI baseline.

**Architecture:** PWA is delivered via a hand-authored manifest + a **post-build Workbox `generateSW`** step (because `tanstackStart()` preempts `vite-plugin-pwa`/Serwist in-build SW generation — verified, TanStack/router #4988), with a **prerendered `/offline` static route** as the navigation fallback so the installed app opens instantly offline with no white flash. Backend is a two-layer Supabase model — structured domain tables (source of truth) feeding a single `pgvector` embeddings table — with RLS on every table from the first migration, pgcrypto column encryption for the support-contact phone (key in Supabase Vault), and HNSW vector indexing.

**Tech Stack:** TanStack Start 1.167 (Nitro 3 → Cloudflare Workers), React 19, TypeScript 5.8, Vite 8, Tailwind v4 (CSS-first), shadcn/ui, Bun (24h supply-chain guard), Supabase (Postgres 15+, pgvector, pgcrypto, Vault, Storage), Workbox 7.

---

## Locked decisions (from approval)

1. **Access codes:** separate `access_codes` table (`code_hash`, `expires_at`, `redeemed_by`) — per-invite model. Overrides hash-on-gatekeepers.
2. **Embedding dimension:** `vector(1536)` placeholder. Prominent comment: final model must be confirmed for **multilingual quality (English + Spanish now, more later)** before real data exists — changing dims after embeddings populate means re-embedding. Flag, don't solve.
3. **Offline behavior:** calm offline screen only (no full-app offline boot — no offline-capable screens exist yet).
4. **Encryption key:** pgcrypto + Supabase Vault, crypto stays server-side.

**Other:** wire only the client anon key; commented service-role placeholder in `.dev.vars` (gitignored, confirmed line 21). Add `auth_user_id` links + RLS helper fns now (schema only, no auth UI). If `bun install` skips a version on the supply-chain guard, stop and ask before editing `minimumReleaseAgeExcludes`.

---

## Verification that shaped the PWA path

- `vite-plugin-pwa` 1.3.0 (May 2026) added Vite 8 peer support — but its SW build step does **not run** under `tanstackStart()` production builds (TanStack/router #4988, still open; PR #786 doesn't fix it). Same for Serwist's standard plugin after v1.121.
- Working pattern (TanStack/router discussion #4770): generate the SW **after** `vite build`. This project is **Nitro 3 → client output `.output/public`**.
- Offline shell under SSR: `tanstackStart({ prerender, pages })` prerenders a static route; Cloudflare officially supports TanStack Start prerendering (changelog 2025-12-19).
- **Decision:** drop `vite-plugin-pwa` entirely; hand-authored manifest + post-build Workbox `generateSW` + prerendered `/offline`. Decoupled from the Lovable/TanStack build lifecycle and the caching policy lives in one auditable file.

---

## Part A — PWA infrastructure

**Files**
- Create: `public/manifest.webmanifest`, `public/icons/icon.svg`, `public/icons/README.md`, `public/icons/{icon,maskable}-{192,512}.png`, `public/icons/apple-touch-icon-180.png`
- Create: `scripts/gen-icons.mjs` (zero-dep PNG placeholder generator), `scripts/build-sw.mjs` (Workbox generateSW)
- Create: `public/offline.html` (self-contained static offline shell), `src/pwa/registerSW.ts`, `src/pwa/usePwaInstall.ts`, `src/pwa/useDisplayMode.ts`, `src/components/InstallPrompt.tsx`
- Modify: `src/routes/__root.tsx` (manifest/theme/iOS `<head>`, mount `<InstallPrompt/>`, call `registerSW()`), `package.json` (build runs SW step; add `workbox-build` dev dep)

> Implementation note (deviation from the original plan): prerendering an `/offline` route via `tanstackStart.pages` fails on this stack — the TanStack Start prerenderer spins up a Node preview server expecting `dist/server/server.js`, which the Cloudflare `cloudflare-module` preset does not emit, so the prerender 500s. Pivoted to a static `public/offline.html` (Vite copies it verbatim). Same outcome (calm, instant offline open), more robust, and a better fit for decision #3. The client output dir is `dist/client` in the Lovable/Cloudflare sandbox build, which `scripts/build-sw.mjs` auto-detects.

**Service worker policy (the one auditable file, `scripts/build-sw.mjs`):**
- Precache app shell + hashed JS/CSS + static `offline.html` (glob the detected client dir, e.g. `dist/client`).
- `navigateFallback` → `/offline.html` (the static shell).
- **NetworkOnly** for `*.supabase.{co,in}` — survivor data is never cached. `navigateFallbackDenylist: [/^\/api\//]`.
- `StaleWhileRevalidate` for images/fonts. `skipWaiting + clientsClaim` (autoUpdate).

**Registration:** browser-guarded, production-only (`import.meta.env.DEV` short-circuits), `controllerchange` → one reload. **Install affordance:** capture `beforeinstallprompt`, minimal dismissible card; code comment + UI note that iOS Safari never fires it (Share → Add to Home Screen), placeholder for iOS instructions. **Standalone detection** exposed as `useStandalone()`.

**🚩 Manual iOS verification (cannot be checked here):** install, offline open, standalone display, apple-touch-icon — must be tested on a real iPhone.

**Verification:** `bun run build` → assert `.output/public/sw.js` exists and precaches the offline page; `bun run preview` → DevTools Application shows SW active + valid manifest; Lighthouse "installable" passes.

---

## Part B — Supabase schema + RAG scaffold

**Files**
- Create: `supabase/config.toml`, `supabase/seed.sql`, `supabase/migrations/2026062000000{1..12}_*.sql`
- Create: `src/lib/supabase/client.ts` (lazy `getSupabase()`), `src/lib/supabase/types.ts` (placeholder), `.env.example`, `.env.local` (placeholders), `.dev.vars`
- Modify: `package.json` (add `@supabase/supabase-js`; `db:push` / `db:reset` / `gen:types` scripts)

**Migrations (ordered; RLS enabled in the same migration that creates each table):**

| # | File | Responsibility |
|---|---|---|
| 01 | `extensions` | `vector`, `pgcrypto` in `extensions` schema |
| 02 | `enums_and_triggers` | enums; `set_updated_at()`; `app_secret()` (Vault reader) |
| 03 | `gatekeepers` | gatekeepers + self-RLS |
| 04 | `survivors` | survivors (encrypted phone bytea, auth link) + RLS |
| 05 | `access_codes` | per-invite codes (bcrypt hash, expiry, redeemed_by) + RLS |
| 06 | `rls_helpers` | `current_survivor_id()`, `current_gatekeeper_id()`, `is_gatekeeper_for()`; phone set/get RPCs; access-code mint/verify |
| 07 | `statements` | narrative fragments + visibility + RLS |
| 08 | `documents` | metadata + private Storage bucket + storage RLS |
| 09 | `timeline_events` | dates + relative ordering + provenance + RLS |
| 10 | `flags` | polymorphic legal-partner flags + RLS |
| 11 | `content_revisions` | edit-history table + capture triggers + RLS (survivor-only read) |
| 12 | `embeddings` | pgvector(1536) + HNSW + RLS |

Full SQL is canonical in the migration files. Key shapes:

**Identity helpers (RLS, `SECURITY DEFINER STABLE`, locked search_path):** map `auth.uid()` → survivor/gatekeeper. `is_gatekeeper_for(sid)` joins survivors→gatekeepers.

**RLS pattern (every domain table):** survivor has full access to own rows (`survivor_id = current_survivor_id()`); gatekeeper has `select` only on `shareable` rows for survivors they granted (`is_gatekeeper_for(survivor_id)`). `flags`: gatekeeper full, survivor read-only. `embeddings`/`content_revisions`: survivor-only (server-side RAG/export uses the service role, which bypasses RLS).

**Encryption:** `survivors.support_contact_phone_enc bytea`, written/read only via `SECURITY DEFINER` RPCs that pull the key from Vault (`app_secret('support_contact_key')`) and `pgp_sym_encrypt/decrypt`. The `bytea` shape is exactly what a future client-side-encryption envelope needs — no schema rewrite for E2E later.

**Vector index — HNSW** (`vector_cosine_ops`, m=16, ef_construction=64): incremental inserts (survivors add statements over time), no training step, better recall on small/growing tables than ivfflat. Cosine fits normalized text embeddings.

**Versioning:** single generic `content_revisions` table; `BEFORE UPDATE` triggers snapshot the OLD row to `jsonb`. Embeddings are (re)built from **current** rows only, so redacted text leaves the AI substrate while history is preserved. Survivor-only read by default; the legal-partner "see changes" view is a deliberate later export feature.

**No-PII-to-model boundary:** `embeddings` holds only `survivor_id` (uuid), the survivor's own chunk text, language, metadata — no name/contact columns. Comment marks that the future context-assembler sends at most `first_name`.

**Setup (you run the interactive bits):** `supabase login` → `supabase link --project-ref <ref>` → create the Vault secret `support_contact_key` → `bun run db:push` → `bun run gen:types`.

**Verification:** `db push` applies cleanly; RLS proof queries (survivor A sees zero of survivor B's rows; gatekeeper sees only shareable; `support_contact_phone_enc` unreadable without the RPC).

---

## Self-review notes

- Spec coverage: PWA (manifest/SW/install/standalone/offline) ✓; all six domain tables + embeddings ✓; RLS every table ✓; encryption ✓; access-code hashing ✓; private bucket ✓; versioning ✓; visibility ✓; HNSW reasoning ✓.
- Forward-reference safety: helpers defined in migration 06 (after gatekeepers/survivors exist); SQL-language helpers never reference not-yet-created tables; plpgsql RPCs defer name resolution to runtime.
- Out of scope held: no agents, voice, personas, auth UI, or screen content.
