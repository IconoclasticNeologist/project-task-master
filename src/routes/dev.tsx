// The developer dashboard. NOT a survivor-facing surface — it is reachable
// only by direct URL, gated twice (magic-link sign-in, then the DEV_EMAILS
// allowlist inside advocate-admin), and shows system METADATA only.
//
// The rule that shapes every panel: no survivor content, ever. Codes and
// invites appear as labels + status; workspaces appear as the labels
// professionals chose; there is no path from here to anyone's words.
// Strings live inline (not in src/lib/copy) because copy/ is the audited
// survivor-language layer and this tool is neither survivor-facing nor
// translated.

import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabase } from "@/lib/supabase/client";
import { pageTitle, PRODUCT_NAME } from "@/lib/product";
import {
  approveProfessional,
  ensureSelfAccess,
  fetchAdminStatus,
  listAdminCodes,
  listAdminOrganizations,
  listAdminProfessionals,
  mintSurvivorCode,
  revokeProfessional,
} from "@/lib/data/admin";

export const Route = createFileRoute("/dev")({
  head: () => ({ meta: [{ title: pageTitle("Developer") }] }),
  component: DevScreen,
});

type Gate =
  | { kind: "checking" }
  | { kind: "signedOut" }
  | { kind: "linkSent" }
  | { kind: "denied"; message: string }
  | { kind: "ok" };

function fmtDay(iso: string | null): string {
  if (!iso) return "—";
  return iso.slice(0, 10);
}

function DevScreen() {
  const [gate, setGate] = useState<Gate>({ kind: "checking" });
  const [email, setEmail] = useState("");
  const [signInError, setSignInError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await getSupabase().auth.getUser();
      if (cancelled) return;
      const user = data.user;
      if (!user || user.app_metadata?.provider === "anonymous" || !user.email) {
        setGate({ kind: "signedOut" });
        return;
      }
      try {
        await fetchAdminStatus(); // the allowlist check
        await ensureSelfAccess(); // idempotent: gatekeeper + approval for the dev
        if (!cancelled) setGate({ kind: "ok" });
      } catch (e) {
        if (!cancelled) {
          setGate({ kind: "denied", message: e instanceof Error ? e.message : "Not allowed" });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sendLink = async () => {
    setSignInError(null);
    try {
      const { error } = await getSupabase().auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: new URL("/dev", window.location.origin).toString(),
          // Unlike the professional flow, the dev flow may create the auth
          // user: the DEV_EMAILS allowlist is the real gate, and a stray
          // account created here can do nothing anywhere.
          shouldCreateUser: true,
        },
      });
      if (error) throw new Error(error.message);
      setGate({ kind: "linkSent" });
    } catch (e) {
      setSignInError(e instanceof Error ? e.message : "Could not send the link");
    }
  };

  const signOut = async () => {
    await getSupabase().auth.signOut();
    setGate({ kind: "signedOut" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border">
          <span className="text-sm text-muted-foreground">{PRODUCT_NAME} — developer</span>
          {(gate.kind === "ok" || gate.kind === "denied") && (
            <button
              type="button"
              onClick={() => void signOut()}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Sign out
            </button>
          )}
        </header>
        <main className="flex flex-1 flex-col gap-6 py-8">
          {gate.kind === "checking" && <p className="text-sm text-muted-foreground">Checking…</p>}

          {gate.kind === "signedOut" && (
            <Card className="paper-shadow">
              <CardContent className="space-y-4 py-6">
                <h1 className="text-xl font-normal tracking-tight">Developer sign-in</h1>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Enter your email and we&apos;ll send a sign-in link. Access is limited to the
                  emails in the DEV_EMAILS secret.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="dev-email">Email</Label>
                  <Input
                    id="dev-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void sendLink()}
                  />
                </div>
                {signInError && <p className="text-sm text-destructive">{signInError}</p>}
                <button
                  type="button"
                  onClick={() => void sendLink()}
                  className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
                >
                  Send sign-in link
                </button>
              </CardContent>
            </Card>
          )}

          {gate.kind === "linkSent" && (
            <Card className="paper-shadow">
              <CardContent className="py-6 text-sm leading-relaxed text-muted-foreground">
                Check your email for the sign-in link. It brings you back here.
              </CardContent>
            </Card>
          )}

          {gate.kind === "denied" && (
            <Card className="paper-shadow">
              <CardContent className="space-y-2 py-6">
                <h1 className="text-xl font-normal tracking-tight">Not a developer account</h1>
                <p className="text-sm leading-relaxed text-muted-foreground">{gate.message}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Add this email to the DEV_EMAILS secret (Supabase → Edge Functions → Secrets) and
                  reload.
                </p>
              </CardContent>
            </Card>
          )}

          {gate.kind === "ok" && <Dashboard />}
        </main>
      </div>
    </div>
  );
}

function Dashboard() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-normal tracking-tight">Developer dashboard</h1>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          System health, codes, professionals, and organizations. Survivor words are never visible
          here — row-level security keeps them out of reach even for this dashboard, by design.
        </p>
      </header>
      <ReadinessPanel />
      <MintPanel />
      <CodesPanel />
      <ProfessionalsPanel />
      <OrganizationsPanel />
    </div>
  );
}

function ReadinessPanel() {
  const status = useQuery({ queryKey: ["admin-status"], queryFn: fetchAdminStatus });
  const s = status.data;
  const flag = (ok: boolean, label: string, detail?: string) => (
    <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
      <span>{label}</span>
      <span className={ok ? "text-foreground" : "text-destructive"}>
        {ok ? (detail ?? "ready") : (detail ?? "not set")}
      </span>
    </div>
  );
  return (
    <Card className="paper-shadow">
      <CardHeader>
        <CardTitle className="text-base font-normal">Readiness</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {status.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {status.isError && <p className="text-sm text-destructive">Couldn&apos;t load status.</p>}
        {s && (
          <>
            {flag(s.config.gemini, "Gemini key (voice, agents, drafts)")}
            {flag(
              s.config.liveavatar,
              "LiveAvatar key (practice person)",
              s.config.liveavatar
                ? s.config.liveavatarSandbox
                  ? "ready · sandbox"
                  : "ready · LIVE (spends credits)"
                : "not set — voice-only fallback",
            )}
            {flag(
              true,
              "Media sessions today",
              `${s.counters.mediaSessionsToday} of ${s.config.dailyCap}`,
            )}
            <div className="grid grid-cols-2 gap-2 pt-1 text-sm">
              <div className="rounded-md border border-border px-3 py-2">
                <div className="text-xs text-muted-foreground">People with a space</div>
                <div>{s.counters.survivors}</div>
              </div>
              <div className="rounded-md border border-border px-3 py-2">
                <div className="text-xs text-muted-foreground">Organizations</div>
                <div>{s.counters.organizations}</div>
              </div>
              <div className="rounded-md border border-border px-3 py-2">
                <div className="text-xs text-muted-foreground">Approved professionals</div>
                <div>{s.counters.approvedProfessionals}</div>
              </div>
              <div className="rounded-md border border-border px-3 py-2">
                <div className="text-xs text-muted-foreground">Unused survivor codes</div>
                <div>{s.counters.unredeemedCodes}</div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function MintPanel() {
  const queryClient = useQueryClient();
  const [label, setLabel] = useState("");
  const [minted, setMinted] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const mint = useMutation({
    mutationFn: mintSurvivorCode,
    onSuccess: (code) => {
      setMinted(code);
      setCopied(false);
      setLabel("");
      void queryClient.invalidateQueries({ queryKey: ["admin-codes"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-status"] });
    },
  });
  return (
    <Card className="paper-shadow">
      <CardHeader>
        <CardTitle className="text-base font-normal">Mint a survivor access code</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs leading-relaxed text-muted-foreground">
          The code is shown once, here, and stored only as a hash. It expires in 30 days if unused.
          Give it to one person.
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="A label you'll recognize (e.g. demo-judges)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <button
            type="button"
            disabled={mint.isPending || !label.trim()}
            onClick={() => mint.mutate(label.trim())}
            className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-40"
          >
            Mint
          </button>
        </div>
        {mint.isError && (
          <p className="text-sm text-destructive">
            {mint.error instanceof Error ? mint.error.message : "Could not mint"}
          </p>
        )}
        {minted && (
          <div className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2">
            <code className="text-base tracking-widest">{minted}</code>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(minted).then(() => setCopied(true));
              }}
              className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CodesPanel() {
  const codes = useQuery({ queryKey: ["admin-codes"], queryFn: listAdminCodes });
  return (
    <Card className="paper-shadow">
      <CardHeader>
        <CardTitle className="text-base font-normal">Codes &amp; invites</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {codes.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {codes.isError && <p className="text-sm text-destructive">Couldn&apos;t load codes.</p>}
        {codes.data && (
          <>
            <div>
              <h3 className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                Survivor access codes
              </h3>
              {codes.data.accessCodes.length === 0 && (
                <p className="text-sm text-muted-foreground">None yet.</p>
              )}
              <div className="space-y-1">
                {codes.data.accessCodes.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <span>{c.label ?? "(no label)"}</span>
                    <span className="text-xs text-muted-foreground">
                      {c.issuedBy} · {fmtDay(c.createdAt)} ·{" "}
                      {c.redeemed
                        ? "used"
                        : c.expiresAt && c.expiresAt < new Date().toISOString()
                          ? "expired"
                          : "unused"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                Organization client invites
              </h3>
              {codes.data.clientInvites.length === 0 && (
                <p className="text-sm text-muted-foreground">None yet.</p>
              )}
              <div className="space-y-1">
                {codes.data.clientInvites.map((i) => (
                  <div
                    key={i.id}
                    className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <span>
                      {i.label ?? "(no label)"}{" "}
                      <span className="text-xs text-muted-foreground">— {i.organization}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {fmtDay(i.createdAt)} · {i.redeemed ? "used" : "unused"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ProfessionalsPanel() {
  const queryClient = useQueryClient();
  const pros = useQuery({ queryKey: ["admin-pros"], queryFn: listAdminProfessionals });
  const [approveEmail, setApproveEmail] = useState("");
  const [allowOrg, setAllowOrg] = useState(true);
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-pros"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-status"] });
  };
  const approve = useMutation({
    mutationFn: ({ email, allow }: { email: string; allow: boolean }) =>
      approveProfessional(email, allow),
    onSuccess: () => {
      setApproveEmail("");
      refresh();
    },
  });
  const revoke = useMutation({ mutationFn: revokeProfessional, onSuccess: refresh });

  return (
    <Card className="paper-shadow">
      <CardHeader>
        <CardTitle className="text-base font-normal">Professionals</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 rounded-md border border-border px-3 py-3">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Approving an email also creates its sign-in-able account, so their magic link works
            right away. They still need an organization (they can create one if allowed below, or
            join with a teammate code).
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="professional@example.org"
              type="email"
              value={approveEmail}
              onChange={(e) => setApproveEmail(e.target.value)}
            />
            <button
              type="button"
              disabled={approve.isPending || !approveEmail.includes("@")}
              onClick={() => approve.mutate({ email: approveEmail.trim(), allow: allowOrg })}
              className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-40"
            >
              Approve
            </button>
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={allowOrg}
              onChange={(e) => setAllowOrg(e.target.checked)}
            />
            May create an organization
          </label>
          {approve.isError && (
            <p className="text-sm text-destructive">
              {approve.error instanceof Error ? approve.error.message : "Could not approve"}
            </p>
          )}
        </div>

        {pros.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {pros.isError && (
          <p className="text-sm text-destructive">Couldn&apos;t load professionals.</p>
        )}
        {pros.data && pros.data.professionals.length === 0 && (
          <p className="text-sm text-muted-foreground">No professional accounts yet.</p>
        )}
        <div className="space-y-2">
          {pros.data?.professionals.map((p) => {
            const active = p.approval && !p.approval.revokedAt;
            return (
              <div key={p.id} className="rounded-md border border-border px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>{p.email}</span>
                  <span className="text-xs text-muted-foreground">
                    {active ? "approved" : p.approval ? "revoked" : "not approved"}
                    {p.approval?.orgCreationAllowed && active ? " · may create orgs" : ""}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {p.memberships.length === 0
                      ? "No organization yet"
                      : p.memberships
                          .map((m) => `${m.organization} (${m.role.replace(/_/g, " ")})`)
                          .join(" · ")}
                    {" · last sign-in "}
                    {fmtDay(p.lastSignIn)}
                  </span>
                  {active ? (
                    <button
                      type="button"
                      disabled={revoke.isPending}
                      onClick={() => revoke.mutate(p.email)}
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      Revoke
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={approve.isPending}
                      onClick={() => approve.mutate({ email: p.email, allow: allowOrg })}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Approve
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function OrganizationsPanel() {
  const orgs = useQuery({ queryKey: ["admin-orgs"], queryFn: listAdminOrganizations });
  return (
    <Card className="paper-shadow">
      <CardHeader>
        <CardTitle className="text-base font-normal">Organizations &amp; consent</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {orgs.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {orgs.isError && (
          <p className="text-sm text-destructive">Couldn&apos;t load organizations.</p>
        )}
        {orgs.data && orgs.data.organizations.length === 0 && (
          <p className="text-sm text-muted-foreground">No organizations yet.</p>
        )}
        {orgs.data?.organizations.map((o) => (
          <div key={o.id} className="space-y-2 rounded-md border border-border px-3 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">{o.name}</span>
              <span className="text-xs text-muted-foreground">
                {o.jurisdiction ?? ""} · since {fmtDay(o.createdAt)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {o.members.length === 0
                ? "No members"
                : o.members
                    .map((m) => `${m.displayName ?? "unnamed"} (${m.role.replace(/_/g, " ")})`)
                    .join(" · ")}
            </p>
            {o.workspaces.length > 0 && (
              <div className="space-y-1">
                {o.workspaces.map((w, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-md bg-secondary px-3 py-1.5 text-xs"
                  >
                    <span>{w.label}</span>
                    <span className="text-muted-foreground">
                      {w.activeGrants} active · {w.pendingGrants} pending consent
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        <p className="text-xs leading-relaxed text-muted-foreground">
          Workspace names are the labels professionals chose. What a person shares, and with whom,
          is decided by them on their own Team screen — nothing here can change or read it.
        </p>
      </CardContent>
    </Card>
  );
}
