/**
 * advocate-knowledge — the EXPERT surface's only power: curate the project
 * knowledge the AI brains draw on. Nothing else.
 *
 * Gated to APPROVED PROFESSIONALS (is_approved_professional RPC) — the same
 * people the dev vets in /dev → Professionals. Experts get list/save/delete
 * on project_knowledge and see no codes, no survivor data, no config.
 * (The dev, who is also an approved professional, can use this too.)
 *
 * NO logging of identifiers.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceKey) return json(503, { error: "Not configured" });

    // Caller's own JWT → must be an approved professional.
    const authHeader = req.headers.get("Authorization") ?? "";
    const asCaller = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData } = await asCaller.auth.getUser();
    const user = userData?.user;
    if (!user || user.app_metadata?.provider === "anonymous") {
      return json(403, { error: "Please sign in with your professional account." });
    }
    const { data: approved } = await asCaller.rpc("is_approved_professional");
    if (approved !== true) {
      return json(403, {
        error: "Your professional account isn't approved for knowledge editing yet.",
      });
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const action = typeof body.action === "string" ? body.action : "";

    if (action === "list") {
      const { data, error } = await admin
        .from("project_knowledge")
        .select("id, title, body, agent_keys, status, updated_at, created_by, reviewed_by")
        .order("updated_at", { ascending: false });
      if (error) return json(500, { error: `Could not read: ${error.message}` });
      return json(200, {
        items: (data ?? []).map((r) => ({
          id: r.id,
          // Whether this entry has cleared the two-person review and actually reaches
          // agents. A published entry that is unreviewed or self-approved does NOT.
          liveToAgents:
            r.status === "published" && !!r.reviewed_by && r.reviewed_by !== r.created_by,
          createdBy: r.created_by ?? null,
          reviewedBy: r.reviewed_by ?? null,
          title: r.title,
          body: r.body,
          agentKeys: r.agent_keys ?? [],
          status: r.status,
          updatedAt: r.updated_at,
        })),
      });
    }

    if (action === "save") {
      const item = (body.item ?? {}) as Record<string, unknown>;
      const title = typeof item.title === "string" ? item.title.trim() : "";
      const kbody = typeof item.body === "string" ? item.body.trim() : "";
      const agentKeys = Array.isArray(item.agentKeys)
        ? (item.agentKeys.filter((k) => typeof k === "string") as string[])
        : [];
      const status = ["draft", "published", "retired"].includes(String(item.status))
        ? (item.status as string)
        : "draft";
      if (!title || !kbody) return json(400, { error: "Title and body are required" });
      const row = {
        title,
        body: kbody,
        agent_keys: agentKeys,
        status,
        updated_at: new Date().toISOString(),
        // Any edit invalidates a prior approval — the changed text must be re-reviewed by
        // a second professional before it can reach agents again.
        reviewed_by: null,
        reviewed_at: null,
      };
      if (typeof item.id === "string" && item.id) {
        const { error } = await admin.from("project_knowledge").update(row).eq("id", item.id);
        if (error) return json(500, { error: `Could not save: ${error.message}` });
        return json(200, { ok: true, id: item.id });
      }
      const { data, error } = await admin
        .from("project_knowledge")
        .insert({ ...row, created_by: user.email ?? null })
        .select("id")
        .single();
      if (error) return json(500, { error: `Could not save: ${error.message}` });
      return json(200, { ok: true, id: data.id });
    }

    if (action === "approve") {
      // The two-person rule: a DIFFERENT approved professional signs off before an entry
      // can reach agents. You cannot approve what you authored.
      const id = typeof body.id === "string" ? body.id : "";
      if (!id) return json(400, { error: "Missing id" });
      const { data: existing, error: readErr } = await admin
        .from("project_knowledge")
        .select("created_by")
        .eq("id", id)
        .single();
      if (readErr) return json(500, { error: `Could not read: ${readErr.message}` });
      if (existing?.created_by && user.email && existing.created_by === user.email) {
        return json(403, {
          error: "Someone other than the author must review this before it goes live.",
        });
      }
      const { error } = await admin
        .from("project_knowledge")
        .update({ reviewed_by: user.email ?? "reviewer", reviewed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) return json(500, { error: `Could not approve: ${error.message}` });
      return json(200, { ok: true, id });
    }

    if (action === "delete") {
      const id = typeof body.id === "string" ? body.id : "";
      if (!id) return json(400, { error: "Missing id" });
      const { error } = await admin.from("project_knowledge").delete().eq("id", id);
      if (error) return json(500, { error: `Could not delete: ${error.message}` });
      return json(200, { ok: true });
    }

    return json(400, { error: "Unknown action" });
  } catch (_e) {
    return json(500, { error: "Internal error" });
  }
});
