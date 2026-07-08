# The Advocate — Deploy & Go-Live Checklist

This is the single runbook to take the built app live and demo it. It assumes you're the dev,
on this machine, with the Supabase CLI already logged in and the project linked
(`suanbsyewsudlhrrzfks`, "project-task-master").

> **What's built (all on `main`):** advocate-gated onboarding + anonymous auth · statements / timeline /
> documents / settings persistence (Supabase + RLS) · voice session (Gemini Live) · the non-voice agent
> layer (legal-language drafts, "search your words," and the reflect specialists). Three Supabase Edge
> Functions and six+ migrations need to be applied to your live project. The AI agent prompts and crisis
> resources are **safe-by-construction placeholders pending SME sign-off** — see the gate at the bottom.

---

## ⛔ Read first: the hard gate before any REAL survivor uses this

Demoing to yourself / your team is fine now. **Before a real survivor touches it**, you MUST complete
`docs/sme-research-needed.md`:

- **Recognition / reframer / interviewer** agent prompts → trauma-therapist + attorney sign-off (exact
  permitted/forbidden wording; the recognition direct-ask refusal; **the reframer survivor-visible vs
  advocate-only decision**; FRE 412).
- **Coach voice prompts + guardrails** (`supabase/functions/advocate-voice-token/index.ts`,
  `src/lib/voice/guardrails.ts`) → trauma-therapist + attorney.
- **Witness Stand practice** — consent-gate wording, the Defense question rules (voice prompt in
  `advocate-voice-token`, avatar shim prompt in `advocate-defense-llm`), and **whether a visible
  practice person (avatar) is appropriate at all** → trauma-therapist + attorney
  (see the graduated-exposure entry in `docs/sme-research-needed.md`).
- ~~Real crisis-hotline numbers~~ ✅ shipped 2026-06-23 (`copy.resources` — verified US national
  hotlines; localize per jurisdiction before launch).

Everything below is safe to run for a dev/demo build; none of it ships vetted survivor-facing content by itself.

---

## 1. Enable anonymous sign-ins (the auth foundation)

The whole gate runs on Supabase anonymous auth. It's **off** by default.

- **Live:** Dashboard → **Authentication → Sign In / Providers → Anonymous sign-ins → Enable**
  (https://supabase.com/dashboard/project/suanbsyewsudlhrrzfks/auth/providers).
- **Local (only if you run a local stack):** add under `[auth]` in `supabase/config.toml`:
  ```toml
  enable_anonymous_sign_ins = true
  ```
- **⚠️ Also disable CAPTCHA / bot protection** — otherwise anonymous sign-in is rejected at runtime
  with `400 captcha_failed`, which surfaces as the gate's calm _"that code didn't work"_ message **even
  when the access code is valid**. Dashboard → **Authentication → Attack Protection → "Enable Captcha
  protection" → OFF** → Save
  (https://supabase.com/dashboard/project/suanbsyewsudlhrrzfks/auth/protection). _(For production you
  can instead keep CAPTCHA on and pass a `captchaToken` to `signInAnonymously()` — desirable, since it
  blunts brute-forcing of access codes.)_

_(Safe: a survivor row is only ever created after a valid access code is verified — see A's design.)_

---

## 2. Apply the database migrations

Applies everything from the foundation through the agent layer. Prompts for your DB password.

```bash
bun run db:push        # = bunx supabase db push
bun run gen:types      # re-sync src/lib/supabase/types.ts from the live schema
```

Migrations this brings in (beyond the foundation `20260620*`):

- `20260621000001_voice_session_counters` — voice daily-cap counter
- `20260621000002_redeem_access_code` — the gated-onboarding RPC
- `20260621000003_survivor_settings_and_timeline_anchor` — settings/aftercare cols + timeline `relative_anchor`
- `20260621000004_documents_note` — per-document note
- `20260622000001_match_embeddings` — survivor-scoped RAG search RPC + embeddings unique index

> If `db push` reports drift (Lovable may have applied something out-of-band), reconcile before forcing.

---

## 3. Deploy the Edge Functions + set the secret

Three functions; all use one Gemini key.

```bash
# Set the shared secret once (skip if already set for voice):
bunx supabase secrets set GEMINI_API_KEY=<your-google-generative-language-api-key>

# Optional model overrides (sensible defaults baked in):
#   advocate-agent text model  → GEMINI_TEXT_MODEL  (default: gemini-2.5-flash)
#   advocate-rag embed model   → GEMINI_EMBED_MODEL (default: gemini-embedding-001, 1536-dim)
#   voice daily cap            → DAILY_VOICE_SESSION_CAP (default: 200)

# Deploy all three:
bunx supabase functions deploy advocate-voice-token
bunx supabase functions deploy advocate-agent
bunx supabase functions deploy advocate-rag
```

### 3b. The practice person (HeyGen LiveAvatar) — optional, Witness Stand only

Two more functions power the on-screen practice person. Without their secrets the app quietly
falls back to the voice-only practice path, so this section can be done last.

```bash
# Deploy (note --no-verify-jwt on the shim — LiveAvatar's servers call it with
# a shared bearer secret, not a Supabase JWT; the bearer check is the gate):
bunx supabase functions deploy advocate-avatar-session
bunx supabase functions deploy advocate-defense-llm --no-verify-jwt
```

**One-time LiveAvatar setup — one paste, no terminal.** Get your API key from
app.liveavatar.com → Developers, then add these in the **Supabase Dashboard →
Edge Functions → Secrets**
(https://supabase.com/dashboard/project/suanbsyewsudlhrrzfks/functions/secrets):

| Secret                 | Value                                                                        |
| ---------------------- | ---------------------------------------------------------------------------- |
| `LIVEAVATAR_API_KEY`   | your LiveAvatar API key (**required — the only one setup needs**)            |
| `LIVEAVATAR_SANDBOX`   | `true` while rehearsing (free, watermarked) — set `false` for the judged run |
| `LIVEAVATAR_AVATAR_ID` | _(optional)_ a courtroom-plausible avatar id from their gallery              |

Everything else self-provisions on the first practice session: the functions
derive the shim's bearer secret from the API key, register it with LiveAvatar,
and create the `advocate-defense` LLM configuration automatically
(`supabase/functions/_shared/liveavatar.ts`). If you ever rotate the API key,
delete the `advocate-defense` LLM configuration at app.liveavatar.com so it
re-registers itself.

What each function does:

- **`advocate-avatar-session`** — mints the LiveAvatar FULL-mode session token (API key never
  reaches the browser) and self-provisions the RAG-lock LLM config. Refuses (503 → voice-only
  fallback) if that config can't be resolved — the avatar is never allowed to run on LiveAvatar's
  default general-purpose LLM.
- **`advocate-defense-llm`** — the OpenAI-compatible shim that IS the practice person's brain:
  our Defense practice prompt + the person's shareable-only statements, Gemini underneath.

> 💳 **Credits:** FULL mode costs 2 credits/min; the free tier is 10 credits/month. Rehearse in
> sandbox mode (free, watermarked) and budget ~6–8 credits for the judged run. Ambassador credits
> or the Essential plan cover deeper rehearsal.

What each does:

- **`advocate-voice-token`** — mints the ephemeral Gemini Live token for the voice session (key never reaches the browser).
- **`advocate-agent`** — text agents: `translator` (legal-language drafts) + the N3 placeholders (`reframer`/`recognition`/`interviewer`). JWT-gated.
- **`advocate-rag`** — embeds + searches the survivor's own words (`gemini-embedding-001` @ 1536), JWT-scoped so a survivor only ever touches their own vectors.

> ✅ **Cost caps (shipped 2026-07-07):** `advocate-agent` and `advocate-rag` now enforce per-user +
> global daily caps via `bump_usage` (migration `20260707000001_usage_caps`); voice/avatar gained a
> per-user cap on top of the existing global `DAILY_VOICE_SESSION_CAP`; `advocate-defense-llm` has a
> per-isolate rate limit. Tune with the `*_DAILY_CAP_*` secrets (see `.env.example`). Over-cap requests
> return a calm 429. The caps no-op safely until the migration is applied, so apply it before real traffic.

---

## 4. Seed a dev access code

`db push` does **not** run `supabase/seed.sql`. Create a code directly (Dashboard → SQL Editor):

```sql
insert into public.gatekeepers (id, role, org_name)
values ('00000000-0000-0000-0000-0000000000aa','advocate','DEV')
on conflict (id) do nothing;

insert into public.access_codes (gatekeeper_id, code_hash, label)
select '00000000-0000-0000-0000-0000000000aa',
       extensions.crypt('DEV-CALM-PATH', extensions.gen_salt('bf')), 'dev'
where not exists (select 1 from public.access_codes where label='dev');
```

Your dev code is then **`DEV-CALM-PATH`**. _(In production, real codes are minted by a gatekeeper via the
`mint_access_code` RPC — the gatekeeper-facing UI for that is not built yet.)_

---

## 5. Run the app

```bash
bun run dev                      # dev server → http://localhost:8080
# production build (note the sandbox flag + post-build service worker step):
LOVABLE_SANDBOX=1 bun run build  # runs vite build + scripts/build-sw.mjs
```

`.env.local` must hold `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (already set for the live project).

---

## 6. Smoke test (the live end-to-end walkthrough)

1. **Gate:** `/` → **Begin** → `/enter` → enter `DEV-CALM-PATH` → pick language + (optional) name → lands in the emotional onboarding → `/home`. Re-opening "Begin" after finishing onboarding skips to `/home`.
2. **Persistence:** `/account` → add a statement → **refresh** → it persists. Edit/delete. Add a timeline entry (try a date like `2026-01` and a relative phrase like "after the move"). Upload a document → **View** (signed URL) → delete. Change **Settings** (language / default visibility / care plan) → refresh → persists.
3. **Agents:** on a statement, **"Make a legal-language draft."** Use **"Search your words."** Open the **Reflect** panel (Reframe / Recognize / Gentle prompt) — note the `PlaceholderTag` + "reviewed wording coming" framing.
4. **Voice:** `/session` → start → allow mic → confirm the orb/stop/"I need a break"/Leave-now affordances; type-mode works too.
5. **DB side-effects (SQL editor):** a `survivors` row exists; the code shows `redeemed_by`/`redeemed_at`; statements/timeline/documents rows are present; `embeddings` rows appear after you add statements.

---

## 7. Before launch — the checklist that isn't code

- [ ] `docs/sme-research-needed.md` fully signed off (trauma therapist + attorney); placeholder prompts replaced with vetted wording; the **reframer survivor-visible-vs-advocate-only** decision made.
- [ ] Real, verified crisis-hotline data in the Resources screen.
- [x] Daily cost caps on `advocate-agent` + `advocate-rag` — shipped (`20260707000001_usage_caps`; see §3).
- [ ] Apply the 2026-07 hardening migrations before real traffic: `20260707000001_usage_caps`,
      `20260707000002_encryption_robustness`, `20260707000003_account_lifecycle`,
      `20260707000004_knowledge_review`. Run `bun run db:push` then `bun run gen:types`.
- [ ] Add an **Approve** control to the expert/knowledge UI so a second professional can call the new
      `advocate-knowledge` `approve` action — knowledge now reaches agents only after two-person review.
- [ ] iOS PWA install / offline shell verified on a real device (per the foundation plan's manual checks).
- [ ] Gatekeeper-facing flow for minting access codes (currently codes are seeded/minted by hand).

---

## Reference

- Designs/plans: `docs/superpowers/specs/` and `docs/superpowers/plans/` (dated `2026-06-2*`).
- SME handoff: `docs/sme-research-needed.md`.
- Agent runtime prompts (canonical): `supabase/functions/advocate-agent/index.ts` (text), `advocate-voice-token/index.ts` (voice).
