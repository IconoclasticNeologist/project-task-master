# Tour Video-Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (inline, author-executed same session — deadline-compressed; plan captures decisions + integration points rather than full duplicated code).

**Goal:** Make `/tour` contain every approved demo-video feature: the Witness Stand chapter with the practice person speaking, one-click English⇄Español, a speaking Coach, a Learn chapter with real narration, upgraded Your-space chapter, "I need a break" + Helper try-its, recovery-words beat, and a PIN-lock mention — all frozen-data, replay-honest, recordable locally.

**Architecture:** `/tour` stays a self-contained public route. New `src/lib/tour/copy.ts` holds a bilingual TOUR_COPY table (en/es) that **imports verbatim strings from the app's real copy bundles wherever the depicted screen exists in the app** (witness consent, shell chrome, break screen, helper, guide step) so the replay cannot drift from the product. Media (coach TTS clips, practice-person capture, real narration mp3) are static assets under `public/tour/` + existing `public/audio/study/`; playback is gated on the user's Play gesture (satisfies Chrome sticky-activation for sound), pauses with the tour, and never runs under reduce-motion/Stillness.

**Tech Stack:** React 19 / TanStack Start route, scoped CSS-in-file (existing tour pattern), vitest for copy parity, Gemini TTS (voice "Aoede" — the Coach's real voice) or OpenAI TTS fallback for coach clips, existing OpenAI narration mp3s.

## Global Constraints

- Deadline context: hackathon deadline was 11:00 PM EST 2026-07-14 — **NO git push / deploy in this plan**; local-only so the founder decides on post-deadline deploys. Commits are local.
- Do not touch `src/routes/dev.tsx`, `src/lib/voice/useLiveAvatarPractice.ts(.test.ts)` — uncommitted user work.
- Tour rule preserved: "PAUSED by default … plays only when the judge presses Play"; reduce-motion honored; nothing autoplays sound before a gesture.
- Copy rules: es-419, usted register; never "víctima" (except court-role phrase), no urgency words; judge-facing rail/labels stay English; every depicted screen must match shipped behavior (faithfulness over polish).
- The "Was I trafficked?" refusal is **excluded** (founder decision, memory: refusal-demo-stance).
- ES mode hides the Listen narration control (Spanish narration deliberately unshipped — depicting it would be dishonest).
- Chapter order tells the product journey: way out → no name (+ way back in) → coach → learn → your words/locks → witness stand → who sees → grounded.

---

### Task 1: Bilingual tour copy module + parity test
**Files:** Create `src/lib/tour/copy.ts`, `src/lib/tour/copy.test.ts`.
**Produces:** `tourCopy(es: boolean)` → typed object with sections: `phone` (chrome: leaveNow/iNeedABreak — imported from real `shell` copy), `ch1..ch8` per-chapter phone strings, `witness` (re-export of real `copy` bundle witness strings: consentTitle/consentBody/consentPoints[1,4]/begin/notNow/avatarNote/answer/answerHint/upTo format "8:00"), `breakScreen` (real), `helper` (real: button/title/intro/notSaved/navGo), `learn` (guide 03 "Words you'll hear" cover + step "Words that interrupt" title/body-with-[[terms]]/listen label from real `study.listen`), `recovery` (sectionTitle + one-line explain from real bundle), `tryIt` labels/notes (tour-bespoke, hand-written es).
Test asserts: en/es key parity (deep), consentPoints same length, imported strings === the app bundles' values (drift guard), es strings contain no "víctima"/"¡".
Steps: write test (fails: module missing) → implement → `npx vitest run src/lib/tour` PASS → commit `feat(tour): bilingual copy module sourced from app bundles`.

### Task 2: Language switch + thread copy through existing chapters
**Files:** Modify `src/routes/tour.tsx`.
- Add `const [es, setEs] = useState(false)`; `const t = tourCopy(es)`.
- Phone app bar gains the real Globe menu (clone of Shell's `LanguageMenu` markup, including "Coming soon · Próximamente" + [中文, Tagalog, 한국어, Tiếng Việt, Русский]) — placed on the phone frame so the click is the on-camera moment; also swaps "Leave now/I need a break" chrome to `t.phone.*`.
- Replace hardcoded Stage strings for ch1 (landing), ch2 (safety list — real `begin.safetyPoints`), ch3 caption line, ch7 (team), ch8 (support) with `t.*`. Rail/titles/desc stay EN.
- `runTry` gets per-mode duration map `{leave: 3800, stop: 3800}` (extended in Task 6).
Steps: implement → `npx tsc --noEmit` clean → manual: toggle flips phone content instantly both directions → commit `feat(tour): one-click English⇄Español phone frame`.

### Task 3: Ch2 recovery-words beat + Ch5 Your-space upgrade
**Files:** Modify `src/routes/tour.tsx`, `src/lib/tour/copy.ts`.
- Ch2 (dur 9000→12500): at p≥0.66 reveal card "A way back in" (`recovery.sectionTitle` real string) + six words from the real curated list (`generatePhrase` output frozen as constant: e.g. import list from `src/lib/recovery/words.ts` at build for realism — six fixed words) + one honest line ("Optional. Shown once. It can reopen your space on a new device.").
- Ch5 (dur 10500→12500) staged: tabs row (Your words · Your timeline · Your papers, real `nav/account` wording) → existing statement+pills → timeline row `"around last winter — He took my passport"` (fuzzy-date example) → papers row with lock glyph + ciphertext filename `9f2XkQ…enc` → cipher tiles (existing) → final beat: draft header block `DRAFT — for your lawyer to review` + real subtitle line.
Steps: implement both → tsc clean → visual check both langs → commit `feat(tour): recovery words beat + full Your-space chapter`.

### Task 4: New Learn chapter (position 4)
**Files:** Modify `src/routes/tour.tsx` (+copy from Task 1).
- Stage: shelf of 3 notebook covers (reuse `notebook-cover` class + COVER colors sage/sky/clay; titles = real guide titles 01/02/03, "about 9 minutes — no rush" line) → pointer opens "Words you'll hear" → step card "Words that interrupt" with body, `[[sustained]]` underlined; popover reveals real meaning ("The judge agrees — that question goes away.") → Listen row (`▷ Listen to this step`, real `study.listen` label) with progress shimmer while narration plays.
- Audio: `/audio/study/words-you-will-hear/objection-words.mp3` (real shipped asset) plays from the beat where the pointer taps Listen (p≈0.55) until chapter end while `playing && !reduced && !es`; ES mode: Listen row absent, extra line noting narration is English-first (honest).
- Chapter def: `{n:"04", label:"Learn", title:"Court words, made small.", desc:"Ten guides, 66 steps, every one narrated — 'Big words. Small meanings.' Tap any term; listening is a choice, like everything."}`, dur 12000. Pointer waypoints: cover tap p0.2, term tap p0.45, listen tap p0.58.
Steps: implement (chapter arrays reindex; STARTS/TOTAL are computed already) → tsc → audible check → commit `feat(tour): Learn chapter with real narration`.

### Task 5: New Witness Stand chapter (position 6) + media rig
**Files:** Modify `src/routes/tour.tsx`; assets `public/tour/practice-person.mp4` (Task 8) with poster-mock fallback.
- Three phases in one 22000ms chapter: consent gate (real strings; pointer taps "Start the practice" p0.28) → live practice: 3/4-aspect video area (asset if present via `onError`→fallback state; fallback = styled silhouette card labeled with real `gettingReady` then question caption), `avatarNote` under video (real string), caption = RAG-locked question `"You said you weren't allowed to keep your own papers. Who held your passport?"` (es variant), timer chip `Up to 8:00 today` ticking down (7:58…) once "room ready", push-to-talk button `Tap to answer` + `answerHint` (real) → p≥0.86: stop → reuse halt UI verbatim ("Everything is stopped. The practice voice is gone. Your Coach is here.").
- Media wiring (shared for T4/T5/T6-audio): `mediaRef` map; effect on `(playing, active, es)` → play/pause + offset-seek `(elapsed-STARTS[i])/1000 - phaseOffset`; global pause stops all; `reduced` → never autoplay.
- Chapter def: `{label:"The Witness Stand", title:"Pressure, at an intensity she chooses.", desc:"Consent-gated every time. A practice person — honestly labeled a computer picture — asks only about what she marked shareable. 'Stop' ends it in code, and her Coach has the last word."}`
Steps: implement → tsc → walkthrough: consent→video/fallback→timer ticks→halt; jumpTo mid-chapter sane → commit `feat(tour): Witness Stand flagship chapter`.

### Task 6: Try-it row — "I need a break" + "Questions?" helper + PIN note
**Files:** Modify `src/routes/tour.tsx` (+copy Task 1).
- `runTry` modes `breather` (6500ms): phone overlay = real break screen (title/body/breath lines, breathing circle `advocate-breath`-style keyframe scoped `tour-breath`, disabled under reduced; care plan card "Maya · a walk by the water" labeled fictional) — real strings from `breakScreen`.
- Mode `helper` (7000ms): bottom-left `Questions?` bubble appears then sheet: title "Ask about this app", intro line, one exchange — Q "Is what I write private?" / A (verbatim-style lane answer: "Everything you write is private by default… Only what you mark 'okay to share' is ever shown to someone helping you.") + `Take me there → Your space` offer button + `This chat isn't saved. It disappears when you close it.` (real).
- Leave-now note gains PIN sentence: "…and it engages the device PIN lock, if one is set."
- Try-it row: 4 buttons w/ icons (LogOut, Square, CircleDashed/Wind, HelpCircle).
Steps: implement → tsc → all four try-its + es variants → commit `feat(tour): break + helper try-its, PIN note`.

### Task 7: Coach speaks — generate EN/ES clips
**Files:** Create `public/tour/coach-en.mp3`, `public/tour/coach-es.mp3`; scratchpad script only (never committed to scripts/ — one-off).
- Retrieve `GEMINI_API_KEY` (else `OPENAI_API_KEY`) via the documented throwaway-edge-function pattern (memory: advocate-deploy-facts). Gemini TTS `voice: "Aoede"` = the live Coach's actual voice; if unavailable → OpenAI `gpt-4o-mini-tts` with the narration VOICE_INSTRUCTIONS and add replay-note honesty line "Voices in this replay are re-created."
- Text EN = existing ch3 caption sentence; ES = usted translation (in copy module, single source).
- Wire ch3: audio plays synced to typing (`playing && active===2 && !reduced`), offset-seek, pause-with-tour; adjust ch3 dur to clip length + 3s tail.
Steps: retrieve key → generate → `ffprobe` durations → wire + tsc → audible EN and ES → commit `feat(tour): the Coach speaks in the replay`.

### Task 8: Practice-person capture attempt (timeboxed 30–40 min)
**Files:** Create `public/tour/practice-person.mp4` if capture succeeds. NO source-file changes.
- Playwright (headed, fake-mic flags) → local dev server → `/dev` avatar section → start session (text-driven turn so no mic needed: send fixed question script) → page-evaluated `MediaRecorder` on `videoEl.srcObject` (video+audio) 12–15s → save webm → `ffmpeg` → mp4 (H.264/AAC, ≤720p).
- On failure/timeout: keep fallback poster (already shipped by Task 5); README-style note in final report telling founder how to drop a manual capture at `public/tour/practice-person.mp4`.
Steps: attempt → if success: ffprobe + place asset + visual check → commit `feat(tour): real practice-person replay clip`.

### Task 9: Verification pass
- `npx vitest run` (all suites, expect 166+new passing) → `npx tsc --noEmit` → `npm run build`.
- Playwright walkthrough of `/tour` on the local build: play all 8 chapters EN, switch ES mid-tour, run all 4 try-its, jumpTo each chapter, reduce-motion pass (no autoplay), screenshot each chapter both langs to scratchpad; confirm coach/narration audio elements reach `currentTime > 0` while playing (programmatic assert).
- Fix anything found; final commit `chore(tour): verification fixes` if needed.

### Task 10: Report (no push)
Summarize: what shipped, how to record locally (`npm run dev` → `/tour`), deploy decision (post-deadline rule risk), avatar-clip status, remaining founder placeholders.

## Self-Review
- Spec coverage: approved items 1,2,3,4,6,7,8,9,10 → Tasks 5,2,7,4+audio,6,3,6,3,6 respectively; excluded item 5 (refusal) honored. ✓
- No placeholders: strings named with sources; one deliberate open runtime branch (asset-or-fallback) is a product decision, not a TBD. ✓
- Type consistency: single `tourCopy(es)` accessor used by Tasks 2–7. ✓
