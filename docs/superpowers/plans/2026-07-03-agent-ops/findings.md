# Findings — voice & video agent operations

## Avatar conversation: root cause (2026-07-05, after 7 live tests + headless repros)

Definitive, evidence-backed conclusion:

- **Their video render works.** Avatar appears, plays with sound.
- **Their ASR works.** Every user utterance transcribed accurately (user.transcription).
- **Our RAG-locked brain works.** Every turn generates a correct reply (shim
  health record: status 200, right char counts, every time).
- **Their auto-voice loop is the ONE broken link.** The agent-initiated OPENER
  speaks fine (auto-loop, no user input). But every USER-triggered reply is
  GENERATED and never VOICED in the browser. Even an explicit `speak_response`
  (session.message) generated a second reply that also went unspoken — it
  competes with the auto-loop's generation for the same turn.
- **`avatar.speak_text` (verbatim, no generation) works — 2/2 headless.** It
  carries no LLM step, so nothing to conflict with.

## The fix: own the loop (repeat/verbatim pattern — HeyGen's documented BYO-LLM path)

Use their pieces we trust, replace the one we don't:
- INPUT: their ASR (user.transcription) — accurate, keep it.
- BRAIN: our own generation via a JWT-gated edge action (advocate-agent
  `defense_turn`), reusing DEFENSE_PRACTICE_PROMPT + the person's shareable-only
  account. Same RAG-lock, same SME-gated prompt.
- OUTPUT: `session.repeat(text)` = `avatar.speak_text` = speak VERBATIM. Proven.

History: capture the auto-loop's opener once (avatar.transcription), then own
every turn. Our driven speech's own avatar.transcription is ignored (flagged)
so it isn't double-recorded. The custom LLM config stays registered so any
stray auto-generation remains our safe, silent prompt — never their default.

Net: the avatar becomes a face that speaks only text we generated. Zero
dependency on their auto-voice behavior. This is also the LITE-mode-privacy
direction (survivor audio still transits their ASR — noted in SME doc).
