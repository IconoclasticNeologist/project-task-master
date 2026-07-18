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
import {
  invalidatePromptCache,
  promptDefault,
  resolveCatalog,
  type PromptKey,
} from "../_shared/promptRegistry.ts";
import {
  CAP_BOUNDS,
  MODEL_ALLOWLIST,
  sanitizeOps,
  VOICE_ALLOWLIST,
} from "../_shared/agentConfig.ts";
import {
  DEFAULT_GUARDRAILS,
  EMPTY_GUARDRAILS,
  invalidateGuardrailsCache,
  sanitizeGuardrails,
} from "../_shared/guardrails.ts";
import { DEV_COPILOT_TOOLS, devCopilotSystem } from "../_shared/devMap.ts";

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

    if (action === "get_agent_config") {
      const { data, error } = await admin.from("agent_config").select("key, value");
      if (error) return json(500, { error: `Could not read config: ${error.message}` });
      const rows: Record<string, unknown> = {};
      for (const row of data ?? []) rows[row.key] = row.value;
      const prompts = await resolveCatalog(admin);
      return json(200, {
        ops: sanitizeOps(rows),
        allow: { voices: VOICE_ALLOWLIST, models: MODEL_ALLOWLIST, capBounds: CAP_BOUNDS },
        prompts,
      });
    }

    if (action === "set_prompt") {
      // Dev edits a prompt. The git default is never lost (promptDefault); the
      // edit is versioned for restore/audit. Empty content resets to default.
      const key = typeof body.key === "string" ? body.key : "";
      const content = typeof body.content === "string" ? body.content : "";
      const source = body.source === "ai" ? "ai" : "manual";
      // promptDefault returns "" only for an unknown key.
      if (!promptDefault(key as PromptKey)) return json(400, { error: "Unknown prompt key" });
      if (!content.trim()) {
        // Treat as reset-to-default.
        await admin.from("agent_prompts").delete().eq("key", key);
        await admin.from("agent_prompt_revisions").insert({
          key,
          content: promptDefault(key as PromptKey),
          source: "restore",
          updated_by: callerEmail,
        });
        invalidatePromptCache();
        return json(200, { ok: true, reset: true });
      }
      const { error } = await admin
        .from("agent_prompts")
        .upsert({ key, content, updated_at: new Date().toISOString(), updated_by: callerEmail });
      if (error) return json(500, { error: `Could not save prompt: ${error.message}` });
      await admin
        .from("agent_prompt_revisions")
        .insert({ key, content, source, updated_by: callerEmail });
      invalidatePromptCache();
      return json(200, { ok: true });
    }

    if (action === "get_guardrails") {
      const { data } = await admin
        .from("agent_config")
        .select("value")
        .eq("key", "guardrails")
        .maybeSingle();
      return json(200, {
        guardrails: data?.value ? sanitizeGuardrails(data.value) : EMPTY_GUARDRAILS,
        defaults: DEFAULT_GUARDRAILS,
      });
    }

    if (action === "set_guardrails") {
      const clean = sanitizeGuardrails(body.value);
      const { error } = await admin
        .from("agent_config")
        .upsert({ key: "guardrails", value: clean, updated_at: new Date().toISOString() });
      if (error) return json(500, { error: `Could not save: ${error.message}` });
      invalidateGuardrailsCache();
      return json(200, { ok: true, guardrails: clean });
    }

    if (action === "reset_prompt") {
      const key = typeof body.key === "string" ? body.key : "";
      if (!promptDefault(key as PromptKey)) return json(400, { error: "Unknown prompt key" });
      await admin.from("agent_prompts").delete().eq("key", key);
      await admin.from("agent_prompt_revisions").insert({
        key,
        content: promptDefault(key as PromptKey),
        source: "restore",
        updated_by: callerEmail,
      });
      invalidatePromptCache();
      return json(200, { ok: true });
    }

    if (action === "set_agent_config") {
      // The client sends one section at a time; sanitize the MERGED result so
      // a bad value can never land — what is stored is what will be applied.
      const section = typeof body.section === "string" ? body.section : "";
      if (
        !["voice", "caps", "model", "avatar", "scriptwriter", "knowledgeRequireReview"].includes(
          section,
        )
      ) {
        return json(400, { error: "Unknown config section" });
      }
      const clean = sanitizeOps({ [section]: body.value ?? {} });
      const value =
        clean[
          section as
            | "voice"
            | "caps"
            | "model"
            | "avatar"
            | "scriptwriter"
            | "knowledgeRequireReview"
        ];
      const { error } = await admin
        .from("agent_config")
        .upsert({ key: section, value, updated_at: new Date().toISOString() });
      if (error) return json(500, { error: `Could not save: ${error.message}` });
      return json(200, { ok: true, value });
    }

    if (action === "list_avatars") {
      // Public gallery needs no auth; the account's own avatars need the key.
      // FEATURED ids are hand-picked stock avatars pinned to the top of the
      // picker (requested 2026-07-03) — resolved live for name + thumbnail.
      const FEATURED_IDS = [
        "513fd1b7-7ef9-466d-9af2-344e51eeb833",
        "b6c94c07-e4e5-483e-8bec-e838d5910b7d",
        "65f9e3c9-d48b-4118-b73a-4ae2e3cbb8f0",
        "40b4f000-f783-4bba-a327-ea58b1a6fdf2",
        "998e5637-cfca-4700-891e-8a40ce33f562",
      ];
      interface AvatarItem {
        id: string;
        name: string;
        previewUrl: string | null;
        source: "featured" | "public" | "mine";
      }
      const laKey = Deno.env.get("LIVEAVATAR_API_KEY");
      const collected: AvatarItem[] = [];
      const toItem = (a: Record<string, unknown>, source: AvatarItem["source"]): AvatarItem => ({
        id: String(a.id),
        name: typeof a.name === "string" && a.name ? a.name : String(a.id).slice(0, 8),
        previewUrl: typeof a.preview_url === "string" ? a.preview_url : null,
        source,
      });
      const pull = async (url: string, source: "public" | "mine", headers: HeadersInit) => {
        const res = await fetch(url, { headers });
        if (!res.ok) return;
        const parsed = await res.json();
        // LiveAvatar lists wrap items as data: {count, next, previous, results}
        // (verified 2026-07-03); keep the other shapes as defensive fallbacks.
        const d = parsed?.data;
        const items = Array.isArray(d?.results)
          ? d.results
          : Array.isArray(d)
            ? d
            : Array.isArray(d?.items)
              ? d.items
              : [];
        for (const a of items) {
          if (typeof a?.id !== "string") continue;
          if (a.status && a.status !== "ACTIVE") continue;
          collected.push(toItem(a, source));
        }
      };
      if (laKey) {
        await pull(`${"https://api.liveavatar.com"}/v1/avatars?page_size=100`, "mine", {
          "X-API-KEY": laKey,
        }).catch(() => undefined);
      }
      // Sweep a few public pages so featured ids resolve to names/previews.
      for (let page = 1; page <= 5; page++) {
        const before = collected.length;
        await pull(
          `${"https://api.liveavatar.com"}/v1/avatars/public?page_size=100&page=${page}`,
          "public",
          {},
        ).catch(() => undefined);
        if (collected.length === before) break; // no more pages
      }

      // Featured first (in the requested order), resolved from whatever we
      // pulled; unresolved ids still appear (selectable, no preview). Then
      // "mine", then the rest of the public gallery, deduped.
      const byId = new Map(collected.map((a) => [a.id, a]));
      const featured: AvatarItem[] = FEATURED_IDS.map((id) => {
        const hit = byId.get(id);
        return hit
          ? { ...hit, source: "featured" }
          : { id, name: `Stock avatar ${id.slice(0, 8)}`, previewUrl: null, source: "featured" };
      });
      const rest = collected.filter((a) => !FEATURED_IDS.includes(a.id));
      const avatars = [
        ...featured,
        ...rest.filter((a) => a.source === "mine"),
        ...rest.filter((a) => a.source === "public"),
      ];
      return json(200, { avatars, liveavatarConfigured: Boolean(laKey) });
    }

    if (action === "avatar_key_check") {
      // Is the stored LiveAvatar key actually accepted by their API?
      // (Common trap: a HeyGen key — LiveAvatar is a separate platform and
      // needs its own key from app.liveavatar.com → Developers.)
      const laKey = Deno.env.get("LIVEAVATAR_API_KEY");
      if (!laKey) return json(200, { keySet: false, valid: false, status: null });
      const res = await fetch("https://api.liveavatar.com/v1/llm-configurations", {
        headers: { "X-API-KEY": laKey },
      }).catch(() => null);
      return json(200, {
        keySet: true,
        valid: Boolean(res?.ok),
        status: res?.status ?? null,
      });
    }

    if (action === "list_knowledge") {
      const { data, error } = await admin
        .from("project_knowledge")
        .select("id, title, body, agent_keys, status, updated_at")
        .order("updated_at", { ascending: false });
      if (error) return json(500, { error: `Could not read knowledge: ${error.message}` });
      return json(200, {
        items: (data ?? []).map((r) => ({
          id: r.id,
          title: r.title,
          body: r.body,
          agentKeys: r.agent_keys ?? [],
          status: r.status,
          updatedAt: r.updated_at,
        })),
      });
    }

    if (action === "save_knowledge") {
      const item = (body.item ?? {}) as Record<string, unknown>;
      const title = typeof item.title === "string" ? item.title.trim() : "";
      const knowledgeBody = typeof item.body === "string" ? item.body.trim() : "";
      const agentKeys = Array.isArray(item.agentKeys)
        ? (item.agentKeys.filter((k) => typeof k === "string") as string[])
        : [];
      const status = ["draft", "published", "retired"].includes(String(item.status))
        ? (item.status as string)
        : "draft";
      if (!title || !knowledgeBody) return json(400, { error: "Title and body are required" });
      const row = {
        title,
        body: knowledgeBody,
        agent_keys: agentKeys,
        status,
        updated_at: new Date().toISOString(),
      };
      if (typeof item.id === "string" && item.id) {
        const { error } = await admin.from("project_knowledge").update(row).eq("id", item.id);
        if (error) return json(500, { error: `Could not save: ${error.message}` });
        return json(200, { ok: true, id: item.id });
      }
      const { data, error } = await admin
        .from("project_knowledge")
        .insert({ ...row, created_by: callerEmail })
        .select("id")
        .single();
      if (error) return json(500, { error: `Could not save: ${error.message}` });
      return json(200, { ok: true, id: data.id });
    }

    if (action === "delete_knowledge") {
      const id = typeof body.id === "string" ? body.id : "";
      if (!id) return json(400, { error: "Missing id" });
      const { error } = await admin.from("project_knowledge").delete().eq("id", id);
      if (error) return json(500, { error: `Could not delete: ${error.message}` });
      return json(200, { ok: true });
    }

    if (action === "list_acknowledgements") {
      const { data, error } = await admin
        .from("acknowledgements")
        .select("id, name, role, bio, image, sort_order")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) return json(500, { error: `Could not read: ${error.message}` });
      return json(200, { items: data ?? [] });
    }

    if (action === "save_acknowledgement") {
      const item = (body.item ?? {}) as Record<string, unknown>;
      const name = typeof item.name === "string" ? item.name.trim() : "";
      if (!name) return json(400, { error: "Name is required" });
      const image = typeof item.image === "string" ? item.image : null;
      // Guard against oversized data URIs (≈700KB base64 ≈ 500KB image).
      if (image && image.length > 950_000) {
        return json(400, { error: "Image is too large — please use one under 500 KB." });
      }
      const row: Record<string, unknown> = {
        name,
        role: typeof item.role === "string" ? item.role : null,
        bio: typeof item.bio === "string" ? item.bio : null,
        sort_order: typeof item.sortOrder === "number" ? item.sortOrder : 0,
        updated_at: new Date().toISOString(),
      };
      // Only overwrite the image when one is provided (undefined = keep existing).
      if (image !== null || item.clearImage === true) row.image = item.clearImage ? null : image;
      if (typeof item.id === "string" && item.id) {
        const { error } = await admin.from("acknowledgements").update(row).eq("id", item.id);
        if (error) return json(500, { error: `Could not save: ${error.message}` });
        return json(200, { ok: true, id: item.id });
      }
      const { data, error } = await admin
        .from("acknowledgements")
        .insert(row)
        .select("id")
        .single();
      if (error) return json(500, { error: `Could not save: ${error.message}` });
      return json(200, { ok: true, id: data.id });
    }

    if (action === "delete_acknowledgement") {
      const id = typeof body.id === "string" ? body.id : "";
      if (!id) return json(400, { error: "Missing id" });
      const { error } = await admin.from("acknowledgements").delete().eq("id", id);
      if (error) return json(500, { error: `Could not delete: ${error.message}` });
      return json(200, { ok: true });
    }

    if (action === "list_agent_stats") {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const { data, error } = await admin
        .from("agent_daily_stats")
        .select("day, agent, medium, started, ended_clean, tripwire_stops, errors")
        .gte("day", since)
        .order("day", { ascending: false });
      if (error) return json(500, { error: `Could not read stats: ${error.message}` });
      return json(200, { stats: data ?? [] });
    }

    // The /dev copilot's LLM turn. The server ONLY runs the model with the
    // dashboard map + tool definitions; every tool the model requests is
    // executed by the CLIENT through the same gated admin actions the
    // dashboard buttons use (and their existing audit trails). Stateless.
    if (action === "copilot_turn") {
      const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY") ?? Deno.env.get("CLAUDE_API_KEY");
      if (!anthropicKey) return json(503, { error: "Copilot is not configured" });
      let messages = Array.isArray(body.messages) ? body.messages.slice(-40) : [];
      // The window must start at a plain human turn: a leading tool_result
      // whose tool_use was sliced away is an invalid conversation (API 400,
      // and the chat would stay bricked because the thread only grows).
      const isPlainUser = (m: unknown) => {
        const msg = m as { role?: unknown; content?: unknown };
        return msg?.role === "user" && typeof msg.content === "string";
      };
      while (messages.length > 0 && !isPlainUser(messages[0])) messages = messages.slice(1);
      if (messages.length === 0) return json(400, { error: "Empty conversation" });
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: Deno.env.get("ANTHROPIC_MODEL") ?? "claude-sonnet-5",
          max_tokens: 8192, // a full-prompt set_prompt tool call alone can be ~2k+ tokens
          system: devCopilotSystem(),
          tools: DEV_COPILOT_TOOLS,
          messages,
        }),
      });
      if (!res.ok) return json(502, { error: "Copilot reply failed" });
      const out = await res.json();
      return json(200, {
        content: out?.content ?? [],
        stop_reason: out?.stop_reason ?? "end_turn",
      });
    }

    return json(400, { error: "Unknown action" });
  } catch (_e) {
    return json(500, { error: "Internal error" });
  }
});
