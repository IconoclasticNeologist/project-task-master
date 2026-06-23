import { useState, type ReactNode } from "react";
import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { copy } from "@/lib/copy";
import { ProfessionalShell } from "@/components/professional/ProfessionalShell";
import { getSupabase } from "@/lib/supabase/client";
import {
  getProfessionalSession,
  requestProfessionalSignIn,
} from "@/lib/auth/professional";
import {
  createClientInvite,
  createOrganization,
  createOrganizationMemberInvite,
  canCreateOrganization,
  isApprovedProfessional,
  listMyOrganizations,
  makeClientInviteCode,
  type AccessScope,
  redeemOrganizationMemberInvite,
  type OrganizationRole,
} from "@/lib/data/organizations";
import { accessScopeLabels, professionalRoleLabel } from "@/lib/data/access";

export const Route = createFileRoute("/professional")({
  head: () => ({ meta: [{ title: `${copy.professional.title} — The Advocate` }] }),
  component: ProfessionalScreen,
});

const teammateRoles: Exclude<OrganizationRole, "owner">[] = [
  "admin",
  "content_editor",
  "legal_reviewer",
  "wellbeing_reviewer",
  "lived_experience_reviewer",
  "legal_professional",
  "advocate",
  "case_worker",
  "clinical_professional",
  "justice_partner",
];

function ProfessionalScreen() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  if (pathname !== "/professional") return <Outlet />;

  const session = useQuery({
    queryKey: ["professional-session"],
    queryFn: getProfessionalSession,
  });

  if (session.isLoading) {
    return <Page><p className="text-sm text-muted-foreground">{copy.professional.loading}</p></Page>;
  }
  if (session.isError) {
    return <Page><Message title={copy.professional.title} body={copy.professional.signInFailed} /></Page>;
  }
  if (session.data?.kind === "anonymous") {
    return (
      <Page>
        <Card>
          <CardContent className="space-y-4 py-6">
            <h1 className="text-2xl font-normal tracking-tight">{copy.professional.anonymousTitle}</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">{copy.professional.anonymousBody}</p>
            <button
              type="button"
              onClick={() => {
                void getSupabase()
                  .auth.signOut()
                  .then(() => window.location.assign("/professional"));
              }}
              className="rounded-md bg-primary px-4 py-2.5 text-sm text-primary-foreground"
            >
              Sign out and sign in as a professional
            </button>
          </CardContent>
        </Card>
      </Page>
    );
  }
  if (session.data?.kind !== "professional") {
    return <ProfessionalSignIn />;
  }
  return <ProfessionalWorkspace />;
}

function Page({ children }: { children: ReactNode }) {
  return <ProfessionalShell>{children}</ProfessionalShell>;
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <Card>
      <CardContent className="space-y-3 py-6">
        <h1 className="text-2xl font-normal tracking-tight">{title}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}

function ProfessionalSignIn() {
  const [email, setEmail] = useState("");
  const signIn = useMutation({ mutationFn: requestProfessionalSignIn });

  return (
    <Page>
      <Card>
        <CardContent className="space-y-5 py-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-normal tracking-tight">{copy.professional.signInTitle}</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">{copy.professional.signInBody}</p>
          </div>
          {signIn.isSuccess ? (
            <p className="rounded-md bg-muted px-3 py-3 text-sm leading-relaxed text-foreground">
              {copy.professional.linkSent}
            </p>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (email.trim()) signIn.mutate(email.trim());
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="professional-email">{copy.professional.emailLabel}</Label>
                <Input
                  id="professional-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              {signIn.isError && <p className="text-sm text-destructive">{copy.professional.signInFailed}</p>}
              <button
                type="submit"
                disabled={signIn.isPending}
                className="rounded-md bg-primary px-4 py-2.5 text-sm text-primary-foreground disabled:opacity-60"
              >
                {copy.professional.sendLink}
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </Page>
  );
}

function ProfessionalWorkspace() {
  const queryClient = useQueryClient();
  const approval = useQuery({
    queryKey: ["professional-approval"],
    queryFn: isApprovedProfessional,
  });
  const creation = useQuery({
    queryKey: ["professional-organization-creation"],
    queryFn: canCreateOrganization,
    enabled: approval.data === true,
  });
  const organizations = useQuery({
    queryKey: ["my-organizations"],
    queryFn: listMyOrganizations,
  });
  const [form, setForm] = useState({ name: "", displayName: "", jurisdiction: "" });
  const setup = useMutation({
    mutationFn: createOrganization,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["my-organizations"] }),
  });

  return (
    <Page>
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-normal tracking-tight">{copy.professional.title}</h1>
        </header>

        {approval.isLoading || organizations.isLoading || (approval.data && creation.isLoading) ? (
          <p className="text-sm text-muted-foreground">{copy.professional.loading}</p>
        ) : approval.isError || organizations.isError || creation.isError ? (
          <Message title={copy.professional.title} body={copy.professional.createFailed} />
        ) : !approval.data ? (
          <Message title={copy.professional.approvalTitle} body={copy.professional.approvalBody} />
        ) : organizations.data?.length ? (
          <OrganizationTools organizations={organizations.data} />
        ) : !creation.data ? (
          <JoinOrganization />
        ) : (
          <div className="space-y-5">
            <Card>
              <CardContent className="space-y-5 py-6">
                <div className="space-y-2">
                  <h2 className="text-xl font-normal">{copy.professional.setupTitle}</h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">{copy.professional.setupBody}</p>
                </div>
                <form
                  className="space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (form.name.trim() && form.displayName.trim()) setup.mutate(form);
                  }}
                >
                  <Field
                    id="professional-name"
                    label={copy.professional.yourName}
                    value={form.displayName}
                    onChange={(displayName) => setForm((current) => ({ ...current, displayName }))}
                  />
                  <Field
                    id="organization-name"
                    label={copy.professional.organizationName}
                    value={form.name}
                    onChange={(name) => setForm((current) => ({ ...current, name }))}
                  />
                  <Field
                    id="organization-jurisdiction"
                    label={copy.professional.jurisdiction}
                    value={form.jurisdiction}
                    onChange={(jurisdiction) => setForm((current) => ({ ...current, jurisdiction }))}
                    required={false}
                  />
                  {setup.isError && <p className="text-sm text-destructive">{copy.professional.setupFailed}</p>}
                  <button
                    type="submit"
                    disabled={setup.isPending}
                    className="rounded-md bg-primary px-4 py-2.5 text-sm text-primary-foreground disabled:opacity-60"
                  >
                    {copy.professional.createOrganization}
                  </button>
                </form>
              </CardContent>
            </Card>
            <JoinOrganization />
          </div>
        )}
      </div>
    </Page>
  );
}

function JoinOrganization() {
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const join = useMutation({
    mutationFn: redeemOrganizationMemberInvite,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["my-organizations"] }),
  });

  return (
    <Card>
      <CardContent className="space-y-5 py-6">
        <div className="space-y-2">
          <h2 className="text-xl font-normal">{copy.professional.joinTitle}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{copy.professional.joinBody}</p>
        </div>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (code.trim() && displayName.trim()) {
              join.mutate({ code: code.trim(), displayName: displayName.trim() });
            }
          }}
        >
          <Field
            id="join-professional-name"
            label={copy.professional.joinNameLabel}
            value={displayName}
            onChange={setDisplayName}
          />
          <Field
            id="join-organization-code"
            label={copy.professional.joinCodeLabel}
            value={code}
            onChange={setCode}
          />
          {join.isError && <p className="text-sm text-destructive">{copy.professional.joinFailed}</p>}
          <button
            type="submit"
            disabled={join.isPending}
            className="rounded-md border border-border px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-60"
          >
            {copy.professional.joinOrganization}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}

function OrganizationTools({
  organizations,
}: {
  organizations: Awaited<ReturnType<typeof listMyOrganizations>>;
}) {
  const [organizationId, setOrganizationId] = useState(organizations[0]?.id ?? "");
  const [label, setLabel] = useState("");
  const [purpose, setPurpose] = useState<string>(copy.professional.defaultInvitePurpose);
  const [scopes, setScopes] = useState<AccessScope[]>(["logistics"]);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [teammateRole, setTeammateRole] = useState<Exclude<OrganizationRole, "owner">>("advocate");
  const [teammateCode, setTeammateCode] = useState<string | null>(null);
  const invite = useMutation({
    mutationFn: createClientInvite,
    onSuccess: (_inviteId, variables) => setInviteCode(variables.code),
  });
  const teammateInvite = useMutation({
    mutationFn: createOrganizationMemberInvite,
    onSuccess: (_inviteId, variables) => setTeammateCode(variables.code),
  });
  const selectedOrganization = organizations.find((organization) => organization.id === organizationId);
  const canInviteTeammates = selectedOrganization?.role === "owner" || selectedOrganization?.role === "admin";
  const canManageKnowledge = [
    "owner",
    "admin",
    "content_editor",
    "legal_reviewer",
    "wellbeing_reviewer",
    "lived_experience_reviewer",
  ].includes(selectedOrganization?.role ?? "");

  const toggleScope = (scope: AccessScope) => {
    setScopes((current) =>
      current.includes(scope) ? current.filter((item) => item !== scope) : [...current, scope],
    );
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="space-y-3 py-5">
          <h2 className="text-xl font-normal">{copy.professional.yourOrganizations}</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {organizations.map((organization) => (
              <li key={organization.id}>
                {organization.name}
                {organization.jurisdiction ? ` · ${organization.jurisdiction}` : ""}
              </li>
            ))}
          </ul>
          {organizations.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor="active-organization">{copy.professional.chooseOrganization}</Label>
              <select
                id="active-organization"
                value={organizationId}
                onChange={(event) => {
                  setOrganizationId(event.target.value);
                  setInviteCode(null);
                  setTeammateCode(null);
                }}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>{organization.name}</option>
                ))}
              </select>
            </div>
          )}
          {canManageKnowledge && (
            <Link
              to="/professional/knowledge"
              className="inline-flex rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              {copy.professional.openKnowledge}
            </Link>
          )}
          <Link
            to="/professional/clients"
            className="inline-flex rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            {copy.professional.openClientPlans}
          </Link>
        </CardContent>
      </Card>

      {canInviteTeammates && (
        <Card>
          <CardContent className="space-y-5 py-6">
            <div className="space-y-2">
              <h2 className="text-xl font-normal">{copy.professional.createTeamInviteTitle}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{copy.professional.createTeamInviteBody}</p>
            </div>
            {teammateCode ? (
              <div className="space-y-3 rounded-md border border-border bg-muted/40 p-4">
                <p className="text-sm font-medium text-foreground">{copy.professional.teamCodeTitle}</p>
                <p className="select-all break-all font-mono text-xl tracking-[0.18em] text-foreground">{teammateCode}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{copy.professional.teamCodeBody}</p>
                <p className="text-xs text-muted-foreground">{copy.professional.teamCodeExpires}</p>
                <button
                  type="button"
                  onClick={() => void navigator.clipboard.writeText(teammateCode)}
                  className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  {copy.professional.copyCode}
                </button>
              </div>
            ) : (
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!organizationId) return;
                  teammateInvite.mutate({
                    organizationId,
                    code: makeClientInviteCode(),
                    role: teammateRole,
                  });
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="teammate-role">{copy.professional.teamRoleLabel}</Label>
                  <select
                    id="teammate-role"
                    value={teammateRole}
                    onChange={(event) => setTeammateRole(event.target.value as Exclude<OrganizationRole, "owner">)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  >
                    {teammateRoles.map((role) => (
                      <option key={role} value={role}>{professionalRoleLabel(role)}</option>
                    ))}
                  </select>
                </div>
                {teammateInvite.isError && <p className="text-sm text-destructive">{copy.professional.teamInviteFailed}</p>}
                <button
                  type="submit"
                  disabled={teammateInvite.isPending}
                  className="rounded-md border border-border px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-60"
                >
                  {copy.professional.createTeamInvite}
                </button>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="space-y-5 py-6">
          <div className="space-y-2">
            <h2 className="text-xl font-normal">{copy.professional.createInviteTitle}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{copy.professional.createInviteBody}</p>
          </div>
          {inviteCode ? (
            <div className="space-y-3 rounded-md border border-border bg-muted/40 p-4">
              <p className="text-sm font-medium text-foreground">{copy.professional.inviteCodeTitle}</p>
              <p className="select-all break-all font-mono text-xl tracking-[0.18em] text-foreground">{inviteCode}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{copy.professional.inviteCodeBody}</p>
              <p className="text-xs text-muted-foreground">{copy.professional.codeExpires}</p>
              <button
                type="button"
                onClick={() => void navigator.clipboard.writeText(inviteCode)}
                className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                {copy.professional.copyCode}
              </button>
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (!organizationId || !purpose.trim() || scopes.length === 0) return;
                invite.mutate({
                  organizationId,
                  code: makeClientInviteCode(),
                  label,
                  scopes,
                  purpose: purpose.trim(),
                });
              }}
            >
              <Field id="invite-label" label={copy.professional.inviteLabel} value={label} onChange={setLabel} required={false} />
              <div className="space-y-2">
                <Label htmlFor="invite-purpose">{copy.professional.purposeLabel}</Label>
                <Textarea
                  id="invite-purpose"
                  value={purpose}
                  onChange={(event) => setPurpose(event.target.value)}
                  className="min-h-20"
                  required
                />
              </div>
              <fieldset className="space-y-3">
                <legend className="text-sm font-medium">{copy.professional.requestedAccess}</legend>
                {(Object.keys(accessScopeLabels) as AccessScope[]).map((scope) => (
                  <label key={scope} className="flex items-start gap-3 text-sm leading-relaxed text-foreground">
                    <Checkbox
                      checked={scopes.includes(scope)}
                      onCheckedChange={() => toggleScope(scope)}
                      aria-label={accessScopeLabels[scope]}
                    />
                    <span>{accessScopeLabels[scope]}</span>
                  </label>
                ))}
              </fieldset>
              {invite.isError && <p className="text-sm text-destructive">{copy.professional.createFailed}</p>}
              <button
                type="submit"
                disabled={invite.isPending || scopes.length === 0}
                className="rounded-md bg-primary px-4 py-2.5 text-sm text-primary-foreground disabled:opacity-60"
              >
                {copy.professional.createInvite}
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  required = true,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </div>
  );
}
