# The Advocate — Running launch checklist

This is the living handoff list for work that requires a human decision,
specialist review, deployment access, or real-world coordination. It is kept
separate from the engineering backlog so no important launch task gets lost in
code changes.

Last updated: 2026-06-23

## Built in the app

- [x] Client-owned private/shareable records, documents, timeline, and care plan.
- [x] Organization, client workspace, access-request, consent, revocation, and
  access-audit database design.
- [x] Survivor-visible “Your team” screen for reviewing, accepting, declining,
  and ending scoped access.
- [x] Professional workspace for approved organization owners to create a
  short-lived client invite code.
- [x] Client invitation flow creates a pending access request; it does not
  silently give a professional access.
- [x] Short-lived staff-member invitations and staff role assignment.
- [x] Source records, draft cards, risk-based review, and gated publishing.
- [x] Client-owned court-plan editor with scoped category permissions.
- [x] Professional client roster and scoped court-plan editor.
- [x] Verified resource-directory data model with source, second-person
  verification, review date, and published-only client visibility.
- [x] Published-only, source-linked knowledge retrieval boundary.
- [x] Model-agnostic retrieval safety/evaluation cases.
- [ ] Resource-directory editor/client display and a passing source-cited AI
  evaluation run before connecting any model to client-facing content.
- [ ] Source-cited AI retrieval and evaluation suite.

## Required before applying the new professional-access migration

- [ ] Back up the Supabase database and confirm the target project/environment.
- [ ] Apply the 20260623000001_organizations_and_client_access migration.
- [ ] Regenerate Supabase TypeScript types after applying the migration.
- [ ] Run the full test suite and production build against the configured
  Supabase environment.
- [ ] Confirm the existing gatekeeper-to-survivor relationships that will be
  represented as visible, revocable legacy grants.

## Professional account controls

- [ ] Create/invite the first professional Auth user through an
  administrator-controlled process.
- [ ] Add that Auth user ID to professional_approvals with
  organization_creation_allowed = true. Follow
  docs/professional-access-setup.md.
- [ ] Add the deployed /professional URL to Supabase Auth Redirect URLs.
- [ ] Require MFA for professional accounts before any pilot.
- [ ] Name a platform security owner who can approve, revoke, and investigate
  professional access.
- [ ] Define the process for approving organization owners, staff members, and
  organization changes. Do not share owner accounts.

## Product decisions

- [ ] Confirm the first pilot jurisdiction, court system, and partner
  organization.
- [ ] Confirm the initial audience is adults only. Do not add minors without a
  separate safeguarding and reporting design.
- [ ] Decide which professional roles can access which client scopes in the
  first pilot.
- [ ] Decide whether client communications may be stored in the app. The safer
  first release is logistics/questions only, not attorney-client messages or
  clinical notes.
- [ ] Choose data-retention, deletion, export, breach-response, and
  accessibility owners.

## Content and safety review

- [ ] Have a licensed attorney review every jurisdiction-specific legal or
  court-process claim before publication.
- [ ] Have a trauma-informed specialist review survivor-visible prompts,
  wording, and workflows.
- [ ] Have lived-experience advisors review the client flow, language, power
  dynamics, and quick-exit behavior. Compensate advisors for their time.
- [ ] Replace the support-directory placeholders with verified contacts,
  eligibility, hours, languages, and review dates.
- [ ] Normalize the Perplexity research into source records; verify high-impact
  claims against primary or official sources before publishing.
- [ ] Decide whether any reflection or witness-practice capability should be
  survivor-visible. Keep review-gated features hidden until approved.

## Security and pilot readiness

- [ ] Complete RLS tests for every role, client scope, revocation, and
  cross-organization boundary.
- [ ] Run an independent security review and privacy/threat-model workshop.
- [ ] Test shared-device, browser-history, notification-preview, coercion, and
  quick-exit scenarios.
- [ ] Complete an accessibility audit, including screen reader, keyboard,
  low-vision, reduced-motion, and low-bandwidth testing.
- [ ] Define human escalation paths for distress, urgent safety concerns,
  inaccessible content, and incorrect legal/court information.
- [ ] Run a limited pilot with a support plan, feedback process, and clear
  stop/rollback criteria.
