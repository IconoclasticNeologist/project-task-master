# The Advocate — Sub-project A: Onboarding & Access — Design Spec

> **Status:** Approved design, ready for implementation plan (`writing-plans`).
> **Date:** 2026-06-21
> **Decomposition:** A (this) → B (hub & survivor screens) → C (session/voice). Each gets its own spec → plan → build.

---

## 1. Context & current state (verified post-pull `84eb81f`)

The Advocate is a trauma-informed PWA where survivors document statements, timeline events, and documents, gated through a trusted advocate (gatekeeper). The Supabase foundation (12 migrations, RLS on every table, `gatekeepers` / `survivors` / `access_codes`) is in place. Since this sub-project was first brainstormed, Lovable pushed a large build that fleshed out every screen.

**What exists now that A must integrate with:**

- **`/` (`src/routes/index.tsx`)** — calm Welcome: "Begin" → `/onboarding`, "I've been here before" → `/home`. No code entry, no auth.
- **`/onboarding` (`src/routes/onboarding.tsx`)** — a 6-step **emotional-preparation** flow (`welcome → feelings → care → aftercare → how → rules`) ending at `/home`. Uses `<Shell hideNav>`, `ProgressDots`, centralized `src/lib/copy`. Its "aftercare" step captures a support person + a calming anchor into the **in-memory** store.
- **`src/lib/data/local-store.ts`** — a module-scoped `Map`, **eval-only**, used because Lovable Cloud's managed preview is disabled. Mirrors eventual Supabase row shapes; swaps to the real `*.functions.ts` later. **Not** part of the auth/identity layer.
- **`src/lib/supabase/client.ts`** — lazy `getSupabase()` against the **live project** `suanbsyewsudlhrrzfks` via `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`. Vanilla `createClient` — auth wires directly to Supabase, no Lovable-managed backend.
- **No auth anywhere.** Nothing calls `signInAnonymously()`; no survivor row is ever created; the access-code → identity link is unbuilt.

**Backend primitives that already exist** (migration `…06_rls_helpers`):
- `verify_access_code(p_code) → uuid` — returns the matching unredeemed/unexpired code's `gatekeeper_id`, else `null`. Pure check (bcrypt `crypt` compare). **Does not** mark redeemed or create a survivor.
- `current_survivor_id()`, `is_gatekeeper_for()`, `set_support_contact()` (encrypted phone via Vault), `mint_access_code()` (gatekeeper-side).
- `survivors` RLS `survivors_self` keys every row to `auth.uid()`; `survivors.gatekeeper_id` is **`NOT NULL`**.

---

## 2. Scope

**A is the access/identity gate** — the missing front door that turns an anonymous visitor into an authenticated survivor with a row, then hands off to the existing emotional onboarding.

**In scope:**
1. The `accessMode` seam (gated default; open as a documented, inert, SME-gated flip).
2. Code entry → `verify_access_code` → `signInAnonymously()` → new `redeem_access_code` RPC → `survivors` row.
3. A minimal post-redeem profile step: **language (EN/ES) + optional name** → survivor row.
4. Routing & guards that insert the gate before the existing `/onboarding` emotional flow.
5. `src/lib/auth/` — the one isolated module the whole thing lives behind.

**Out of scope (explicit):**
- The emotional onboarding itself (exists; A only sequences *in front of* it and supplies identity). **Wiring the emotional flow's aftercare data from `local-store` to Supabase is a later concern (B)**, not A.
- Gatekeeper/advocate UI (minting codes, console). Codes are seeded for testing.
- Email/multi-device recovery; UI i18n translation (we *store* `preferred_language`; translating chrome is separate).
- Home / session / resources / account content (B, C).

---

## 3. The `accessMode` seam — the core architecture decision

Gated and open **converge on the same end state**: an anonymous Supabase session + a `survivors` row. Only the *entry bootstrap* differs, and it lives in **one module** (`src/lib/auth/`). This is a clean abstraction boundary, **not a runtime toggle**.

```
gated:  enter code → verify → signInAnonymously() → redeem_access_code() → survivor (linked to code's gatekeeper)
open:   signInAnonymously() → create_self_serve_survivor() → survivor (linked to a seeded system gatekeeper)
                                          ↓ (both)
                          minimal profile (language + optional name)
                                          ↓
                       existing /onboarding emotional flow → /home
```

### Gated is the locked default — and a safety decision, not a config preference
Gated-through-an-advocate is locked because **the advocate's individualized tech-safety planning is part of the safety model** (the advocate decides it is safe for this survivor to hold this tool, on this device, now). The schema was purpose-built for it (per-invite `access_codes`, `gatekeepers`, RLS by `auth.uid()` — Locked Decision #1, foundation plan).

### Open is documented, inert, and SME-gated — never runtime-switchable
`open` is specified so a future pivot is a *contained code change*, **not** a rewrite. It is **not built live** and **must not ship usable**. Reaching open requires, all together:
1. **SME safety review sign-off** (removing the advocate from the loop changes the threat model — it is a safety decision).
2. Seed one **self-serve system gatekeeper** row (known UUID, **no `auth_user_id`** → inert, can read no one).
3. Add the `create_self_serve_survivor()` RPC (mirrors `redeem_access_code` minus the code).
4. Set `accessMode = "open"` in `src/lib/auth/config.ts` and the welcome CTA routes past `/enter`.

Until all four exist, the build is gated-only. The flag has **no runtime/operator switch** and no UI affordance.

---

## 4. User journey

### Gated (default)
1. Advocate gives the survivor, **out of band**, the app URL + a one-time code.
2. **Welcome (`/`)** — "Begin" → `/enter`. (No code in any URL — manual entry only, so it never lands in history or a shared-device link preview.)
3. **Code entry (`/enter`, step 1)** — survivor types the code → `verify_access_code(code)` on the **anon key, no session** (valid codes only proceed → avoids orphan anon users for bad codes).
4. `signInAnonymously()` → anonymous `auth.users` identity (no email/phone ever).
5. `redeem_access_code(code)` → inserts the `survivors` row (`auth_user_id` = uid, `gatekeeper_id` from the code) **and** marks the code redeemed, atomically → returns survivor id.
6. **Profile (`/enter`, step 2)** — language (EN/ES) + optional "What should we call you?" → saved to the survivor row.
7. → **`/onboarding`** (existing emotional flow) → **`/home`**.

### Open (inert — for documentation only)
`/` "Begin" → silently `ensureAnonymous()` + `create_self_serve_survivor()` in the background → profile → `/onboarding` → `/home`. `/enter` is never shown.

---

## 5. Routes & guarding

| Route | Gated | Open |
|---|---|---|
| `/` Welcome | "Begin" → `/enter` | "Begin" → establishes session silently → `/onboarding` |
| `/enter` (**new**) | code → auth → redeem → profile | not used |
| `/onboarding` | requires a survivor session | public |
| `/home`, `/session`, `/account`, `/settings` | require a survivor session | require a survivor session |

- **Guard:** a `requireSurvivor` resolver (TanStack Router `beforeLoad`, backed by `useSurvivor()`). No survivor row → redirect to `/` (gated) / establish silently (open). Resolves `{ session, survivorId, onboarded }` once.
- **Returning survivor:** anon sessions are device-bound. If the device session + survivor row exist → `/home` works directly ("I've been here before"). If not, the guard bounces them to `/` → `/enter` to re-enter a code.
- **Pre-auth screens** (`/`, `/enter`) use `<Shell hideNav>` — the global "Leave now" (→ weather.gov) and "I need a break" escape stay present; the bottom nav does not (you can't navigate the app before you're in).

---

## 6. Backend — `supabase/migrations/20260621000002_redeem_access_code.sql`

`redeem_access_code(p_code text) returns uuid`, `SECURITY DEFINER`, locked `search_path`:

1. `v_uid := auth.uid()`; `null` → `raise exception 'must be authenticated'`.
2. **Idempotent:** survivor row already exists for `v_uid` → return it (survives double-submit / retry).
3. `SELECT id, gatekeeper_id … FROM access_codes WHERE code_hash = crypt(p_code, code_hash) AND redeemed_by IS NULL AND (expires_at IS NULL OR expires_at > now()) LIMIT 1 FOR UPDATE;` — the **`FOR UPDATE` row lock** prevents a double-redeem race.
4. No match → `raise exception 'invalid or expired code'`.
5. `INSERT INTO survivors (auth_user_id, gatekeeper_id) VALUES (v_uid, v_gatekeeper) RETURNING id` → mark the code `redeemed_by` / `redeemed_at`.
6. Return the new survivor id.

Grants: `grant execute … redeem_access_code TO authenticated;` and ensure `verify_access_code` is `TO anon, authenticated` (callable pre-sign-in). `verify_access_code` is unchanged. `auth.uid()` still reflects the caller's JWT inside a `SECURITY DEFINER` function (standard Supabase pattern).

*Scaling note (flag, not solved):* `crypt()` is bcrypt — O(rows) per verify. Fine at invite scale; revisit (indexable prefix / lookup key) if code volume grows.

**Open-mode artifacts — documented, NOT in this migration:** the self-serve system gatekeeper seed + `create_self_serve_survivor()` ship only at the SME-approved flip.

---

## 7. Frontend — `src/lib/auth/` (the one isolated module)

- **`config.ts`** — `export const accessMode: "gated" | "open" = "gated"` + (open-only, dormant) `SELF_SERVE_GATEKEEPER_ID`. The single place the seam is configured. No runtime switch.
- **`session.ts`** — thin wrappers over `getSupabase()`:
  - `ensureAnonymous()` → `auth.signInAnonymously()` (idempotent if a session exists).
  - `redeemCode(code)` → `verify_access_code` → `ensureAnonymous()` → `redeem_access_code` RPC. **Half-state guard:** if sign-in succeeds but redeem fails (race/network), `signOut()` the anon session so no stuck orphan identity remains.
  - `getSurvivor()`, `signOut()`, `updateProfile({ preferred_language, first_name })`.
  - (open, dormant) `ensureSelfServeSurvivor()`.
- **`useSurvivor.ts`** — React Query hook → current survivor or `null`. Drives guards + screens.
- **`guard.ts`** — `requireSurvivor` `beforeLoad` helper.

**Route changes:** new `src/routes/enter.tsx` (2 in-route steps: CodeEntry → Profile); `index.tsx` CTA wiring reads `accessMode`; guards added to protected routes.

**Reuse only — no new dependencies:** `react-hook-form` + `zod` (forms), shadcn `input`/`button`/`form`/`card`, `sonner` (toasts), existing `copy` module (all strings go through `src/lib/copy` per the language guardrails), `ProgressDots`, `<Shell hideNav>`.

---

## 8. Error handling & safety

- **Bad / expired / already-redeemed code** → one **calm, single-reason** message ("That code didn't work — codes can expire or be one-time. Check with whoever gave it to you."). The survivor never sees which of the three it was; the RPC distinguishes causes only for server logs.
- **Brute-force:** bcrypt compare is already slow; add a client-side throttle after repeated failures. *Flag:* true server-side rate-limiting on `verify_access_code` may need infra — follow-up, not built in A.
- **Half-state:** sign-in-succeeded-but-redeem-failed → sign the anon session back out (see `session.ts`).
- **Network failure** (auth needs connectivity) → calm retry affordance + clear offline message. (SW already `NetworkOnly` for `*.supabase.*`.)
- The "Leave now" / "I need a break" escape is present on every gate screen via `<Shell hideNav>`.

---

## 9. Recovery posture (v1 limitation — stated, not accidental)

Anonymous sessions are **device-bound**. Lose the device / clear storage → session gone. v1 recovery = the **advocate re-issues a code** (human-in-the-loop, consistent with the advocate-in-the-loop safety model). Caveat: re-redeeming currently creates a *new* survivor row (fresh start; prior timeline not auto-restored). Future enhancement (later, gatekeeper-side): advocate re-links an existing survivor to a new session, and/or optional "add a recovery email" in Settings.

---

## 10. Implementation prerequisites

1. **Enable Supabase anonymous sign-ins** — dashboard toggle on project `suanbsyewsudlhrrzfks` (live), and `enable_anonymous_sign_ins = true` under `[auth]` in `supabase/config.toml` for local dev (currently absent). **This is the real blocker — not Lovable Cloud.** The in-memory `local-store` is a separate preview concern and does not gate auth.
2. Apply migration `20260621000002_redeem_access_code.sql` (`bun run db:push`).
3. Seed a known dev access code in `supabase/seed.sql` so onboarding is testable without gatekeeper tooling.
4. Regenerate types (`bun run gen:types`) so the new RPC is typed.

---

## 11. Testing

- **SQL/RPC:** redeem happy path; invalid / expired / already-redeemed (raises); double-redeem race (one wins, via `FOR UPDATE`); idempotent re-call (same survivor); the new survivor reads only its own row (RLS).
- **Frontend:** code-field validation (empty/format); `verify → signin → redeem` orchestration incl. the half-state sign-out (mocked); guard redirects (onboarded → home; no session → `/`); profile save.
- **Manual:** full flow on a seeded code; "Leave now" on every gate screen; offline message; that the existing `/onboarding` emotional flow runs unchanged after the gate.

---

## 12. Open flags (carried, not blocking)

- Server-side rate-limiting on `verify_access_code` (infra).
- Aftercare/profile data from the emotional onboarding → Supabase persistence (belongs to B).
- bcrypt O(rows) verify at scale.
- UI i18n translation (chrome stays EN initially; `preferred_language` is stored and honored by the voice session in C).
- **`onboarded` re-entry short-circuit (deferred to B).** §5 envisaged the guard resolving `onboarded` and routing onboarded→home, but A ships no onboarding-completion marker, so re-tapping "Begin" replays the gate + emotional onboarding. Harmless (idempotent `redeem_access_code` returns the same survivor; no data loss), but B should add a completion flag (e.g. `survivors.onboarded_at`) and short-circuit a returning, onboarded survivor straight to `/home`.
- **`useSurvivor` cache invalidation (for B).** Nothing invalidates the `["survivor"]` query after `redeemCode`/`updateProfile` (5-min `staleTime`). A is unaffected because the guard reads `getSurvivor` directly (bypassing the cache), but when B wires screens to `useSurvivor`, invalidate `["survivor"]` on those mutations to avoid stale `null`/old data.
- **Code case-sensitivity (UX).** Access codes are bcrypt-compared exactly (case-sensitive). `/enter` shows a calm "type it exactly as given" hint, but if usability data shows codes failing on case, normalize consistently across mint + `verify` + `redeem` (a cross-cutting decision, not a client-only change).
