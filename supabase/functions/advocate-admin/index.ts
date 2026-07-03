/**
 * advocate-admin — the developer dashboard's control plane.
 *
 * WHO MAY CALL: only signed-in (non-anonymous) users whose email appears in
 * the DEV_EMAILS secret (comma-separated, case-insensitive). Everyone else —
 * including every survivor and professional — gets 403. The gateway's JWT
 * check runs first (verify_jwt stays ON for this function).
 *
 * WHAT IT NEVER TOUCHES: survivor content. No statements, no timeline, no
 * documents, no embeddings, no aftercare, no names beyond what professionals
 * chose as workspace labels. The dashboard shows system METADATA (codes,
 * approvals, organizations, aggregate counters) — RLS keeps everything else
 * out of reach even for the service role queries written here, because these
 * queries simply never select it. This is a design rule, not an accident:
 * an admin surface that can read survivor accounts would be a bigger threat
 * to the people this app serves than no admin surface at all.
 *
 * Actions:
 *   status               — readiness flags + aggregate counters (no user data)
 *   ensure_self_access   — makes the CALLER a gatekeeper (so the dashboard can
 *                          mint survivor codes via the existing audited RPC)
 *                          and an approved professional (org creation allowed)
 *   list_codes           — survivor access codes + client invites, metadata only
 *   list_professionals   — auth users (non-anon) + approval + memberships
 *   approve_professional — { email, allowOrgCreation? } creates the auth user
 *                          if missing (magic-link sign-in works afterwards)
 *                          and upserts the platform approval
 *   revoke_professional  — { email } sets revoked_at
 *   list_organizations   — orgs + members + workspace labels + grant counts
 *
 * Secrets: DEV_EMAILS (required). Uses the auto-provided service role key.
 * NO logging of request bodies or user identifiers.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

type Json = Record<string, unknown>;

function allowedEmails(): string[] {
  return (Deno.env.get("DEV_EMAILS") ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

async function findUserByEmail(
  admin: ReturnType<typeof createClient>,
  email: string,
): Promise<{ id: string; email: string } | null> {
  const target = email.trim().toLowerCase();
  // GoTrue admin list is paginated; fine at this product's scale.
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    const hit = data.users.find((u) => (u.email ?? "").toLowerCase() === target);
    if (hit) return { id: hit.id, email: hit.email ?? target };
    if (data.users.length < 200) break;
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const devEmails = allowedEmails();
    if (!supabaseUrl || !serviceKey || !anonKey) return json(503, { error: "Not configured" });
    if (devEmails.length === 0) {
      return json(503, { error: "Developer access is not configured (set DEV_EMAILS)" });
    }

    // Identify the caller from their own JWT (never trust a body field).
    const authHeader = req.headers.get("Authorization") ?? "";
    const asCaller = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await asCaller.auth.getUser();
    const caller = userData?.user;
    const callerEmail = (caller?.email ?? "").toLowerCase();
    if (userError || !caller || caller.app_metadata?.provider === "anonymous" || !callerEmail) {
      return json(403, { error: "Not signed in with a developer account" });
    }
    if (!devEmails.includes(callerEmail)) {
      return json(403, { error: "This account is not a developer" });
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const body = (await req.json().catch(() => ({}))) as Json;
    const action = typeof body.action === "string" ? body.action : "";

    if (action === "status") {
      const today = new Date().toISOString().slice(0, 10);
      const [counter, survivors, orgs, approvals, codes] = await Promise.all([
        admin.from("voice_session_counters").select("session_count").eq("day", today).maybeSingle(),
        admin.from("survivors").select("id", { count: "exact", head: true }),
        admin.from("organizations").select("id", { count: "exact", head: true }),
        admin
          .from("professional_approvals")
          .select("auth_user_id", { count: "exact", head: true })
          .is("revoked_at", null),
        admin
          .from("access_codes")
          .select("id", { count: "exact", head: true })
          .is("redeemed_by", null),
      ]);
      return json(200, {
        config: {
          gemini: Boolean(Deno.env.get("GEMINI_API_KEY") ?? Deno.env.get("GOOGLE_AI_API_KEY")),
          liveavatar: Boolean(Deno.env.get("LIVEAVATAR_API_KEY")),
          liveavatarSandbox: (Deno.env.get("LIVEAVATAR_SANDBOX") ?? "").toLowerCase() === "true",
          dailyCap: Number(Deno.env.get("DAILY_VOICE_SESSION_CAP") ?? "200"),
        },
        counters: {
          mediaSessionsToday: counter.data?.session_count ?? 0,
          survivors: survivors.count ?? 0,
          organizations: orgs.count ?? 0,
          approvedProfessionals: approvals.count ?? 0,
          unredeemedCodes: codes.count ?? 0,
        },
      });
    }

    if (action === "ensure_self_access") {
      // ignoreDuplicates: an existing gatekeeper record (any role/org) is
      // left exactly as it is — this only fills the gap when there is none.
      const { error } = await admin
        .from("gatekeepers")
        .upsert(
          { auth_user_id: caller.id, role: "advocate", org_name: "Developer" },
          { onConflict: "auth_user_id", ignoreDuplicates: true },
        );
      if (error) {
        return json(500, { error: `Could not create gatekeeper record: ${error.message}` });
      }
      const { error: approvalError } = await admin.from("professional_approvals").upsert({
        auth_user_id: caller.id,
        organization_creation_allowed: true,
        revoked_at: null,
      });
      if (approvalError) {
        return json(500, { error: `Could not record approval: ${approvalError.message}` });
      }
      return json(200, { ok: true });
    }

    if (action === "list_codes") {
      const [codes, invites] = await Promise.all([
        admin
          .from("access_codes")
          .select("id, label, created_at, expires_at, redeemed_at, gatekeepers ( org_name, role )")
          .order("created_at", { ascending: false })
          .limit(200),
        admin
          .from("client_invites")
          .select("id, label, scopes, created_at, expires_at, redeemed_at, organizations ( name )")
          .order("created_at", { ascending: false })
          .limit(200),
      ]);
      if (codes.error || invites.error) return json(500, { error: "Could not list codes" });
      return json(200, {
        accessCodes: (codes.data ?? []).map((c) => ({
          id: c.id,
          label: c.label,
          createdAt: c.created_at,
          expiresAt: c.expires_at,
          redeemed: Boolean(c.redeemed_at),
          issuedBy: (c.gatekeepers as { org_name?: string } | null)?.org_name ?? "—",
        })),
        clientInvites: (invites.data ?? []).map((i) => ({
          id: i.id,
          label: i.label,
          scopes: i.scopes,
          createdAt: i.created_at,
          expiresAt: i.expires_at,
          redeemed: Boolean(i.redeemed_at),
          organization: (i.organizations as { name?: string } | null)?.name ?? "—",
        })),
      });
    }

    if (action === "list_professionals") {
      const users: Array<{
        id: string;
        email: string;
        createdAt: string;
        lastSignIn: string | null;
      }> = [];
      for (let page = 1; page <= 20; page++) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
        if (error) return json(500, { error: "Could not list users" });
        for (const u of data.users) {
          if (u.app_metadata?.provider === "anonymous") continue;
          if (!u.email) continue;
          users.push({
            id: u.id,
            email: u.email,
            createdAt: u.created_at,
            lastSignIn: u.last_sign_in_at ?? null,
          });
        }
        if (data.users.length < 200) break;
      }
      const ids = users.map((u) => u.id);
      const [approvals, memberships] = await Promise.all([
        ids.length
          ? admin
              .from("professional_approvals")
              .select("auth_user_id, organization_creation_allowed, approved_at, revoked_at")
              .in("auth_user_id", ids)
          : Promise.resolve({ data: [], error: null }),
        ids.length
          ? admin
              .from("organization_memberships")
              .select("auth_user_id, display_name, role, status, organizations ( name )")
              .in("auth_user_id", ids)
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (approvals.error || memberships.error) {
        return json(500, { error: "Could not list professionals" });
      }
      return json(200, {
        professionals: users.map((u) => ({
          ...u,
          approval:
            (approvals.data ?? [])
              .filter((a) => a.auth_user_id === u.id)
              .map((a) => ({
                approvedAt: a.approved_at,
                revokedAt: a.revoked_at,
                orgCreationAllowed: a.organization_creation_allowed,
              }))[0] ?? null,
          memberships: (memberships.data ?? [])
            .filter((m) => m.auth_user_id === u.id)
            .map((m) => ({
              organization: (m.organizations as { name?: string } | null)?.name ?? "—",
              displayName: m.display_name,
              role: m.role,
              status: m.status,
            })),
        })),
      });
    }

    if (action === "approve_professional") {
      const email = typeof body.email === "string" ? body.email.trim() : "";
      const allowOrgCreation = body.allowOrgCreation === true;
      if (!email || !email.includes("@")) return json(400, { error: "A valid email is needed" });

      let user = await findUserByEmail(admin, email);
      if (!user) {
        // Creating the auth user is what makes their magic-link sign-in work
        // (the app deliberately uses shouldCreateUser: false).
        const { data, error } = await admin.auth.admin.createUser({
          email,
          email_confirm: true,
        });
        if (error || !data.user) return json(500, { error: "Could not create the account" });
        user = { id: data.user.id, email };
      }
      const { error } = await admin.from("professional_approvals").upsert({
        auth_user_id: user.id,
        organization_creation_allowed: allowOrgCreation,
        revoked_at: null,
      });
      if (error) return json(500, { error: "Could not record approval" });
      return json(200, { ok: true });
    }

    if (action === "revoke_professional") {
      const email = typeof body.email === "string" ? body.email.trim() : "";
      const user = email ? await findUserByEmail(admin, email) : null;
      if (!user) return json(404, { error: "No account with that email" });
      const { error } = await admin
        .from("professional_approvals")
        .update({ revoked_at: new Date().toISOString() })
        .eq("auth_user_id", user.id);
      if (error) return json(500, { error: "Could not revoke" });
      return json(200, { ok: true });
    }

    if (action === "list_organizations") {
      const [orgs, memberships, workspaces, grants] = await Promise.all([
        admin.from("organizations").select("id, name, default_jurisdiction, created_at"),
        admin
          .from("organization_memberships")
          .select("organization_id, display_name, role, status"),
        admin.from("client_workspaces").select("id, organization_id, label, created_at"),
        admin.from("client_access_grants").select("workspace_id, status"),
      ]);
      if (orgs.error || memberships.error || workspaces.error || grants.error) {
        return json(500, { error: "Could not list organizations" });
      }
      return json(200, {
        organizations: (orgs.data ?? []).map((o) => ({
          id: o.id,
          name: o.name,
          jurisdiction: o.default_jurisdiction,
          createdAt: o.created_at,
          members: (memberships.data ?? [])
            .filter((m) => m.organization_id === o.id)
            .map((m) => ({ displayName: m.display_name, role: m.role, status: m.status })),
          workspaces: (workspaces.data ?? [])
            .filter((w) => w.organization_id === o.id)
            .map((w) => ({
              label: w.label,
              createdAt: w.created_at,
              grants: (grants.data ?? []).filter((g) => g.workspace_id === w.id).length,
              activeGrants: (grants.data ?? []).filter(
                (g) => g.workspace_id === w.id && g.status === "active",
              ).length,
              pendingGrants: (grants.data ?? []).filter(
                (g) => g.workspace_id === w.id && g.status === "pending",
              ).length,
            })),
        })),
      });
    }

    return json(400, { error: "Unknown action" });
  } catch (_e) {
    return json(500, { error: "Internal error" });
  }
});
