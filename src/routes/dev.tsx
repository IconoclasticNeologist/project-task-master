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
import { isDeviceDemoFlagOn, setDemoToolsEnabled } from "@/lib/data/demoTools";
import { pageTitle, PRODUCT_NAME } from "@/lib/product";
import {
  approveProfessional,
  avatarKeyCheck,
  copilotTurn,
  deleteAcknowledgement,
  deleteKnowledge,
  ensureSelfAccess,
  fetchAdminStatus,
  getAgentConfig,
  getGuardrails,
  improvePrompt,
  listAdminCodes,
  listAdminOrganizations,
  listAdminProfessionals,
  listAcknowledgements,
  listAgentStats,
  listAvatars,
  listKnowledge,
  mintSurvivorCode,
  resetPrompt,
  revokeProfessional,
  saveAcknowledgement,
  saveKnowledge,
  setAgentConfig,
  setGuardrails,
  setPrompt,
  type AckRow,
  type AgentOps,
  type AgentPromptInfo,
  type Guardrails,
  type ImproveResult,
  type KnowledgeRow,
} from "@/lib/data/admin";
import { Textarea } from "@/components/ui/textarea";
import { useGeminiLive } from "@/lib/voice/useGeminiLive";
import { useLiveAvatarPractice } from "@/lib/voice/useLiveAvatarPractice";

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
  const [setupWarning, setSetupWarning] = useState<string | null>(null);
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
      // The allowlist check. Only a failure HERE means "not a developer".
      try {
        await fetchAdminStatus();
      } catch (e) {
        if (!cancelled) {
          setGate({ kind: "denied", message: e instanceof Error ? e.message : "Not allowed" });
        }
        return;
      }
      if (cancelled) return;
      setGate({ kind: "ok" });
      // Post-gate setup (gatekeeper + approval for the dev). A failure is
      // shown as a banner on the dashboard, never as an access denial.
      try {
        await ensureSelfAccess();
      } catch (e) {
        if (!cancelled) {
          setSetupWarning(e instanceof Error ? e.message : "Setup step failed");
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
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6">
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

          {gate.kind === "ok" && <Dashboard setupWarning={setupWarning} />}
        </main>
      </div>
    </div>
  );
}

type DevSection =
  | "overview"
  | "copilot"
  | "agents"
  | "prompts"
  | "guardrails"
  | "knowledge"
  | "monitor"
  | "try"
  | "acknowledgements"
  | "access"
  | "orgs";

const DEV_SECTIONS: Array<{ id: DevSection; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "copilot", label: "✦ Copilot" },
  { id: "agents", label: "Agents" },
  { id: "prompts", label: "Prompts" },
  { id: "guardrails", label: "Guardrails" },
  { id: "knowledge", label: "Knowledge" },
  { id: "monitor", label: "Monitor" },
  { id: "try", label: "Try it" },
  { id: "acknowledgements", label: "Acknowledgements" },
  { id: "access", label: "Access & codes" },
  { id: "orgs", label: "Organizations" },
];

function Dashboard({ setupWarning }: { setupWarning: string | null }) {
  const [section, setSection] = useState<DevSection>("overview");
  return (
    <div className="flex flex-col gap-6 md:flex-row">
      {/* Left nav (top-scrolling row on mobile, sidebar on desktop). */}
      <nav className="md:w-44 md:shrink-0">
        <ul className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
          {DEV_SECTIONS.map((s) => (
            <li key={s.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setSection(s.id)}
                className={
                  section === s.id
                    ? "w-full whitespace-nowrap rounded-md bg-foreground/10 px-3 py-2 text-left text-sm text-foreground"
                    : "w-full whitespace-nowrap rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:text-foreground"
                }
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="min-w-0 flex-1 space-y-6">
        {setupWarning && (
          <p className="rounded-md border border-destructive/40 px-3 py-2 text-sm leading-relaxed text-foreground">
            Setup step failed: {setupWarning}. Some actions may not work until this is fixed —
            reload after applying the fix.
          </p>
        )}
        {section === "overview" && <ReadinessPanel />}
        {section === "copilot" && <DevCopilotPanel />}
        {section === "agents" && <AgentsPanel />}
        {section === "prompts" && <PromptsPanel />}
        {section === "guardrails" && <GuardrailsPanel />}
        {section === "knowledge" && <KnowledgePanel />}
        {section === "monitor" && <MonitorPanel />}
        {section === "try" && <TryAgentPanel />}
        {section === "acknowledgements" && <AcknowledgementsPanel />}
        {section === "access" && (
          <>
            <MintPanel />
            <CodesPanel />
            <ProfessionalsPanel />
          </>
        )}
        {section === "orgs" && <OrganizationsPanel />}
      </div>
    </div>
  );
}

function ReadinessPanel() {
  const status = useQuery({ queryKey: ["admin-status"], queryFn: fetchAdminStatus });
  const keyCheck = useQuery({ queryKey: ["avatar-key-check"], queryFn: avatarKeyCheck });
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
              Boolean(keyCheck.data?.valid),
              "LiveAvatar key (practice person)",
              !s.config.liveavatar
                ? "not set — voice-only fallback"
                : keyCheck.isLoading
                  ? "checking…"
                  : keyCheck.data?.valid
                    ? s.config.liveavatarSandbox
                      ? "valid · sandbox"
                      : "valid · LIVE (spends credits)"
                    : `INVALID (${keyCheck.data?.status ?? "?"}) — needs a key from app.liveavatar.com → Developers (a HeyGen key won't work)`,
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

// ── Agent operations (MindCrafter /nexus/voice-agents inspired, adapted) ────
// Operational knobs, plus the prompt editor below: every persona's exact
// words, editable live (audited overrides; git defaults one click away).

const AGENT_LABELS: Record<keyof AgentOps["voice"], string> = {
  base: "Coach",
  regulator: "Coach — regulator",
  interview: "Coach — interviewer",
  defense: "Practice voice (Defense)",
};

function AgentsPanel() {
  const queryClient = useQueryClient();
  const config = useQuery({ queryKey: ["agent-config"], queryFn: getAgentConfig });
  const save = useMutation({
    mutationFn: ({
      section,
      value,
    }: {
      section: "voice" | "caps" | "model" | "avatar" | "scriptwriter" | "knowledgeRequireReview";
      value: unknown;
    }) => setAgentConfig(section, value),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["agent-config"] }),
  });
  const [capsDraft, setCapsDraft] = useState<{
    sessionSec: string;
    practiceSec: string;
    idleSec: string;
  } | null>(null);

  if (config.isLoading) {
    return (
      <Card className="paper-shadow">
        <CardHeader>
          <CardTitle className="text-base font-normal">Agents</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading…</p>
        </CardContent>
      </Card>
    );
  }
  if (config.isError || !config.data) {
    return (
      <Card className="paper-shadow">
        <CardHeader>
          <CardTitle className="text-base font-normal">Agents</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">
            Couldn&apos;t load agent config
            {config.error instanceof Error ? ` — ${config.error.message}` : ""}. If the agent_config
            table doesn&apos;t exist yet, run the pending migration SQL.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { ops, allow } = config.data;
  const caps = capsDraft ?? {
    sessionSec: String(ops.caps.sessionSec),
    practiceSec: String(ops.caps.practiceSec),
    idleSec: String(ops.caps.idleSec),
  };

  return (
    <Card className="paper-shadow">
      <CardHeader>
        <CardTitle className="text-base font-normal">Agents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-xs leading-relaxed text-muted-foreground">
          Voices, time caps, and the practice person are configurable here and apply to new sessions
          within a minute. Prompt wording is editable below — every persona's exact words, saved as
          audited overrides; “Restore default” returns to the git version.
        </p>

        <div>
          <h3 className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Voices</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {(Object.keys(AGENT_LABELS) as Array<keyof AgentOps["voice"]>).map((agent) => (
              <label
                key={agent}
                className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
              >
                <span>{AGENT_LABELS[agent]}</span>
                <select
                  value={ops.voice[agent]}
                  disabled={save.isPending}
                  onChange={(e) =>
                    save.mutate({
                      section: "voice",
                      value: { ...ops.voice, [agent]: e.target.value },
                    })
                  }
                  className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                >
                  {allow.voices.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
            Time caps (seconds)
          </h3>
          <div className="flex flex-wrap items-end gap-3">
            {(
              [
                ["sessionSec", "Session"],
                ["practiceSec", "Practice"],
                ["idleSec", "Idle"],
              ] as const
            ).map(([field, label]) => (
              <div key={field} className="space-y-1">
                <Label htmlFor={`cap-${field}`} className="text-xs text-muted-foreground">
                  {label} ({allow.capBounds[field][0]}–{allow.capBounds[field][1]})
                </Label>
                <Input
                  id={`cap-${field}`}
                  className="w-28"
                  inputMode="numeric"
                  value={caps[field]}
                  onChange={(e) => setCapsDraft({ ...caps, [field]: e.target.value })}
                />
              </div>
            ))}
            <button
              type="button"
              disabled={save.isPending || !capsDraft}
              onClick={() => {
                save.mutate({
                  section: "caps",
                  value: {
                    sessionSec: Number(caps.sessionSec),
                    practiceSec: Number(caps.practiceSec),
                    idleSec: Number(caps.idleSec),
                  },
                });
                setCapsDraft(null);
              }}
              className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40"
            >
              Save caps
            </button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Values outside the bounds are clamped server-side — a typo can&apos;t create an unsafe
            session.
          </p>
        </div>

        <div>
          <h3 className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
            Voice model (Gemini Live)
          </h3>
          <p className="text-sm">
            {ops.model.primary}
            <span className="text-xs text-muted-foreground">
              {" "}
              · fallback: {ops.model.fallback ?? "none"} · allowlist changes ship via git
            </span>
          </p>
        </div>

        <div>
          <h3 className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
            Scriptwriter (practice person &amp; text agents)
          </h3>
          <div className="flex flex-wrap gap-2">
            {(["auto", "claude", "gemini"] as const).map((s) => (
              <button
                key={s}
                type="button"
                disabled={save.isPending}
                onClick={() => save.mutate({ section: "scriptwriter", value: s })}
                className={
                  ops.scriptwriter === s
                    ? "rounded-md border border-primary bg-primary/10 px-3 py-1.5 text-sm"
                    : "rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground"
                }
              >
                {s === "auto" ? "Auto" : s === "claude" ? "Claude (Sonnet 5)" : "Gemini"}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Auto uses Claude when ANTHROPIC_API_KEY is set, else Gemini. Claude needs that secret.
          </p>
        </div>

        <div>
          <h3 className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
            Project-knowledge review
          </h3>
          <div className="flex flex-wrap gap-2">
            {(
              [
                [false, "Off (publish goes live)"],
                [true, "Require 2nd approver"],
              ] as const
            ).map(([val, label]) => (
              <button
                key={String(val)}
                type="button"
                disabled={save.isPending}
                onClick={() => save.mutate({ section: "knowledgeRequireReview", value: val })}
                className={
                  ops.knowledgeRequireReview === val
                    ? "rounded-md border border-primary bg-primary/10 px-3 py-1.5 text-sm"
                    : "rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground"
                }
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Off by default: published knowledge reaches the agents immediately. Turn on to require a
            second professional (not the author) to approve each entry before it’s used.
          </p>
        </div>

        <AvatarSection
          ops={ops}
          onSave={(value) => save.mutate({ section: "avatar", value })}
          saving={save.isPending}
        />

        <DemoToolsSection />

        <p className="text-xs leading-relaxed text-muted-foreground">
          Prompts moved to their own <span className="text-foreground">Prompts</span> tab — every
          one is editable there, with Improve-with-AI.
        </p>

        {save.isError && (
          <p className="text-sm text-destructive">
            {save.error instanceof Error ? save.error.message : "Could not save"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Per-DEVICE toggle (localStorage, not agent_config): flips the "Load an example"
// seed button on the survivor Home screen for THIS browser only. Deliberately not
// global — on the shared live deployment a global switch would show a destructive
// "load fake data" button to every visitor, including real survivors.
function DemoToolsSection() {
  const [on, setOn] = useState(false);
  useEffect(() => setOn(isDeviceDemoFlagOn()), []);
  const apply = (next: boolean) => {
    setDemoToolsEnabled(next);
    setOn(next);
  };
  return (
    <div>
      <h3 className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
        Demo tools (this device)
      </h3>
      <div className="flex flex-wrap gap-2">
        {(
          [
            [false, "Off"],
            [true, "On (show demo seed)"],
          ] as const
        ).map(([val, label]) => (
          <button
            key={String(val)}
            type="button"
            onClick={() => apply(val)}
            className={
              on === val
                ? "rounded-md border border-primary bg-primary/10 px-3 py-1.5 text-sm"
                : "rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground"
            }
          >
            {label}
          </button>
        ))}
      </div>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        Reveals “Load an example (demo)” on the Home screen — on this browser only. Loading it
        replaces the current account’s content with a fictional example (with a confirm), so every
        screen has something to show. Real survivors on other devices never see the button.
      </p>
    </div>
  );
}

function AvatarSection({
  ops,
  onSave,
  saving,
}: {
  ops: AgentOps;
  onSave: (value: AgentOps["avatar"]) => void;
  saving: boolean;
}) {
  const [browsing, setBrowsing] = useState(false);
  const avatars = useQuery({
    queryKey: ["liveavatar-gallery"],
    queryFn: listAvatars,
    enabled: browsing,
  });

  return (
    <div>
      <h3 className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
        Practice person (avatar)
      </h3>
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm">
          {ops.avatar.id ? (ops.avatar.name ?? ops.avatar.id) : "LiveAvatar default demo avatar"}
        </p>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={ops.avatar.sandbox}
            disabled={saving}
            onChange={(e) => onSave({ ...ops.avatar, sandbox: e.target.checked })}
          />
          Sandbox mode (free, watermarked — turn off for the judged run)
        </label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={ops.avatar.interactivity === "PUSH_TO_TALK"}
            disabled={saving}
            onChange={(e) =>
              onSave({
                ...ops.avatar,
                interactivity: e.target.checked ? "PUSH_TO_TALK" : "CONVERSATIONAL",
              })
            }
          />
          Push to talk (experimental — LiveAvatar&apos;s PTT transcription has been unreliable and
          left the practice person silent on 2026-07-14; leave OFF. The answer button already gates
          the mic in conversational mode.)
        </label>
        <div className="w-full space-y-1">
          <p className="text-xs text-muted-foreground">
            Spoken voice (advanced) — a LiveAvatar voice id. Leave blank for the avatar&apos;s own
            default voice.
          </p>
          <div className="flex gap-2">
            <input
              defaultValue={ops.avatar.voiceId ?? ""}
              placeholder="voice_id (optional)"
              onBlur={(e) => {
                const v = e.target.value.trim() || null;
                if (v !== (ops.avatar.voiceId ?? null)) onSave({ ...ops.avatar, voiceId: v });
              }}
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setBrowsing((b) => !b)}
          className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          {browsing ? "Close gallery" : "Choose avatar…"}
        </button>
        {browsing && (
          <button
            type="button"
            onClick={() => void avatars.refetch()}
            className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Refresh gallery
          </button>
        )}
      </div>

      {browsing && (
        <div className="mt-3">
          {avatars.isLoading && <p className="text-sm text-muted-foreground">Loading gallery…</p>}
          {avatars.isError && (
            <p className="text-sm text-destructive">
              Couldn&apos;t load avatars
              {avatars.error instanceof Error ? ` — ${avatars.error.message}` : ""}.
            </p>
          )}
          {avatars.data && (
            <>
              {!avatars.data.liveavatarConfigured && (
                <p className="mb-2 text-xs text-muted-foreground">
                  LIVEAVATAR_API_KEY isn&apos;t set — showing the public gallery only.
                </p>
              )}
              <div className="grid max-h-96 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
                {avatars.data.avatars.map((a) => {
                  const selected = ops.avatar.id === a.id;
                  return (
                    <button
                      key={`${a.source}-${a.id}`}
                      type="button"
                      disabled={saving}
                      onClick={() => onSave({ ...ops.avatar, id: a.id, name: a.name })}
                      className={
                        selected
                          ? "rounded-md border-2 border-primary p-1 text-left"
                          : "rounded-md border border-border p-1 text-left hover:border-foreground/40"
                      }
                    >
                      {a.previewUrl ? (
                        <img
                          src={a.previewUrl}
                          alt={a.name}
                          loading="lazy"
                          className="aspect-[3/4] w-full rounded bg-secondary object-cover"
                          onError={(e) => {
                            // A silent blank teaches nothing — say it failed.
                            const el = e.currentTarget;
                            const note = document.createElement("div");
                            note.textContent = "image failed to load";
                            note.className =
                              "flex aspect-[3/4] w-full items-center justify-center rounded bg-secondary text-xs text-destructive";
                            el.replaceWith(note);
                          }}
                        />
                      ) : (
                        <div className="flex aspect-[3/4] w-full items-center justify-center rounded bg-secondary text-xs text-muted-foreground">
                          no preview from API
                        </div>
                      )}
                      <p className="mt-1 truncate px-1 text-xs">
                        {a.name}
                        {a.source === "mine"
                          ? " · yours"
                          : a.source === "featured"
                            ? " · featured"
                            : ""}
                        {selected ? " ✓" : ""}
                      </p>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Custom avatars are created at app.liveavatar.com and then appear here under
                &quot;yours&quot;.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function MonitorPanel() {
  const stats = useQuery({ queryKey: ["agent-stats"], queryFn: listAgentStats });
  const rows = stats.data?.stats ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const sum = (filter: (r: (typeof rows)[number]) => boolean) =>
    rows.filter(filter).reduce(
      (acc, r) => ({
        started: acc.started + r.started,
        ended: acc.ended + r.ended_clean,
        stops: acc.stops + r.tripwire_stops,
        errors: acc.errors + r.errors,
      }),
      { started: 0, ended: 0, stops: 0, errors: 0 },
    );
  const t = sum((r) => r.day === today);
  const week = sum(() => true);

  return (
    <Card className="paper-shadow">
      <CardHeader>
        <CardTitle className="text-base font-normal">Monitor (aggregate only)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {stats.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {stats.isError && (
          <p className="text-sm text-destructive">
            Couldn&apos;t load stats — run the pending migration SQL if you haven&apos;t.
          </p>
        )}
        {stats.data && (
          <>
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              {(
                [
                  ["Sessions today", t.started, `${week.started} this week`],
                  ["Clean closes", t.ended, `${week.ended} this week`],
                  ["Stop-word stops", t.stops, `${week.stops} this week`],
                  ["Errors", t.errors, `${week.errors} this week`],
                ] as const
              ).map(([label, value, sub]) => (
                <div key={label} className="rounded-md border border-border px-3 py-2">
                  <div className="text-xs text-muted-foreground">{label}</div>
                  <div>{value}</div>
                  <div className="text-xs text-muted-foreground">{sub}</div>
                </div>
              ))}
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Counts per day, agent, and medium — never content, never identity. A stop-word stop is
              the safety system working, not a failure.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Test harness: talk to any agent without walking the survivor flow ───────

function TryAgentPanel() {
  const [mode, setMode] = useState<"base" | "regulator" | "interview" | "defense">("base");
  const voice = useGeminiLive({ mode: "base" });
  const avatar = useLiveAvatarPractice({});
  const voiceLive = voice.status === "open" || voice.status === "connecting";
  const avatarLive = avatar.status === "open" || avatar.status === "connecting";

  return (
    <Card className="paper-shadow">
      <CardHeader>
        <CardTitle className="text-base font-normal">Try it (dev test)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs leading-relaxed text-muted-foreground">
          Live sessions against the real deployed stack — the pre-demo check. These count toward the
          daily cap (and avatar credits when sandbox is off).
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={mode}
            disabled={voiceLive}
            onChange={(e) => setMode(e.target.value as typeof mode)}
            className="rounded-md border border-input bg-background px-2 py-2 text-sm"
          >
            <option value="base">Coach</option>
            <option value="regulator">Coach — regulator</option>
            <option value="interview">Coach — interviewer</option>
            <option value="defense">Practice voice (Defense)</option>
          </select>
          {!voiceLive ? (
            <button
              type="button"
              onClick={() => {
                void voice.connect(mode);
                void voice.enableMic();
              }}
              className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
            >
              Start voice test
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  voice.interrupt();
                  voice.disconnect();
                }}
                className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Stop
              </button>
              <span className="text-xs text-muted-foreground" role="status">
                {voice.status === "connecting"
                  ? "Connecting…"
                  : voice.coachSpeaking
                    ? "Speaking"
                    : voice.micState === "on"
                      ? "Listening"
                      : "Mic off"}
                {" · "}voice {voice.status}
              </span>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!avatarLive ? (
            <button
              type="button"
              onClick={() => void avatar.connect()}
              className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Start practice-person test
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                avatar.interrupt();
                avatar.disconnect();
              }}
              className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Stop practice person
            </button>
          )}
          <span className="text-xs text-muted-foreground">avatar {avatar.status}</span>
          {avatarLive && avatar.pushToTalk && (
            <button
              type="button"
              onClick={() => void (avatar.isAnswering ? avatar.endAnswer() : avatar.startAnswer())}
              className={
                avatar.isAnswering
                  ? "rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
                  : "rounded-md border border-border px-3 py-2 text-sm text-foreground"
              }
            >
              {avatar.isAnswering ? "Done answering" : "Tap to answer"}
            </button>
          )}
        </div>
        {avatar.lastError && (
          <p className="text-sm leading-relaxed text-destructive">{avatar.lastError}</p>
        )}
        {avatarLive && (
          <>
            <video
              ref={avatar.attachVideo}
              autoPlay
              playsInline
              className="aspect-[3/4] w-full max-w-56 rounded-lg bg-secondary object-cover"
            />
            {avatar.needsSoundTap && (
              <button
                type="button"
                onClick={avatar.enableSound}
                className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
              >
                Tap to turn the sound on
              </button>
            )}
          </>
        )}
        {avatar.events.length > 0 && (
          <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded bg-secondary px-2 py-2 text-xs leading-relaxed">
            {avatar.events.join("\n")}
          </pre>
        )}
      </CardContent>
    </Card>
  );
}

// ── Prompts: every runtime prompt, editable, with Improve-with-AI ───────────

function PromptsPanel() {
  const config = useQuery({ queryKey: ["agent-config"], queryFn: getAgentConfig });
  if (config.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading prompts…</p>;
  }
  if (config.isError || !config.data) {
    return (
      <p className="text-sm text-destructive">
        Couldn&apos;t load prompts
        {config.error instanceof Error ? ` — ${config.error.message}` : ""}.
      </p>
    );
  }
  const groups = new Map<string, AgentPromptInfo[]>();
  for (const p of config.data.prompts) {
    const arr = groups.get(p.group) ?? [];
    arr.push(p);
    groups.set(p.group, arr);
  }
  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-xl font-normal tracking-tight">Prompts</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Every AI brain&apos;s instructions. Edit any of them — your version wins over the built-in
          default, which is always one click away to restore. &quot;Improve with AI&quot; drafts a
          better version with Sonnet 5 and shows you before/after; nothing changes until you accept
          and save.
        </p>
      </header>
      {[...groups.entries()].map(([group, prompts]) => (
        <div key={group} className="space-y-2">
          <h3 className="text-xs uppercase tracking-wide text-muted-foreground">{group}</h3>
          {prompts.map((p) => (
            <PromptEditor key={p.key} prompt={p} />
          ))}
        </div>
      ))}
    </div>
  );
}

function PromptEditor({ prompt }: { prompt: AgentPromptInfo }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(prompt.effective);
  const [improve, setImprove] = useState<ImproveResult | null>(null);
  const [instruction, setInstruction] = useState("");
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["agent-config"] });

  const save = useMutation({
    mutationFn: (source: "manual" | "ai") => setPrompt(prompt.key, draft, source),
    onSuccess: () => {
      setImprove(null);
      refresh();
    },
  });
  const reset = useMutation({
    mutationFn: () => resetPrompt(prompt.key),
    onSuccess: () => {
      setDraft(prompt.default);
      setImprove(null);
      refresh();
    },
  });
  const ai = useMutation({
    mutationFn: () =>
      improvePrompt({ current: draft, title: prompt.title, note: prompt.note, instruction }),
    onSuccess: (r) => setImprove(r),
  });

  const dirty = draft !== prompt.effective;
  const edited = prompt.override !== null;

  return (
    <Card className="paper-shadow">
      <CardContent className="space-y-3 py-4">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="min-w-0 text-sm text-foreground">
            {prompt.title}
            {edited && <span className="ml-2 text-xs text-muted-foreground">· edited</span>}
            <span className="mt-0.5 block text-xs font-normal leading-relaxed text-muted-foreground">
              {prompt.atlas.accomplishes}
            </span>
          </span>
          <span aria-hidden className="text-muted-foreground">
            {open ? "–" : "+"}
          </span>
        </button>
        {open && (
          <div className="space-y-3">
            {/* At a glance — what this agent does, how its conversation flows. */}
            <div className="space-y-2 rounded-md bg-secondary/40 p-3">
              <div>
                <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                  How it works
                </p>
                <ol className="mt-1 space-y-1">
                  {prompt.atlas.workflow.map((step, i) => (
                    <li
                      key={step}
                      className="flex gap-2 text-xs leading-relaxed text-foreground/80"
                    >
                      <span aria-hidden className="tabular-nums text-muted-foreground">
                        {i + 1}.
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <p className="text-xs leading-relaxed text-foreground/80">
                <span className="text-muted-foreground">Where it goes: </span>
                {prompt.atlas.arc}
              </p>
              <p className="text-xs leading-relaxed text-foreground/80">
                <span className="text-muted-foreground">Gets at runtime: </span>
                {prompt.atlas.receives.join(" · ")}
              </p>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">{prompt.note}</p>
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="min-h-48 font-mono text-xs leading-relaxed"
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={save.isPending || !dirty}
                onClick={() => save.mutate("manual")}
                className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-40"
              >
                {save.isPending ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                disabled={ai.isPending}
                onClick={() => ai.mutate()}
                className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40"
              >
                {ai.isPending ? "Improving…" : "✦ Improve with AI"}
              </button>
              {edited && (
                <button
                  type="button"
                  disabled={reset.isPending}
                  onClick={() => reset.mutate()}
                  className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40"
                >
                  Restore default
                </button>
              )}
            </div>
            <input
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Optional: tell the AI what to focus on (e.g. 'be firmer', 'shorter')"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
            />
            {ai.isError && (
              <p className="text-sm text-destructive">
                {ai.error instanceof Error ? ai.error.message : "Improve failed"}
              </p>
            )}
            {save.isError && (
              <p className="text-sm text-destructive">
                {save.error instanceof Error ? save.error.message : "Save failed"}
              </p>
            )}
            {improve && (
              <div className="space-y-2 rounded-md border border-primary/40 bg-primary/5 px-3 py-3">
                <p className="text-xs font-medium text-foreground">
                  Proposed by {improve.model} · {improve.latencyMs}ms
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {improve.explanation}
                </p>
                {improve.keyChanges.length > 0 && (
                  <ul className="list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
                    {improve.keyChanges.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                )}
                <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded bg-card px-2 py-2 text-xs leading-relaxed text-foreground">
                  {improve.improved}
                </pre>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDraft(improve.improved);
                      setImprove(null);
                    }}
                    className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
                  >
                    Use this
                  </button>
                  <button
                    type="button"
                    onClick={() => setImprove(null)}
                    className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground"
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Project knowledge: what the AI brains know (dev + expert curated) ────────

const KNOWLEDGE_AGENT_OPTIONS: Array<{ key: string; label: string }> = [
  { key: "coach.base", label: "Coach" },
  { key: "coach.defense", label: "Practice voice" },
  { key: "defense.practice", label: "Practice person" },
  { key: "translator", label: "Translator" },
  { key: "reframer", label: "Reframer" },
  { key: "recognition", label: "Recognition" },
  { key: "interviewer", label: "Interviewer" },
];

function KnowledgePanel() {
  const queryClient = useQueryClient();
  const list = useQuery({ queryKey: ["project-knowledge"], queryFn: listKnowledge });
  const [editing, setEditing] = useState<Partial<KnowledgeRow> | null>(null);
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["project-knowledge"] });
  const save = useMutation({
    mutationFn: saveKnowledge,
    onSuccess: () => {
      setEditing(null);
      refresh();
    },
  });
  const remove = useMutation({ mutationFn: deleteKnowledge, onSuccess: refresh });

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-xl font-normal tracking-tight">Project knowledge</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Background the AI brains draw on — court facts, definitions, guidance. Only{" "}
          <span className="text-foreground">published</span> items reach the agents, and only the
          agents you target. This is exactly what an expert (attorney, therapist) curates from their
          own limited dashboard; you have the same control here.
        </p>
      </header>

      {!editing && (
        <button
          type="button"
          onClick={() => setEditing({ title: "", body: "", agentKeys: [], status: "draft" })}
          className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          Add knowledge
        </button>
      )}

      {editing && (
        <Card className="paper-shadow">
          <CardContent className="space-y-3 py-4">
            <input
              value={editing.title ?? ""}
              onChange={(e) => setEditing((v) => ({ ...v, title: e.target.value }))}
              placeholder="Title (e.g. 'What a continuance means')"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <Textarea
              value={editing.body ?? ""}
              onChange={(e) => setEditing((v) => ({ ...v, body: e.target.value }))}
              placeholder="The knowledge itself, in plain words."
              className="min-h-32 text-sm"
            />
            <div>
              <p className="mb-1 text-xs text-muted-foreground">
                Which agents may use this? (none selected = all agents)
              </p>
              <div className="flex flex-wrap gap-1">
                {KNOWLEDGE_AGENT_OPTIONS.map((o) => {
                  const on = (editing.agentKeys ?? []).includes(o.key);
                  return (
                    <button
                      key={o.key}
                      type="button"
                      onClick={() =>
                        setEditing((v) => {
                          const keys = new Set(v?.agentKeys ?? []);
                          if (keys.has(o.key)) keys.delete(o.key);
                          else keys.add(o.key);
                          return { ...v, agentKeys: [...keys] };
                        })
                      }
                      className={
                        on
                          ? "rounded-md border border-primary bg-primary/10 px-2 py-1 text-xs"
                          : "rounded-md border border-border px-2 py-1 text-xs text-muted-foreground"
                      }
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={editing.status ?? "draft"}
                onChange={(e) =>
                  setEditing((v) => ({ ...v, status: e.target.value as KnowledgeRow["status"] }))
                }
                className="rounded-md border border-input bg-background px-2 py-2 text-sm"
              >
                <option value="draft">Draft (not used by AI)</option>
                <option value="published">Published (AI uses it)</option>
                <option value="retired">Retired</option>
              </select>
              <button
                type="button"
                disabled={save.isPending || !editing.title?.trim() || !editing.body?.trim()}
                onClick={() =>
                  save.mutate({
                    id: editing.id,
                    title: editing.title ?? "",
                    body: editing.body ?? "",
                    agentKeys: editing.agentKeys ?? [],
                    status: (editing.status as KnowledgeRow["status"]) ?? "draft",
                  })
                }
                className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-40"
              >
                {save.isPending ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground"
              >
                Cancel
              </button>
            </div>
            {save.isError && (
              <p className="text-sm text-destructive">
                {save.error instanceof Error ? save.error.message : "Save failed"}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {list.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {list.isError && (
        <p className="text-sm text-destructive">
          Couldn&apos;t load knowledge — apply the pending migration SQL if you haven&apos;t.
        </p>
      )}
      {list.data && list.data.items.length === 0 && !editing && (
        <p className="text-sm text-muted-foreground">No knowledge yet.</p>
      )}
      <div className="space-y-2">
        {list.data?.items.map((k) => (
          <Card key={k.id} className="paper-shadow">
            <CardContent className="space-y-1 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">{k.title}</span>
                <span className="text-xs text-muted-foreground">
                  {k.status}
                  {k.agentKeys.length > 0 ? ` · ${k.agentKeys.length} agent(s)` : " · all agents"}
                </span>
              </div>
              <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{k.body}</p>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setEditing(k)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Edit
                </button>
                <button
                  type="button"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(k.id)}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  Delete
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Guardrails: hard rules layered under every agent's prompt ───────────────

const GUARDRAIL_AGENTS: Array<{ key: string; label: string }> = [
  { key: "coach.base", label: "Coach" },
  { key: "coach.regulator", label: "Coach — regulator" },
  { key: "coach.interview", label: "Coach — interviewer" },
  { key: "coach.defense", label: "Practice voice" },
  { key: "defense.practice", label: "Practice person" },
  { key: "translator", label: "Translator" },
  { key: "organizer", label: "Organizer" },
  { key: "reframer", label: "Reframer" },
  { key: "recognition", label: "Recognition" },
  { key: "interviewer", label: "Interviewer (text)" },
];

function RuleList({
  rules,
  onChange,
  placeholder,
}: {
  rules: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");
  return (
    <div className="space-y-2">
      {rules.length === 0 && <p className="text-xs text-muted-foreground">No rules yet.</p>}
      {rules.map((r, i) => (
        <div key={i} className="flex items-start gap-2">
          <span aria-hidden className="pt-2 text-xs text-muted-foreground">
            •
          </span>
          <textarea
            value={r}
            onChange={(e) => onChange(rules.map((x, j) => (j === i ? e.target.value : x)))}
            className="min-h-9 flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={() => onChange(rules.filter((_, j) => j !== i))}
            className="pt-1.5 text-xs text-muted-foreground hover:text-destructive"
          >
            Remove
          </button>
        </div>
      ))}
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === "Enter" && draft.trim()) {
              onChange([...rules, draft.trim()]);
              setDraft("");
            }
          }}
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <button
          type="button"
          disabled={!draft.trim()}
          onClick={() => {
            onChange([...rules, draft.trim()]);
            setDraft("");
          }}
          className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </div>
  );
}

function GuardrailsPanel() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["guardrails"], queryFn: getGuardrails });
  const [draft, setDraft] = useState<Guardrails | null>(null);
  const [agentKey, setAgentKey] = useState<string>("coach.base");
  const g = draft ?? query.data?.guardrails ?? { global: [], byAgent: {} };
  const save = useMutation({
    mutationFn: setGuardrails,
    onSuccess: () => {
      setDraft(null);
      void queryClient.invalidateQueries({ queryKey: ["guardrails"] });
    },
  });
  const dirty = draft !== null;

  if (query.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (query.isError) {
    return (
      <p className="text-sm text-destructive">
        Couldn&apos;t load guardrails — apply the pending migration SQL if you haven&apos;t.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-xl font-normal tracking-tight">Guardrails</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Hard rules layered UNDER every agent&apos;s own prompt and told to override anything
          later. Global rules apply to all agents at once; per-agent rules add to them. This is the
          one-place safety layer — you don&apos;t have to paste the same rule into ten prompts.
        </p>
      </header>

      {query.data?.defaults && query.data.defaults.global.length > 0 && (
        <Card className="paper-shadow border border-primary/30">
          <CardHeader>
            <CardTitle className="text-base font-normal">
              Always-on safety floor (built in)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs leading-relaxed text-muted-foreground">
              These trauma-informed and legal-safety rules are baked into the app and always apply
              under every agent. They can&apos;t be edited or removed here — your rules below are
              layered on top of them.
            </p>
            <ul className="space-y-1.5">
              {query.data.defaults.global.map((r, i) => (
                <li key={i} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
                  <span aria-hidden className="select-none text-primary/60">
                    •
                  </span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
            {Object.entries(query.data.defaults.byAgent).map(([k, rules]) => (
              <div key={k} className="space-y-1">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">{k}</div>
                <ul className="space-y-1.5">
                  {rules.map((r, i) => (
                    <li
                      key={i}
                      className="flex gap-2 text-xs leading-relaxed text-muted-foreground"
                    >
                      <span aria-hidden className="select-none text-primary/60">
                        •
                      </span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="paper-shadow">
        <CardHeader>
          <CardTitle className="text-base font-normal">
            Your added global rules (every agent)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RuleList
            rules={g.global}
            onChange={(next) => setDraft({ ...g, global: next })}
            placeholder="e.g. Never ask about anyone's immigration status."
          />
        </CardContent>
      </Card>

      <Card className="paper-shadow">
        <CardHeader>
          <CardTitle className="text-base font-normal">Per-agent rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <select
            value={agentKey}
            onChange={(e) => setAgentKey(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {GUARDRAIL_AGENTS.map((a) => (
              <option key={a.key} value={a.key}>
                {a.label}
                {(g.byAgent[a.key]?.length ?? 0) > 0 ? ` (${g.byAgent[a.key].length})` : ""}
              </option>
            ))}
          </select>
          <RuleList
            rules={g.byAgent[agentKey] ?? []}
            onChange={(next) => setDraft({ ...g, byAgent: { ...g.byAgent, [agentKey]: next } })}
            placeholder="A rule just for this agent."
          />
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={save.isPending || !dirty}
          onClick={() => save.mutate(g)}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-40"
        >
          {save.isPending ? "Saving…" : "Save guardrails"}
        </button>
        {dirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
        {save.isError && (
          <span className="text-sm text-destructive">
            {save.error instanceof Error ? save.error.message : "Save failed"}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Acknowledgements: SME profiles for the public /sources page ─────────────

/** Read an image File, downscale to ≤400px, return a compact JPEG data URI. */
async function fileToDataUri(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("decode failed"));
    el.src = dataUrl;
  });
  const max = 400;
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.82);
}

function AcknowledgementsPanel() {
  const queryClient = useQueryClient();
  const list = useQuery({ queryKey: ["acknowledgements"], queryFn: listAcknowledgements });
  const [editing, setEditing] = useState<Partial<AckRow> | null>(null);
  const [imgError, setImgError] = useState<string | null>(null);
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["acknowledgements"] });
  const save = useMutation({
    mutationFn: saveAcknowledgement,
    onSuccess: () => {
      setEditing(null);
      refresh();
    },
  });
  const remove = useMutation({ mutationFn: deleteAcknowledgement, onSuccess: refresh });

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-xl font-normal tracking-tight">Acknowledgements</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          The experts who reviewed and shaped this work. These appear on the public{" "}
          <span className="text-foreground">/sources</span> page judges can visit. Add a photo,
          name, role, and a short bio.
        </p>
      </header>

      {!editing && (
        <button
          type="button"
          onClick={() =>
            setEditing({
              name: "",
              role: "",
              bio: "",
              image: null,
              sort_order: list.data?.items.length ?? 0,
            })
          }
          className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          Add a person
        </button>
      )}

      {editing && (
        <Card className="paper-shadow">
          <CardContent className="space-y-3 py-4">
            <div className="flex items-center gap-4">
              {editing.image ? (
                <img
                  src={editing.image}
                  alt="preview"
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-xs text-muted-foreground">
                  no photo
                </div>
              )}
              <div className="space-y-1">
                <label className="inline-flex cursor-pointer rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
                  Upload photo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setImgError(null);
                      try {
                        const uri = await fileToDataUri(file);
                        setEditing((v) => ({ ...v, image: uri }));
                      } catch {
                        setImgError("Couldn't read that image.");
                      }
                    }}
                  />
                </label>
                {editing.image && (
                  <button
                    type="button"
                    onClick={() => setEditing((v) => ({ ...v, image: null }))}
                    className="block text-xs text-muted-foreground hover:text-destructive"
                  >
                    Remove photo
                  </button>
                )}
                {imgError && <p className="text-xs text-destructive">{imgError}</p>}
              </div>
            </div>
            <Input
              value={editing.name ?? ""}
              onChange={(e) => setEditing((v) => ({ ...v, name: e.target.value }))}
              placeholder="Name"
            />
            <Input
              value={editing.role ?? ""}
              onChange={(e) => setEditing((v) => ({ ...v, role: e.target.value }))}
              placeholder="Role (e.g. Trauma therapist · LCSW)"
            />
            <Textarea
              value={editing.bio ?? ""}
              onChange={(e) => setEditing((v) => ({ ...v, bio: e.target.value }))}
              placeholder="Short bio / contribution"
              className="min-h-24 text-sm"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={save.isPending || !editing.name?.trim()}
                onClick={() =>
                  save.mutate({
                    id: editing.id,
                    name: editing.name ?? "",
                    role: editing.role ?? "",
                    bio: editing.bio ?? "",
                    image: editing.image ?? null,
                    clearImage: editing.image === null,
                    sortOrder: editing.sort_order ?? 0,
                  })
                }
                className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-40"
              >
                {save.isPending ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground"
              >
                Cancel
              </button>
            </div>
            {save.isError && (
              <p className="text-sm text-destructive">
                {save.error instanceof Error ? save.error.message : "Save failed"}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {list.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {list.isError && (
        <p className="text-sm text-destructive">
          Couldn&apos;t load — apply the pending migration SQL if you haven&apos;t.
        </p>
      )}
      {list.data && list.data.items.length === 0 && !editing && (
        <p className="text-sm text-muted-foreground">No one added yet.</p>
      )}
      <div className="space-y-2">
        {list.data?.items.map((a) => (
          <Card key={a.id} className="paper-shadow">
            <CardContent className="flex items-center gap-3 py-3">
              {a.image ? (
                <img src={a.image} alt={a.name} className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-sm text-muted-foreground">
                  {a.name.slice(0, 1)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground">{a.name}</p>
                {a.role && <p className="text-xs text-muted-foreground">{a.role}</p>}
              </div>
              <button
                type="button"
                onClick={() => setEditing(a)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Edit
              </button>
              <button
                type="button"
                disabled={remove.isPending}
                onClick={() => remove.mutate(a.id)}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                Delete
              </button>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        The public page is at <span className="text-foreground">/sources</span> — share that link
        with judges.
      </p>
    </div>
  );
}

// ── Dev copilot ─────────────────────────────────────────────────────────────
// A colleague inside the dashboard: knows every panel and persona (the server
// injects the dashboard map + agent atlas), and acts through the SAME gated
// admin helpers the buttons above use — so every change carries the existing
// audit trails. The tool loop runs HERE on the client: the server only runs
// the model; requested tools execute locally and their results go back.

type CopilotBlock = {
  type?: string;
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  tool_use_id?: string;
  content?: unknown;
  is_error?: boolean;
};
type CopilotMessage = { role: "user" | "assistant"; content: string | CopilotBlock[] };

const COPILOT_WRITES = new Set([
  "set_agent_config",
  "set_prompt",
  "reset_prompt",
  "set_guardrails",
  "save_knowledge",
  "delete_knowledge",
  "save_acknowledgement",
  "delete_acknowledgement",
]);

async function runCopilotTool(name: string, input: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case "get_agent_config":
      return getAgentConfig();
    case "set_agent_config":
      return setAgentConfig(
        input.section as Parameters<typeof setAgentConfig>[0],
        input.value as Parameters<typeof setAgentConfig>[1],
      );
    case "set_prompt":
      return setPrompt(String(input.key ?? ""), String(input.content ?? ""), "ai");
    case "reset_prompt":
      return resetPrompt(String(input.key ?? ""));
    case "get_guardrails":
      return getGuardrails();
    case "set_guardrails":
      return setGuardrails(input.value as Parameters<typeof setGuardrails>[0]);
    case "list_knowledge":
      return listKnowledge();
    case "save_knowledge":
      return saveKnowledge(input.item as Parameters<typeof saveKnowledge>[0]);
    case "delete_knowledge":
      return deleteKnowledge(String(input.id ?? ""));
    case "list_acknowledgements":
      return listAcknowledgements();
    case "save_acknowledgement":
      return saveAcknowledgement(input.item as Parameters<typeof saveAcknowledgement>[0]);
    case "delete_acknowledgement":
      return deleteAcknowledgement(String(input.id ?? ""));
    case "list_agent_stats":
      return listAgentStats();
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function DevCopilotPanel() {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setError(null);
    setDraft("");
    let thread: CopilotMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(thread);
    let wrote = false;
    try {
      for (let round = 0; round < 8; round++) {
        const res = await copilotTurn(thread as unknown[]);
        const blocks = (res.content as CopilotBlock[]) ?? [];
        thread = [...thread, { role: "assistant", content: blocks }];
        setMessages(thread);
        const toolUses = blocks.filter((b) => b.type === "tool_use");
        if (res.stop_reason !== "tool_use" || toolUses.length === 0) break;
        const results: CopilotBlock[] = [];
        for (const t of toolUses) {
          try {
            const out = await runCopilotTool(t.name ?? "", t.input ?? {});
            if (COPILOT_WRITES.has(t.name ?? "")) wrote = true;
            results.push({
              type: "tool_result",
              tool_use_id: t.id,
              content: JSON.stringify(out ?? { ok: true }).slice(0, 60000),
            });
          } catch (e) {
            results.push({
              type: "tool_result",
              tool_use_id: t.id,
              content: e instanceof Error ? e.message : "tool failed",
              is_error: true,
            });
          }
        }
        thread = [...thread, { role: "user", content: results }];
        setMessages(thread);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "The copilot didn't answer.");
    } finally {
      if (wrote) void queryClient.invalidateQueries();
      setBusy(false);
    }
  };

  const visible = messages
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => typeof m.content === "string" || m.role === "assistant");

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-xl font-normal tracking-tight">✦ Copilot</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Knows every panel and every AI persona, and can change what you ask it to — prompts,
          guardrails, config, knowledge, acknowledgements — through the same audited actions the
          buttons use. Try: &quot;what does the practice person do?&quot;, &quot;make the
          Coach&apos;s opener shorter&quot;, &quot;add Dr. Rivera to the acknowledgements as our
          trauma reviewer&quot;.
        </p>
      </header>

      <div className="space-y-3">
        {visible.map(({ m, i }) => {
          if (typeof m.content === "string") {
            return (
              <div key={i} className="rounded-md bg-secondary/40 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">You</p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {m.content}
                </p>
              </div>
            );
          }
          return (
            <div key={i} className="space-y-2">
              {m.content.map((b, j) => {
                if (b.type === "text" && b.text?.trim()) {
                  return (
                    <div key={j} className="rounded-md border border-border p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Copilot
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                        {b.text}
                      </p>
                    </div>
                  );
                }
                if (b.type === "tool_use") {
                  return (
                    <p key={j} className="text-xs text-muted-foreground">
                      ✦ {COPILOT_WRITES.has(b.name ?? "") ? "changing" : "reading"}: {b.name}
                      {typeof b.input?.key === "string" ? ` (${String(b.input.key)})` : ""}
                    </p>
                  );
                }
                return null;
              })}
            </div>
          );
        })}
        {busy && <p className="text-xs text-muted-foreground">Working…</p>}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      <div className="space-y-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask about anything on this dashboard, or tell me what to change…"
          className="min-h-20"
        />
        <button
          type="button"
          disabled={busy || !draft.trim()}
          onClick={() => void send(draft)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40"
        >
          {busy ? "Working…" : "Send"}
        </button>
        <p className="text-xs leading-relaxed text-muted-foreground">
          This chat isn&apos;t saved. Changes it makes are audited exactly like your own edits.
        </p>
      </div>
    </div>
  );
}
