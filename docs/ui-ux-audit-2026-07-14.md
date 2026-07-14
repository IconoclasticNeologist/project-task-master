# UI/UX Audit — Tend (formerly "The Advocate")

**Date:** 2026-07-14 · **Goal:** maximize judge impact for the UN Human Rights & IBM Call for Code review
**Method:** every one of the 25 routes driven in a real browser (Chrome via Playwright) at 1440×900 and 390×844; full journeys walked end-to-end (self-serve entry → onboarding → Coach session (type path) → Witness Stand practice with the live avatar → handoff → Leave now); axe-core WCAG 2.1 AA scan on every route; keyboard-only pass; tap-target and overflow probes on mobile; production build verified. Screenshots referenced below live in the session scratchpad (`shots/`).

> **Note on the rename:** a parallel session is mid-rename to "Tend" (manifest, icons, tour, judges, `src/lib/product.ts` are modified as I write). Everything I audited displayed "The Advocate." Findings below are name-agnostic; §7 has a rename verification checklist.

---

## 1. What already impresses (don't touch these)

The trauma-informed design is real, not veneer — judges who probe will find substance at every layer:

- **Safety affordances are everywhere and they work.** "Leave now" is on every survivor screen, is the *second* keyboard tab stop, swaps in weather.gov, and neutralizes Back (verified: Back from the decoy lands on the app's plain front door, never the page the survivor was on). "I need a break" → a genuinely calming `/break` screen.
- **The tour (`/tour`) is the single best judge asset I've seen in a hackathon app.** Phone-frame replay of the real journey, chaptered, paused by default, with live sandboxes — "Try Leave now" flips the phone to a fake weather site with a caption explaining the Back-button trick. The four promise cards tie each demo moment to shipped behavior.
- **The practice handoff is the emotional peak and it lands.** Ending Witness Stand practice produces "Everything is stopped. The practice voice is gone. Your Coach is here. Take a breath. There is no rush." — exactly the containment the /judges page promises.
- **Honest, humane microcopy throughout.** "Nothing is on your plan yet. There is no rush." · the PIN warning ("There is no way to recover it") · "This is a practice person — a computer picture. It is not a real person." · "Your microphone is only on while you answer."
- **Real accessibility bones:** visible `:focus-visible` on every interactive element, logical tab order, `aria-live` captions/status, OS reduce-motion honored plus an in-app Stillness toggle, 17px/1.7 base type, ~6th-grade language, zero horizontal overflow on mobile across all 25 routes, consistent `<title>` on every page.
- **Zero console errors** across the app (only expected 401s on guarded routes when logged out — see P0-2).
- **The notebooks shelf (`/notebooks`)** is the visual identity at its best — nine colored paper covers with spines and tabs. Charming, calm, memorable.

The improvements below are about closing the gap between this quality and what a judge experiences in their first five unscripted minutes.

---

## 2. P0 — Fix before judges click around (marquee-flow breakers)

### P0-1 · Practice timer promises 8:00, then shows 1:55
**Seen:** Starting Witness Stand practice, the timer rendered "Practice time left **8:00**" while connecting, then dropped to "**1:55**" ~8s later (the config default renders first; the tier-capped mint arrives after). The countdown also runs during the 15–25s avatar connect, so on the current 120s tier a judge gets ~1:45 of actual practice — and watches the clock burn while "Connecting…" is still on screen.
**Why it matters:** this is the marquee AI feature; a shrinking promise + a clock that runs before anything happens reads as broken, and on a 2-minute cap every second is precious.
**Fix (M):**
1. Don't render a number until the mint returns — show "Getting the practice room ready…" instead.
2. Phrase it as an offer, not a countdown, until media is live: "Up to 2 minutes of practice today."
3. Start the countdown at the first media frame (or credit connect time back).
4. Bonus (biggest perceived-latency win available): **pre-mint during the consent screen** — the survivor reads "who you'll hear, how to stop" for several seconds; use that window to warm the avatar session so the room is near-ready at "Start the practice."
**Where:** `src/routes/session.tsx` (timer + stage machine), `src/lib/voice/useLiveAvatarPractice`.

### P0-2 · Guarded routes render hollow instead of redirecting
**Seen:** Direct loads of `/home`, `/session`, `/settings`, `/onboarding` with no identity render the full page shell — empty greeting "Hello.", dead tiles, 401s in the console. The `requireSurvivor` guard runs in `beforeLoad`, which is skipped during SSR (`document === undefined`) and never re-runs on client hydration; the transient-error path (`guard.ts:20-22`) also lets the route render.
**Why it matters:** judges *will* paste URLs and click "I've been here before" on a fresh device. A hollow app with console errors is the worst possible first impression, and it contradicts the "no space here" toast that in-app navigation correctly shows.
**Fix (S/M):** add a client-side recheck on mount (small `useRequireSurvivor()` hook in the guarded routes, or router-level `beforeLoad` re-run on hydration), and render a gentle inline panel instead of hollow UI while checking: "There's no space on this device yet. → Begin". Keep the transient-error tolerance — but distinguish "Supabase 401 (no session)" from network failure; a 401 is a *clean* no-identity signal, not transient.
**Where:** `src/lib/auth/guard.ts`, guarded routes.

### P0-3 · "Setting up your space…" takes 5.4s with no motion or reassurance
**Seen (timed):** from tapping "I understand — begin" to the profile step: **5,380ms**, with only a disabled-label swap as feedback. My first automated walk concluded the button was dead and moved on — an anxious first-time survivor (or an impatient judge) may do the same, and double-tapping/back-and-retry risks orphan accounts.
**Fix (S for UX, M for root cause):** motion-safe progress feedback (three soft pulsing dots honoring Stillness), plus a second-stage line after ~2.5s: "Still working — this can take a few seconds." Separately, profile *why* `create_self_serve_survivor` takes 5s (RPC chain? edge function cold start?) — sub-2s should be achievable and would fix this outright.
**Where:** `src/routes/begin.tsx:30-50` (also `/enter`), the RPC server-side.

### P0-4 · The avatar speaks with no captions at all
**Seen:** captions render only when `medium !== "avatar"` (`session.tsx:514`). During Witness Stand practice, the practice person's questions have **no text alternative**.
**Why it matters:** deaf/HoH survivors get nothing from the app's centerpiece; judges evaluating an accessibility-forward survivor app may specifically check this. The caption stream already exists for voice mode — this is plumbing, not architecture.
**Fix (S/M):** render the same rolling caption line under the video (the ephemeral, never-stored design is preserved). Add it to the consent copy: "You'll see her words as text, too."
**Where:** `src/routes/session.tsx:514`, caption stream from `src/lib/voice/captions`.

### P0-5 · In the typed session, your words vanish and the reply is a fragment
**Seen:** sending "I'm nervous about being asked questions in court." via Type → my message is never echoed anywhere, and the Coach's answer appears only as a rolling caption that starts mid-sentence and truncates ("…talk through what happened, in your own words. I can tell you what a hearing is usually like. Or we can practice what it feels like to be asked questions. We can also just talk for a—").
**Why it matters:** for a text-first user (quiet room, dissociation, deaf/HoH) the conversation is literally unreadable — you can't see what you said or finish reading what the Coach said. The "never a transcript" privacy principle (`session.tsx:119-123`) is right — but *per-turn* legibility doesn't violate it.
**Fix (M):** in Type mode, show the current exchange as static ephemeral text — "You said: …" plus the Coach's full current reply — wiped on the next turn/end exactly like captions are today. No storage change.
**Where:** `src/routes/session.tsx` (type-mode render path).

---

## 3. P1 — High-impact, mostly systemic (each is one pattern fixed once)

### P1-1 · The primary sage button fails WCAG AA contrast everywhere
axe flags `.bg-primary` (white on `oklch(0.62 0.04 150)` ≈ 3.2:1) as **serious** on every page it appears (/, /session, /break, /settings, tour CTAs…), plus `text-muted-foreground/80` on the landing footer. This is one token: darken `--primary` to ~`oklch(0.50–0.53 0.05 150)` in `src/styles.css` (the paper aesthetic survives — it reads as deeper sage), or keep the fill and switch button text to the near-black foreground. Re-run axe after. **(S — single token, app-wide win.)**

### P1-2 · Every tap target in the bottom nav is ~21px tall
The 7-link text nav (Home · Session · Support · Your space · Your team · Your plan · Settings) on every survivor page measures ~21px high on mobile — below WCAG 2.2 (24px) and far below the 44px platform guideline; same for header "Leave now" (!), hotline `tel:` links on /resources, and source links on /sources. Survivors in court hallways are stressed, on phones, possibly shaking. Add `py-2.5`+`min-h-11` hit areas (visual lightness unchanged — pad, don't enlarge text). "Leave now" especially must be un-missable under stress. **(S — Shell.tsx + resources/sources link classes.)**

### P1-3 · Nothing invites you back to an unfinished setup
Verified live: an account with `onboarded_at: null` roams the whole app with no nudge, and the practice handoff renders the care-plan card as bare em-dashes — "HELPS ME FEEL SAFE —" — at the most emotionally loaded moment in the product. Fix three ways **(S each)**:
1. `/home`: when `onboarded_at` is null, add one quiet card — "Finish setting up your space (about 2 minutes)".
2. Handoff (`session.tsx` closing/handoff card): hide unset care-plan rows; show "You can add these any time in Settings." instead of dashes.
3. All-caps micro-labels ("HELPS ME FEEL SAFE") read as shouting in an app that never shouts — sentence case.

### P1-4 · Settings breaks the "change them later" promise, loads with "…", and has an ambiguous Save
- The entry profile says "You can change them later" and `begin.tsx:64` claims the name is "editable later in Settings" — **Settings has no name field.** (The save path itself works; verified in the DB.) Add "What can I call you?" to Settings.
- The page shows a bare "…" for ~3s (same pattern in StatementList/DocumentList). The repo's `Skeleton` primitive is unused — swap it in with `aria-busy`. **(S)**
- One "Save" button sits under the visibility radios; care-plan fields, language, and motion sit above it — what does Save cover? Autosave-with-confirmation ("Saved.") per control, or a save per card. **(M)**
- Related polish: `/home`'s greeting renders "Hello." then pops to "Hello, {name}." ~2s later — hold the greeting line until the survivor query resolves (it's above the fold; a 2s skeleton line beats a text swap). **(S)**

### P1-5 · Decide the judge demo-data story for the live site
Fresh accounts see beautiful empty states — but *only* empty states (/plan, /account, /team all "nothing yet"). The demo seed exists and is judge-proof (`Load an example (demo)` → confirm → full app), but on the live site it's visible only with the per-device `/dev` toggle or a `VITE_DEMO_TOOLS=true` build. **Verify which the submission build uses.** If judges are meant to see it: set the env var on Vercel and add one line to `/judges`: "In the live app, Home → Load an example fills the space with sample data." If not: the tour carries the burden alone — make sure /judges says that explicitly. **(S — config + copy decision.)**

---

## 4. P2 — Polish that judges will feel

| # | Finding | Fix | Effort |
|---|---|---|---|
| P2-1 | `/session` start card is bare: "Practice (Witness Stand)" is unexplained jargon; nothing says talk-or-type or that nothing is saved | One subtitle per button: Begin — "Talk or type with your Coach. At your pace." · Practice — "Rehearse being questioned, with a stop word and your Coach nearby." | S |
| P2-2 | Tour on mobile: Play sits *above* the phone frame, so pressing it animates chapters while the demo screen is out of view; stray floating "0%"/"57%" percent; faint background seam between hero band and page | Motion-safe scroll the phone into view on Play; fold the percent into the chapter rail (or drop it — chapters already show progress); align the two background tones | S/M |
| P2-3 | `/sources` acknowledgements section is silent on loading and vanishes on error (`sources.tsx:165`) — this is the "receipts" page judges are sent to | Loading line + error-with-retry + explicit empty copy ("Acknowledgements are being added.") | S |
| P2-4 | 404 page shouts "404" in huge bold type with techy copy, and has no Shell header — meaning **no "Leave now"** on the one page a mistyped URL produces | Soft voice ("This page isn't here. Let's go back."), keep the Shell header affordances, keep Go home | S |
| P2-5 | Onboarding `aria-prohibited-attr` (axe serious): `aria-label` on a plain `div` in the ProgressDots row | `role="group"` + `aria-label="Step 2 of 6"` (or sr-only text) | S |
| P2-6 | `/judges` hero paragraphs wrap at the global 34ch cap inside a 672px column — skinny text next to wide cards (the tour already unsets the cap for itself) | Reviewer pages get `p { max-width: 60ch }` | S |
| P2-7 | Tour copy vs Leave-now behavior: the caption says Back "lands on a neutral page too," but Back from the decoy returns to the app's own front door (`/` — by design via `history.replaceState("/")`) | Either adjust the caption ("Back lands on the app's plain front door — never where she was") or discuss `location.replace` semantics (Back would then leave the app entirely; tradeoff: no return path at all). The current behavior is defensible — the copy just overclaims. | S |
| P2-8 | Landing on short laptops (900px): "Begin" sits at the fold; the reviewer footer (tour link!) is far below it | Tighten hero top-padding under a `@media (max-height: 880px)` | S |
| P2-9 | Account tabs say "Your words / Your timeline / Your papers"; nav and tiles say "Your space / See your timeline / documents" — three names for two concepts (papers vs documents drift also appears in deep-link hashes `#documents`) | Pick one noun per concept and sweep | S |

---

## 5. P3 — Nits and nice-to-haves

- **Home tiles could carry a whisper of the notebook craft** — the shelf is the identity peak; the hub is plain white cards. A 3px colored spine edge per tile (sage/sand/clay…) would tie the system together without adding noise. Taste call — the current calm is also defensible.
- Practice video corner radius doesn't quite match its card; "Send" button is visually light next to the big composer (Enter works — good).
- The demo-seed button on /home is above the six tiles; in demo builds that's arguably correct (judges see it first), just confirm it's intentional.
- One stray `404` console line on `/` in dev with no captured request (likely dev-only SW/sourcemap noise) — confirm absent in the production build.
- `/tour` "Try saying 'stop'" chips are 39px tall — bump to 44px with the P1-2 sweep.
- Production build is healthy: builds clean, SW precaches 66 files (1.4MB), sensible route-level code-splitting (avatar SDK isolated to its chunk, 432KB — consider `modulepreload` on the consent screen as part of P0-1's pre-warm).

---

## 6. Accessibility scorecard (WCAG 2.1 AA lens)

| Area | Status |
|---|---|
| Keyboard: order, visible focus, no traps | ✅ Strong (verified / and /home; Leave now is tab stop #2) |
| Reduced motion | ✅ OS setting + Stillness toggle both zero animation |
| Color contrast | ❌ Primary button token app-wide; muted/80 text (P1-1) |
| Target size (2.5.8) | ❌ Bottom nav, header links, tel links (P1-2) |
| Captions/text alternatives for speech | ❌ Avatar mode has none (P0-4); voice mode has rolling captions (partial — P0-5) |
| ARIA validity | ⚠️ One prohibited-attr on onboarding dots (P2-5); otherwise clean and generous (`aria-live`, roles, labels) |
| Language/reading level | ✅ ~6th grade, `<html lang>` set pre-paint, en/es for the Coach |
| Forms | ✅ Visible labels on entry/profile; settings inputs labeled |

---

## 7. Rename verification checklist (once the in-flight "Tend" rename lands)

Every place the old name rendered during this audit — verify each shows the new brand: page `<title>` suffix on all 25 routes (`__root.tsx` head), landing h1 + intro, tour header/phone mockup/captions/footer ("Built for the UN Human Rights & IBM Call for Code review"), /judges h1 + body, /sources, install prompt copy, `manifest.webmanifest` name + icons, `offline.html`, 404 title, PWA precache (rebuild sw.js), Supabase auth redirect URLs for the new domain, and the survivor-facing copy layer `src/lib/copy/index.ts` (not in the current rename diff — check it isn't missed).

---

## 8. Suggested attack order (weekend-sized, wow-per-hour)

1. **P1-1** contrast token (30 min, entire app improves + axe goes green on 9 routes)
2. **P0-1** practice timer honesty + pre-mint during consent (the marquee demo stops undermining itself)
3. **P0-4 + P0-5** avatar captions + type-mode turn text (the AI is suddenly legible to everyone)
4. **P0-2** guard redirect + friendly no-space panel (kills the hollow-app first impression)
5. **P0-3** creation-wait feedback (first 10 seconds of the product feel alive)
6. **P1-2** tap-target sweep (one Shell change + two link classes)
7. **P1-3** onboarding nudge + handoff dashes (closes the emotional loop)
8. **P1-5** demo-data decision + one line on /judges
9. **P2-1…P2-9** in listed order as time allows
10. Re-run axe + a 5-minute fresh-device walkthrough on the live URL as the final check

---

*Full-page screenshots (desktop+mobile, logged-out and authed), axe JSON, flow notes, and timing data are in the session scratchpad under `shots/` — ask and I'll pull any specific one into the repo.*
