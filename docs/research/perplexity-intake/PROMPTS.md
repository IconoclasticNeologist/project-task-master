# Perplexity research prompts (ready to paste)

Two prompts. The first fills the gaps in what we already have (`README.md` holds
the first research pass). The second builds a structured, per-jurisdiction
dataset we can turn into a "select your state / country" picker in the app.

Both prompts enforce the same discipline as the first pass: distinguish
**(1) binding law or court rule**, **(2) official agency/court guidance**, and
**(3) professional best practice**; give a pinpoint citation and a direct link
for every substantive claim; label the jurisdiction; and say **"Unknown"** rather
than guessing.

---

## PROMPT 1 — Fill the remaining intel gaps

> I am building trauma-informed, plain-language educational content that helps
> **adult human-trafficking survivors** prepare emotionally and practically to
> testify or participate in **criminal court**. It is educational only — never
> legal advice, and it must never coach, script, rehearse, or shape testimony.
> I already have solid material on: the types of proceedings; the step-by-step
> court journey (before → arrival → waiting → direct → cross → breaks → after →
> sentencing → post-conviction); core U.S. federal victims' rights (CVRA, VRRA,
> AG Guidelines); support persons; interpreters/ADA; remote testimony; rape-shield
> (FRE 412); restitution; safety planning; trauma and memory; and general
> cross-examination process.
>
> Do **not** repeat that. I need you to fill the following gaps. For every
> substantive claim, tag it as **[LAW]**, **[OFFICIAL GUIDANCE]**, or **[BEST
> PRACTICE]**, give a pinpoint citation and a direct working link, and label the
> jurisdiction (federal / a named state / a named country / international). Where
> sources disagree or a point is contested, say so. Where you cannot verify
> something, write "Unknown — not verified." Keep explanations in plain language
> (about a 6th–8th-grade reading level), but keep the citations precise.
>
> Cover these gaps:
>
> 1. **Trafficking-specific cross-examination dynamics.** How defense questioning
>    commonly exploits trauma bonding, coercive control, delayed reporting,
>    continued contact with the trafficker, prior inconsistent statements, and
>    "why didn't you leave / you called him your boyfriend" framing. Explain these
>    as *patterns to understand and expect* and the *procedural protections* that
>    exist — not as answers to give. Include what the research and prosecutor
>    training materials say about why these patterns are misleading.
> 2. **Prior inconsistent statements and "recantation" procedurally.** How courts
>    handle changed, incomplete, or delayed accounts; what impeachment is; what
>    "refreshing recollection" means; and the trauma-and-memory research that
>    explains why inconsistency is common and not proof of dishonesty.
> 3. **The prosecutor is not the survivor's lawyer.** What "the right to confer"
>    actually means, the limits of that relationship, and how a survivor can get
>    their **own** victims'-rights attorney (e.g., legal-aid, pro bono, or
>    rights-enforcement clinics). Name real national organizations and their scope.
> 4. **Plea agreements.** Most criminal cases resolve by plea, not trial. Explain
>    the survivor's right to be heard/notified on pleas, why a case may not reach
>    trial, and what that means for someone who prepared to testify.
> 5. **Victim impact statements — mechanics.** Format, length, what may and may
>    not be included, and delivery options (written, read aloud, recorded, or via
>    an advocate) at the federal level and how states commonly vary.
> 6. **Immigration intersection for foreign-national survivors.** How criminal-case
>    cooperation interacts with **T-visa**, **U-visa**, and **Continued Presence**;
>    the confidentiality protections (e.g., 8 U.S.C. § 1367); and the safety and
>    privacy implications of testifying. Flag clearly that this is
>    immigration-law-specific and individualized.
> 7. **Courtroom testimonial aids and protective measures for ADULT vulnerable
>    witnesses** (not just children): screens/partitions, closed-circuit or remote
>    testimony, courtroom closure/sequestration of the public, support persons at
>    the stand, and **courthouse facility-dog / support-animal** programs — the
>    legal standard for each and how often they're actually granted for adults.
> 8. **Witness sequestration ("the rule").** What it is, how it limits a survivor's
>    ability to be present or discuss the case, and common exceptions for victims.
> 9. **What can undermine or exclude testimony — things to avoid.** Discussing
>    testimony with other witnesses, researching the case, social-media posting,
>    contact with jurors/defendant. Frame as neutral procedural "dos and don'ts."
> 10. **Evidence-based acute-stress regulation techniques** validated for use
>     immediately before/during high-stress events (e.g., paced/diaphragmatic
>     breathing, 5-4-3-2-1 grounding, temperature/cold, bilateral stimulation).
>     Cite the strongest peer-reviewed or clinical-guideline support and note
>     limits — no clinical claims beyond the evidence.
> 11. **Delays, continuances, and anticipatory anxiety.** The right to proceedings
>     free from unreasonable delay, why cases get postponed, and what the research
>     says about the psychological toll of the waiting/uncertainty period.
> 12. **International frameworks** (this is for a UN Human Rights context): the UN
>     Palermo Protocol and UNODC guidance; the EU Victims' Rights Directive
>     (2012/29/EU); the UK Victims' Code and "special measures" incl. s.28
>     pre-recorded cross-examination; and comparable Canadian and Australian
>     victim/witness testimonial-aid provisions. Summarize what protections a
>     trafficking survivor-witness can expect and cite the instruments.
>
> End with a short list of anything important you think I'm still missing for
> this specific audience and use case.

---

## PROMPT 2 — Per-jurisdiction dataset for a "select your location" picker

> I need a **structured, machine-readable dataset** of the court-related rights
> and procedures that matter to an **adult human-trafficking survivor preparing to
> testify in criminal court**, broken down **per jurisdiction**, so I can build a
> "select your state or country" picker in an app. This is educational only, not
> legal advice.
>
> Produce the data as **JSON**, one object per jurisdiction, using **exactly** the
> schema below. Do the U.S. first: all **50 states + D.C.** (add Puerto Rico and
> other territories if you can verify them). Then the following countries:
> United Kingdom, Ireland, Canada, Australia, New Zealand, Germany, France, Spain,
> Italy, Netherlands, Sweden, Mexico, Brazil, India, Philippines, Nigeria, Kenya,
> South Africa, and the EU as a bloc.
>
> **Work in batches** (e.g., 5–10 jurisdictions per reply) so nothing is
> truncated; I'll say "continue" between batches. Keep the schema identical across
> every batch.
>
> **Rules:**
> - Every non-empty field must carry a **source**: a citation string and a direct
>   URL, inside the field's `source` object.
> - If you cannot verify a field for a jurisdiction, set its `value` to `null` and
>   set `status` to `"unknown"`. **Never guess or infer.** A `null` is more useful
>   to me than a wrong answer.
> - Add a top-level `last_verified` date and a `confidence` of
>   `"high" | "medium" | "low"` per jurisdiction.
> - Keep each `value` short and plain-language; put the precise legal detail in
>   `notes`.
>
> Schema (per jurisdiction):
>
> ```json
> {
>   "jurisdiction": "Texas",
>   "level": "us_state",              // "us_state" | "us_territory" | "country" | "bloc"
>   "iso_or_postal": "US-TX",
>   "last_verified": "2026-07",
>   "confidence": "medium",
>   "fields": {
>     "victims_rights_source": { "value": "", "notes": "", "status": "ok", "source": { "citation": "", "url": "" } },
>     "sexual_history_shield_rule": { "value": "", "notes": "procedure to invoke: notice period, in-camera hearing", "status": "ok", "source": { "citation": "", "url": "" } },
>     "support_person_in_courtroom": { "value": "", "notes": "allowed? limits if support person is also a witness", "status": "ok", "source": { "citation": "", "url": "" } },
>     "facility_dog_or_support_animal": { "value": "", "notes": "", "status": "ok", "source": { "citation": "", "url": "" } },
>     "remote_or_shielded_testimony_adult": { "value": "", "notes": "CCTV / screen / remote for adult vulnerable witnesses; legal standard", "status": "ok", "source": { "citation": "", "url": "" } },
>     "interpreter_provision": { "value": "", "notes": "who provides/pays; how to request", "status": "ok", "source": { "citation": "", "url": "" } },
>     "disability_accommodation_process": { "value": "", "notes": "ADA/equivalent; coordinator or form; deadline", "status": "ok", "source": { "citation": "", "url": "" } },
>     "victim_compensation_program": { "value": "", "notes": "eligibility basics; application deadline", "status": "ok", "source": { "citation": "", "url": "" } },
>     "address_confidentiality_program": { "value": "", "notes": "e.g., Safe at Home; how to enroll", "status": "ok", "source": { "citation": "", "url": "" } },
>     "trafficking_statute_of_limitations": { "value": "", "notes": "", "status": "ok", "source": { "citation": "", "url": "" } },
>     "victim_witness_assistance_contact": { "value": "", "notes": "official office name + how to reach", "status": "ok", "source": { "citation": "", "url": "" } },
>     "local_trafficking_help": { "value": "", "notes": "state coalition or national hotline serving this jurisdiction", "status": "ok", "source": { "citation": "", "url": "" } }
>   }
> }
> ```
>
> For each field, `status` is `"ok"` when you have a verified source, or
> `"unknown"` when you don't (with `value: null`). Prefer primary sources
> (statutes, court rules, official court/AG/victim-services sites) over secondary
> ones, and say so in the citation. For non-U.S. jurisdictions, map each field to
> the nearest local equivalent and note the local term in `notes`.
>
> After the final batch, give me one flat summary table (jurisdiction × field)
> showing just `ok` / `unknown` per cell, so I can see coverage at a glance.
