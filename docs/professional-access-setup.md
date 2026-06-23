# Professional access setup

Professional access is intentionally closed by default. A work email alone does
not grant access to client spaces.

## Before using the professional workspace

1. Apply the organizations-and-client-access migration.
2. In Supabase Auth, create or invite the initial professional user through an
   administrator-controlled process.
3. Add the professional's Auth user ID to the approval table. Only a database
   administrator or trusted server-side provisioning workflow should do this:

       insert into public.professional_approvals (
         auth_user_id,
         organization_creation_allowed
       ) values (
         '<auth-user-id>',
         true
       );

4. Add the deployed app's professional callback URL to Supabase Auth Redirect
   URLs:

       https://your-domain.example/professional

5. Require MFA for professional accounts before a real-world pilot. Review
   session lifetime, passwordless-email delivery, incident response, and
   organization approval procedures with the security owner.

The approved professional can then use the Professional workspace to create
their organization, invite approved teammates with a seven-day teammate code,
and create a short-lived client code. The client sees a pending access request
and must accept it before the professional can access any scoped client data.

## Adding a teammate

1. Create or invite the teammate's professional Auth account through the
   administrator-controlled process.
2. Add their Auth user ID to professional_approvals. Set
   organization_creation_allowed to false unless they should be able to create
   a separate organization.
3. An organization owner or administrator creates a teammate code and selects
   the teammate's role in the Professional workspace.
4. The teammate signs in with their own approved professional account and
   enters the seven-day code in the Join an organization section.

The invitation adds a staff membership only. It does not grant access to a
single client. A client must still accept a separately scoped access request.
Do not work around this model by sharing an owner's account.

## Important current boundary

Content-review workflows, jurisdictional knowledge publishing, and bespoke
court-plan content are separate upcoming slices.
