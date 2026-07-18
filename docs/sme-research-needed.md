> **SUPERSEDED (2026-07-18, owner decision).** The SME review stage is closed.
> Prompt wording is now grounded in the research dossier under `docs/research/`
> (Perplexity intake + gap-fill, citation-pinned) and is owned by the founder,
> who can see and edit every persona's exact words at `/dev` → Prompts
> (audited overrides; git defaults restorable). This file remains as history
> of the questions that research answered.

# SME Research Needed — N3 Agents (The Advocate)

The three N3 agents (`reframer`, `recognition`, `interviewer`) currently run on principled **PLACEHOLDER** prompts. These prompts are safe-by-construction — they are designed to avoid harm — but the exact wording has not been reviewed or signed off by any subject-matter expert.

**Runtime prompts live here:** `supabase/functions/advocate-agent/index.ts` (the `REFRAMER_PROMPT`, `RECOGNITION_PROMPT`, and `INTERVIEWER_PROMPT` constants). Those constants are the canonical source of truth; any wording in `src/lib/agents` is secondary.

**Nothing in this document may reach a real survivor until the named SME for each agent has reviewed and signed off on that agent's prompt.**

---

## Agent 1: `reframer`

### What the placeholder does

Surfaces neutral observations drawn exclusively from the person's own statement entries: places where two entries differ in a detail or date, gaps in time, and things mentioned once and not again. Observations are framed as "for you and your advocate to look at together." The prompt never judges truthfulness or credibility, never says anything that implies doubt, and never surfaces any detail about the person's sexual history.

### SME(s) needed

Trauma therapist **and** attorney.

### Must validate before launch

- The surfacing boundaries: what is safe to surface at all, and what categories of observation must never be raised regardless of what the entries contain.
- Pre-litigation safety: whether surfacing internal inconsistencies to the person before any legal proceeding could prejudice their case or be discoverable.
- **FRE 412**: the prompt must never, under any circumstances, cause the model to surface or reference the person's sexual behavior or history. The attorney must confirm the current hard rule is sufficient and correctly scoped.

---

## Agent 1 (standalone decision): `reframer` — Survivor-Visible vs. Advocate-Only

**This is a separate, explicit decision — not a sub-item of surfacing boundaries.**

The current placeholder makes reframer output **survivor-visible**: the final line of the prompt is "these are for you and your advocate to look at together," meaning the person sees their own inconsistencies directly.

Seeing one's own inconsistencies surfaced — even neutrally — can feel like being doubted, interrogated, or re-traumatized. This is a recognized risk in trauma-informed practice.

**Decision needed from the trauma therapist:** should reframer output ever be shown to the survivor at all, or should it be routed to the advocate only, with the advocate deciding what (if anything) to share and how?

Survivor-visible is only the demo default. **This is not settled.** The answer will require a code change to the UI routing layer before any real user sees this agent's output.

---

## Agent 2: `recognition`

### What the placeholder does

Offers at most 2–3 general "a lot of people don't realize that X is a form of Y the law recognizes" statements drawn loosely from what the person wrote, then stops. It explicitly refuses to conclude that any label applies to the person. Any direct ask for a conclusion — direct ("was I trafficked?"), indirect or leading ("it sounds like that was trafficking, right?"), hypothetical ("would a lawyer say this counts?"), or a demand for a yes/no — is refused every time, with a redirect to a legal partner.

### SME(s) needed

Attorney **and** trauma therapist.

### Must validate before launch

- The **exact permitted statements**: the attorney must review and approve every general legal-lens statement the model is permitted to offer, including the "debt bondage as a form of force" example currently in the prompt.
- The **exact forbidden statements**: the attorney must confirm that the direct-ask refusal wording covers all legally significant edge cases and that the redirect language does not itself constitute legal advice.
- **Legal-category mapping accuracy**: TVPA definitions of force, fraud, and coercion (including debt bondage); coercive-control patterns and their recognition in applicable jurisdictions. The attorney must confirm the mapping is accurate and not overstated.
- **FRE 412**: the recognition layer must never offer a general lens that would, even indirectly, invite the person to surface or reflect on their own sexual behavior or history.
- The **recognition-not-diagnosis framing**: the trauma therapist must confirm that offering general legal lenses does not function as a diagnostic label in the clinical sense, and that the framing does not foreclose the person's own meaning-making.

---

## Agent 3: `interviewer`

### What the placeholder does

Suggests one neutral, open, non-leading invitation to help the person share in their own words. When the person is just starting, offers plain ground rules first (it is okay to say "I don't know", to skip, to correct the model, to stop), then one open invitation. If the person seems to stop, suggests a pause rather than a push. Never asks "why." Never summarizes the person's account back to them unless asked.

### SME(s) needed

Trauma therapist.

### Must validate before launch

- **Trauma-informed protocol adaptation**: the prompt structure is loosely modeled on WHO ethical-interviewing principles, the Enhanced Cognitive Interview, and NICHD ground rules. The trauma therapist must assess whether the model's adaptation of these protocols is appropriate and whether it misses critical safeguards.
- **Re-traumatization risk**: whether any pattern of AI-suggested invitations — even individually neutral ones — could, in aggregate or in specific emotional states, re-traumatize the person.
- **Whether AI-suggested invitations are appropriate at all**: the deepest question. The trauma therapist must assess whether interview invitations should only ever be delivered by a trained human advocate, with this agent's output going to the advocate rather than directly to the person.

---

## Witness Stand practice: the visible practice person (avatar) — graduated exposure decision

**Added 2026-07-02. This gates real-survivor use of the LiveAvatar practice person, not the demo.**

### What the build does

Witness Stand practice can show a photoreal on-screen "practice person" (HeyGen LiveAvatar) instead
of a disembodied practice voice. It is opt-in, consent-gated on every entry, labeled plainly as "a
computer picture, not a real person," capped at 8 minutes with a visible timer, interruptible
mid-word by the stop word or a tap, and RAG-locked so it can only ask about what the person already
said (`supabase/functions/advocate-defense-llm/index.ts`). The Coach voice — deliberately — never
has a face; stillness stays the design for the supportive voice.

### The clinical rationale to validate

A visible questioner is closer to the actual courtroom stressor than a voice alone, which makes the
avatar defensible as **graduated exposure** — practice at a survivable intensity, chosen by the
person. That is a hypothesis, not a finding.

### SME(s) needed

Trauma therapist **and** attorney.

### Must validate before launch

- **Whether a photoreal adversary is appropriate at all** for this population, even opt-in — or
  whether it should be advocate-supervised only, or removed for real users.
- **Uncanny-valley and dissociation risk**: whether a synthetic face in a pressurized rehearsal can
  re-traumatize, and what screening or framing mitigates that.
- **The consent-gate wording** (`copy.session.witness` in `src/lib/copy/index.ts`) — currently a
  marked placeholder.
- **The intensity ceiling**: the shim's practice prompt is deliberately gentle; the attorney and
  therapist together should set how much courtroom pressure is appropriate, and the FRE 412 rule in
  the shim prompt must get the same review as the voice path's.
- **Third-party data surface**: practice audio and account-derived questions transit HeyGen
  LiveAvatar (STT: Deepgram/AssemblyAI; TTS: ElevenLabs). Confirm this is acceptable for real
  survivors or demo-only.
- **LiveAvatar retains session transcripts server-side** (verified 2026-07-04 via their
  `GET /v1/sessions/{id}/transcript` — user utterances stored with timestamps). This conflicts
  with the product's no-retention rule for the voice path. Before any real survivor uses the
  practice person: obtain their retention policy / deletion guarantees (enterprise controls),
  or treat the avatar as demo-only.

---

## Sources

- TVPA / force, fraud, and coercion: [U.S. Department of State — What Is Trafficking in Persons?](https://www.state.gov/what-is-trafficking-in-persons/) and [National Human Trafficking Hotline — Federal Law](https://humantraffickinghotline.org/en/human-trafficking/federal-law)
- Coercive control: [Washington University Law & Policy — Coercive Control](https://journals.library.wustl.edu/lawpolicy/article/id/8884/) and [Domestic Shelters — USA Coercive Control Laws](https://www.domesticshelters.org/articles/legal/USA-coercive-control-laws)
- FRE 412: [Cornell Law School — Federal Rules of Evidence, Rule 412](https://www.law.cornell.edu/rules/fre/rule_412)
- Trauma-informed interviewing: [OVC TTAC — Trauma-Informed Victim Interviewing](https://www.ovcttac.gov/taskforceguide/eguide/5-building-strong-cases/53-victim-interview-preparation/trauma-informed-victim-interviewing/)

---

_These placeholders are marked in code with `// PLACEHOLDER — demo only` comments that point to this document._
