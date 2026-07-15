# Recovery Words + "Your Space Lives Here" — Design

**Date:** 2026-07-14 (late)
**Status:** Direction approved in conversation ("ill go with your recommends").
**Context:** An anonymous space survives many sessions on one device, but device
loss/switch/clearing (and iOS 7-day storage eviction for non-installed tabs)
loses it permanently — no email means no recovery. Decision: add an opt-in,
identity-free way back in, plus honest install education. Advocate-held
recovery deferred.

## What ships

1. **Recovery words (opt-in).** In Settings, a person can create six simple
   words, shown once ("keep them somewhere safe — they are the only way back
   in"). On any device, "I have recovery words" on the welcome page reconnects
   their space. Replacing or removing the words is always available. Recovering
   moves the space to the new device's key: the old device no longer opens it
   (a safety property — a lost phone stops being a door once you recover).
2. **Honest install education.** The install prompt says plainly that the
   space lives in this browser and that adding to the home screen protects it
   (and defeats iOS tab-storage eviction). Its strings move into the copy
   layer and gain Spanish.

## Mechanics

- **Phrase:** 6 words drawn with `crypto.getRandomValues` from a curated
  256-word list (simple, concrete, trauma-neutral English; 48 bits). Client
  normalizes (lowercase, single spaces) and sends only `SHA-256(phrase)`.
- **Server:** `survivors.recovery_hash` stores `bf-crypt(sha256hex)`;
  `recovery_set_at` timestamps it. RPCs (SECURITY DEFINER, `authenticated`):
  - `app_set_recovery_words(p_hash)` — set, or clear when null; returns set_at.
  - `app_recovery_status()` — returns set_at (drives Settings UI).
  - `app_recover_space(p_hash)` — rate-limited (5/hour per auth uid via
    `recovery_attempts`, RLS deny-all); refuses if this uid already owns a
    space; on match re-points `survivors.auth_user_id` to the caller
    (content follows atomically — everything keys off `survivors.id`).
  - 48-bit phrase + bcrypt + 5/hour ≈ brute-force horizon of billions of years.
- **Recover flow:** `/recover` (public): `ensureAnonymous()` → RPC → `/home`.
  Welcome page links it quietly. Entry hidden when this device already holds a
  space. Calm failure copy; calm too-many-tries copy (pause, not punishment).
- **Copy:** all strings in copy layer, en + es (type-enforced), language rules
  apply (no urgency; the one-time "write these down" moment stays gentle).

## Out of scope

Advocate-held recovery; Spanish wordlist (words are English v1, flagged for
native review); changing any existing auth flow; SME copy review (recommended
before broad launch, owner-approved for tonight).

## Verification

Unit: wordlist integrity + phrase entropy shape + normalize/hash. Component:
Settings section states; /recover form. Live E2E (real browser + live DB):
begin space → set words → new browser context → recover → space present →
delete-everything cleanup. Full gates before push; migration via db push.
