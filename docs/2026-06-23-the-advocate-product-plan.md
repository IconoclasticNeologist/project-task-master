# The Advocate — Product Plan for Safe, Scalable Court Preparation

## 1. Product promise

The Advocate helps adult survivors of trafficking understand court, prepare
practically and emotionally, and work with their chosen support team without
being pressured to disclose, coached on what to say, or treated as a case file.

It is a collaboration product for survivor-witnesses, legal teams, advocates,
care providers, and service organizations. It is not a lawyer, a therapist, a
crisis service, or a testimony-writing tool.

The first product boundary is deliberately narrow:

- U.S.-first, adult survivor-witnesses in criminal-court contexts.
- General education plus organization-approved, jurisdiction-specific
  information.
- No legal conclusions, no diagnosis, no testimony scripting, and no
  determination of whether a person was trafficked.
- A human professional remains responsible for case advice, clinical care, and
  any decision affecting a legal proceeding.

The ambition is high, but “all pain points for all stakeholders” must not mean
universal access to a survivor's information. The product earns trust by making
the right information easier to find while keeping control with the survivor.

## 2. Outcomes and non-negotiable principles

### Outcomes

For survivor-witnesses:

- Less uncertainty about what court may be like.
- More control over pace, privacy, support, and accommodations.
- Fewer repeated explanations of the same logistical information.
- Clear paths to a real person when a question needs one.

For professionals and organizations:

- One reviewed source of truth for local court information and resources.
- A consent-respecting way to personalize a client experience.
- Clear handoffs among legal, advocacy, and wellbeing roles.
- Less repetitive logistics work and better visibility into what information
  has been offered, read, or needs updating.

For the justice ecosystem:

- Better-informed participation without influencing the substance of testimony.
- Fewer missed logistical needs, such as interpreters, transport, safety
  planning, and disability accommodation requests.

### Non-negotiable principles

1. Survivor agency. A person decides what is shared, with whom, for what
   purpose, and for how long. Revocation must be as easy as granting access.
2. Least privilege. A role never grants blanket access. Permissions are scoped
   to a client, data category, and purpose.
3. Separation of care and case. Legal, advocacy, clinical, and operational
   notes stay separate by default. Sharing across those boundaries is explicit.
4. Sources over assertions. Any legal or court-process content shown by the
   application has a source, jurisdiction, review status, and effective date.
5. Human accountability. AI may retrieve, explain, summarize, and route. It
   never silently decides, labels, advises, or replaces a professional.
6. Safety by default. No raw client data is used for analytics, model training,
   or offline caches. A quick exit and low-trace use remain first-class.
7. Plain language and access. Content is understandable, multilingual,
   screen-reader friendly, low-bandwidth capable, and usable under stress.
8. No false promises. The app never promises confidentiality, privilege,
   availability of an accommodation, or a legal outcome.

## 3. Stakeholders and product jobs

| Stakeholder | Job the product should help with | Boundary |
| --- | --- | --- |
| Survivor-witness | Understand an upcoming process, make a plan, save their own words, choose support, and ask for help. | Owns personal content and sharing choices. |
| Attorney / legal team | Give accurate, case-appropriate logistics and resources without coaching testimony. | No automatic access to private wellbeing or narrative content. |
| Advocate / case worker | Coordinate practical support, local resources, appointments, safety planning, and warm handoffs. | Cannot see legal or clinical material unless specifically shared. |
| Therapist / clinician | Offer approved coping and wellbeing resources, and understand logistics that affect care. | Does not receive legal strategy or case facts by default. |
| Organization leader | Maintain quality, policies, staff access, and a local resource directory. | Cannot browse all client material merely because they administer the organization. |
| Content reviewer | Publish sources and plain-language cards that are current for a jurisdiction. | Cannot publish their own high-risk legal content without required approval. |
| Court / justice partner | Contribute public procedural information and accommodation guidance. | No client access; contribution is editorial, not case participation. |

## 4. Experience model

The product has three distinct surfaces. They should not be merged into one
dashboard.

### A. Survivor space

This remains calm, private, and choice-led:

- My next step: a simple, current view of what may happen and who can help.
- Court guide: modular plain-language cards appropriate to the selected
  jurisdiction and stage, with sources and “what may vary” labels.
- My plan: logistics, support people, grounding preferences, accommodation
  questions, safe transportation, and post-court care.
- My words and papers: survivor-controlled statements, timeline, and documents.
- My team: clear view of who has access to which categories; grant, limit, or
  end access.
- Ask a question: an AI explanation only when it can cite approved information;
  otherwise a routed question to a chosen human.

The survivor must be able to use a pseudonym, avoid entering a legal name, opt
out of notifications, quickly leave the app, and see a plain explanation before
each new sharing choice.

### B. Professional workspace

Each organization has a separate workspace:

- Client roster, invitation status, and consent/access status.
- A client preparation board that holds only approved logistics and modules
  selected for that client.
- Support-plan tasks: transportation, interpreter request, court orientation,
  advocate attendance, local resource connection, and follow-up.
- Secure, permissioned requests for a client or teammate; never a free-for-all
  internal chat log.
- A knowledge library, resource directory, review queue, expiration alerts, and
  audit history.

### C. Public support and learning

A minimal public page should provide verified national support and “quick exit”
information without requiring an account. It must be independently maintained,
region-aware, and never rely on an AI response for urgent support.

## 5. Permissions and consent model

Replace the current one gatekeeper-to-one survivor relationship with
organization membership plus client-scoped access grants.

### Roles

| Role | Core capability | Default client access |
| --- | --- | --- |
| Platform operator | Operates the service and investigates security incidents. | None; exceptional, time-limited, audited break-glass only. |
| Organization owner | Manages organization policy and billing. | None by default. |
| Organization admin | Invites staff, configures organization settings. | None by default. |
| Content editor | Creates drafts, sources, local resources, and templates. | No client material. |
| Legal reviewer | Approves legally sensitive content for a jurisdiction. | No client material unless separately granted. |
| Trauma/wellbeing reviewer | Approves trauma-informed content and interaction wording. | No client material unless separately granted. |
| Legal professional | Prepares client-specific logistics and responds to questions. | Explicit client grant only. |
| Advocate/case worker | Coordinates support and approved preparation modules. | Explicit client grant only. |
| Clinical professional | Contributes wellbeing modules or care-plan items. | Explicit client grant only. |
| Client/survivor | Owns their space and controls consent. | Full access to own content. |

### Access grants

Every professional-to-client relationship is an explicit, auditable grant:

- Scope: logistics, support plan, selected shared statements, selected timeline
  items, selected documents, client questions, or named custom modules.
- Purpose: legal support, advocacy, clinical care, resource coordination, or
  content review.
- Duration: one-time, date-limited, ongoing, or revoked.
- Consent record: who granted it, plain-language disclosure shown, when it
  expires, and any special restrictions.

A client sees the access list in human terms, not database terms. “Jordan can
see your court-plan checklist until August 15” is useful; “read:documents” is
not.

## 6. Bespoke client experience

Personalization must be structured, inspectable, and reversible. A professional
should be able to choose from approved building blocks, not compose a secret
system prompt.

### Safe personalization controls

- Jurisdiction and court: federal/state, county, court name, hearing stage.
- Logistics: courthouse address, transit/parking guidance, accessibility route,
  likely security procedures, scheduled arrival plan, and verified contacts.
- Support: approved local resources, assigned advocate, interpreter or
  accommodation request status, transportation and childcare plan.
- Learning modules: which reviewed cards are useful for this client now.
- Communication: preferred language, reading level, notification channel, and
  no-contact times.
- Team: exactly which professionals participate and what each can see.

### Controls that are prohibited

- Custom instructions that tell the AI how to interpret a client's experience,
  assess credibility, or decide a legal label.
- Cross-examination answer scripts, memory-recovery prompts, or “make this
  statement stronger” tools.
- Unreviewed legal claims presented as fact.
- A staff member turning on visibility to private narrative, clinical, or
  document data without the client's separate grant.

## 7. Knowledge and content governance

Professional knowledge is a product capability, not an unmoderated file upload.

### Knowledge lifecycle

1. Draft: an editor adds a source with publisher, direct link, jurisdiction,
   source type, effective date, extraction method, and proposed cards.
2. Validate: the system checks required metadata, duplicate sources, URLs,
   expiry, and obvious prompt-injection patterns. It does not certify legal
   accuracy.
3. Review: appropriate reviewers approve the claim and wording. High-risk
   legal/court content requires a legal reviewer; survivor-facing interaction
   language requires trauma/wellbeing review.
4. Publish: the approved version is released to a defined scope: global,
   organization, jurisdiction, program, or named client.
5. Retrieve: only published, in-scope, unexpired material may enter AI context.
6. Monitor: an owner receives expiry/review alerts. Retired content disappears
   from AI retrieval but remains auditable.

### Required content records

- Source and source version
- Jurisdiction and court-system applicability
- Claim type: law/rule, official guidance, research, professional practice, or
  local operational information
- Plain-language content card(s)
- Citation and direct source link per substantive claim
- Owner, reviewers, approval decision, review date, and next review date
- Risk class: low, legal-sensitive, trauma-sensitive, or critical safety
- Language variants and translation reviewer

The existing Perplexity document is intake material only. It must be normalized
into these records and rechecked against primary or official sources before
publication. Secondary sources are useful leads, not automatic authority.

## 8. AI design and hard safeguards

AI should make a trustworthy knowledge system easier to use; it should not
become the knowledge system.

### Context assembly order

1. Platform safety policy, fixed in server-side code and not editable by any
   organization.
2. The user's role and the action they are allowed to perform.
3. Published global, organization, and jurisdiction-specific material that
   matches the request.
4. Client-specific modules and facts only if the client has granted the
   necessary scope.
5. The user’s current question.

The model receives the minimum required context. It never receives a whole
client record “just in case.”

### Permitted AI work

- Explain cited court-process information in plain language.
- Translate approved content while preserving uncertainty and citations.
- Summarize a chosen document for its owner or a permitted professional.
- Help staff turn a source into a draft card marked “needs review.”
- Find approved resources by jurisdiction and eligibility.
- Create a question list for the user to take to their advocate or attorney.
- Route a question to a human when there is no safe cited answer.

### Prohibited AI work

- Legal advice, legal conclusions, outcome prediction, or jurisdiction-specific
  assertions without an approved source.
- Determining trafficking, coercion, credibility, or the truth of an account.
- Testimony rehearsal that supplies content or suggested answers.
- Asking repeated, leading, or emotionally coercive questions.
- Using sexual-history information as a retrieval or reflection target.
- Publishing, changing permissions, or contacting another person without
  explicit human confirmation.

### Response contract

Every AI answer that makes a factual court or legal-process claim must show:

- A plain-language confidence/variation label.
- Linked source titles and version dates.
- The jurisdiction it covers.
- A short “ask your [role]” handoff when facts depend on the person’s case.

The service stores an AI decision log containing model/version, policy version,
source IDs, action type, and safety outcome. It minimizes or excludes raw
client text and is never used to train a model without separate, meaningful
consent.

## 9. Technical architecture

The existing stack—React/TanStack, Supabase Auth/Postgres/Storage/RLS, edge
functions, and a server-side AI layer—is viable. It needs a multi-tenant
authorization redesign before professional access is enabled.

### Core entities to add

- organizations: organization identity, policy profile, default jurisdiction,
  retention settings.
- organization_memberships: authenticated professional, role, status, MFA
  requirement, and organization.
- client_profiles: a successor to the current survivor record; minimize PII and
  support an alias.
- client_workspaces: the client’s program/case-preparation context. Avoid
  naming it “case” unless legal counsel approves that data model.
- client_access_grants: member-to-client consent scopes, purpose, validity, and
  revocation history.
- court_plans: structured client-selected logistics, supports, and stages.
- knowledge_sources and source_versions: source provenance and extraction.
- knowledge_items and knowledge_revisions: reviewed cards/modules, citations,
  scopes, and publication lifecycle.
- knowledge_approvals: decisions by required reviewer types.
- resources: verified directory records with area, availability, and review
  dates.
- ai_runs and audit_events: privacy-minimized accountability records.

### Authorization

- Professional accounts use verified email or an organization-approved sign-in
  method plus MFA. Survivor accounts may remain low-PII/pseudonymous when it
  is safe to do so.
- Every browser query is protected by row-level security that checks the
  specific access grant. Role names alone are insufficient.
- Service-role credentials stay in server functions only. Storage uses signed,
  short-lived URLs and mirrors database access rules.
- Add automated RLS tests for every role, scope, revocation, organization
  boundary, and shared-device scenario.

### Data protections

- Encrypt sensitive values at rest; do not log request bodies, access tokens,
  document text, or generated answers by default.
- Keep survivor records out of browser local storage, offline caches,
  analytics products, error tracking payloads, and model-training datasets.
- Provide export, delete, consent-history, retention, and redaction workflows.
- Threat-model shared devices, coercive partners, browser history, notification
  previews, email access, and workplace administrators.
- Obtain counsel on privilege, work-product, HIPAA/health-data implications,
  mandatory reporting, data residency, retention, and breach obligations before
  representing any protection as guaranteed.

## 10. Delivery plan

### Phase 0 — Safety and product discovery

Define the first jurisdiction, user population, pilot organizations, legal
entity/data obligations, and success criteria. Conduct paid sessions with
survivor advisors, legal counsel, advocates, therapists, accessibility experts,
and victim-witness personnel. Establish a compensated survivor advisory board
with real decision rights.

Exit gate: written scope, content-review charter, escalation policy,
accessibility target, threat model, and “not safe to ship” list.

### Phase 1 — Safe survivor-facing foundation

Replace public placeholders with verified, owned content. Launch a public
support page, cited general court guide, clear limitation language, accessible
care-plan tools, and a client sharing dashboard. Hide—not merely label—features
whose wording or workflow has not passed review.

Exit gate: content is source-complete; every support contact is verified; no
review-gated agent is survivor-visible; accessibility and security testing pass.

### Phase 2 — Organization and consent foundation

Add organizations, professional sign-in/MFA, memberships, client invitations,
scoped grants, client access dashboard, revocation, and audit log. Migrate the
current gatekeeper relationship without breaking current survivor records.

Exit gate: automated authorization tests prove cross-organization isolation and
immediate revocation; professionals cannot see data without a client grant.

### Phase 3 — Reviewed knowledge library

Build the source intake, review, publication, jurisdiction tagging, resource
directory, expiry, and citations UI. Begin with human-authored cards; source
extraction assists editors but cannot auto-publish.

Exit gate: all released claims have source/version/reviewer metadata and a
named owner; expired content is excluded from display and AI retrieval.

### Phase 4 — Bespoke court-preparation workspaces

Add structured client plans, local-court templates, custom module selection,
support coordination tasks, secure client questions, and professional
collaboration with role boundaries.

Exit gate: a pilot team can configure a client experience without editing a
prompt or code; client consent and each customization are visible and
reversible.

### Phase 5 — Cited AI assistant

Release constrained AI against the approved knowledge base. Start with
explanation, translation, resource matching, and question routing; do not begin
with testimony practice. Implement response citations, human escalation,
evaluation suites, abuse monitoring, and source-trace logging.

Exit gate: red-team testing demonstrates refusal and safe routing for legal
advice, testimony coaching, distress, prompt injection, cross-tenant data
requests, and sexual-history-sensitive prompts.

### Phase 6 — Evaluated pilot and scale

Run a limited, supported pilot with selected organizations. Measure
understanding, agency, accessibility, safety events, content staleness, and
professional coordination. Change the product only through reviewed learning,
not anecdote or engagement metrics.

Exit gate: independent security review, accessibility audit, advisory-board
review, pilot report, and evidence that no safety metric worsened.

## 11. Measures that matter

Do not use time-in-app, disclosure volume, or AI conversation length as success
metrics. They reward the wrong behavior.

Use:

- Survivor-reported understanding, choice, emotional safety, and ability to
  find a human support person.
- Percentage of court-process content with valid current sources and explicit
  jurisdiction.
- Time for a professional to create a reviewed, client-approved court plan.
- Resource referral completion and correction rate.
- Permission clarity, successful revocations, and zero unauthorized-access
  findings in automated and manual tests.
- Accessibility conformance and usability with assistive technology.
- AI source-citation rate, safe-handoff rate, refusal quality, and human review
  of high-risk interactions.

## 12. Decisions needed before implementation

1. First pilot jurisdiction and organization type.
2. Whether the first release is strictly adults; do not add minors without a
   separate safeguarding, consent, and reporting design.
3. Which professional roles are eligible for client access in the first pilot.
4. Who has final authority for legal, clinical/trauma, accessibility, privacy,
   and lived-experience review.
5. Whether the product will store any attorney-client communications or legal
   work product. The safer first answer is no.
6. Data-retention period, regional hosting needs, and incident-response owner.
7. Funding for ongoing content verification, survivor advisory participation,
   moderation/escalation, security review, and support operations.

## 13. Immediate next build slice

The highest-leverage next slice is not more AI. It is:

1. Normalize the Perplexity research into a reviewed source and content-card
   backlog.
2. Build organization membership, client access grants, and a survivor-visible
   sharing/revocation screen.
3. Add a minimal professional workspace with a client court-plan editor and
   resource directory.
4. Keep AI limited to source-grounded explanations until the governance,
   permissions, and evaluation layers are proven.

That sequence makes bespoke experiences possible without making the application
less safe, less private, or less truthful.
