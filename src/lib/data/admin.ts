// Developer-dashboard data layer. Everything here talks to the
// advocate-admin edge function (email-allowlisted, service-role inside) —
// EXCEPT code minting, which goes through the existing audited
// mint_access_code RPC as the signed-in developer's own gatekeeper record,
// so the plaintext code exists only in this browser, once.
//
// System metadata only. No survivor content flows through this module.

import { getSupabase } from "@/lib/supabase/client";

export interface AdminStatus {
  config: {
    gemini: boolean;
    liveavatar: boolean;
    liveavatarSandbox: boolean;
    dailyCap: number;
  };
  counters: {
    mediaSessionsToday: number;
    survivors: number;
    organizations: number;
    approvedProfessionals: number;
    unredeemedCodes: number;
  };
}

export interface AdminCodeRow {
  id: string;
  label: string | null;
  createdAt: string;
  expiresAt: string | null;
  redeemed: boolean;
  issuedBy: string;
}

export interface AdminInviteRow {
  id: string;
  label: string | null;
  scopes: string[];
  createdAt: string;
  expiresAt: string | null;
  redeemed: boolean;
  organization: string;
}

export interface AdminProfessional {
  id: string;
  email: string;
  createdAt: string;
  lastSignIn: string | null;
  approval: { approvedAt: string; revokedAt: string | null; orgCreationAllowed: boolean } | null;
  memberships: Array<{
    organization: string;
    displayName: string | null;
    role: string;
    status: string;
  }>;
}

export interface AdminOrganization {
  id: string;
  name: string;
  jurisdiction: string | null;
  createdAt: string;
  members: Array<{ displayName: string | null; role: string; status: string }>;
  workspaces: Array<{
    label: string;
    createdAt: string;
    grants: number;
    activeGrants: number;
    pendingGrants: number;
  }>;
}

async function adminCall<T>(action: string, extra: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await getSupabase().functions.invoke("advocate-admin", {
    body: { action, ...extra },
  });
  if (error) {
    // Surface the function's message ("This account is not a developer")
    // instead of a generic invoke error where possible.
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === "function") {
      const body = await ctx.json().catch(() => null);
      if (body?.error) throw new Error(String(body.error));
    }
    throw new Error(error.message);
  }
  return data as T;
}

export const fetchAdminStatus = () => adminCall<AdminStatus>("status");
export const ensureSelfAccess = () => adminCall<{ ok: true }>("ensure_self_access");
export const listAdminCodes = () =>
  adminCall<{ accessCodes: AdminCodeRow[]; clientInvites: AdminInviteRow[] }>("list_codes");
export const listAdminProfessionals = () =>
  adminCall<{ professionals: AdminProfessional[] }>("list_professionals");
export const approveProfessional = (email: string, allowOrgCreation: boolean) =>
  adminCall<{ ok: true }>("approve_professional", { email, allowOrgCreation });
export const revokeProfessional = (email: string) =>
  adminCall<{ ok: true }>("revoke_professional", { email });
export const listAdminOrganizations = () =>
  adminCall<{ organizations: AdminOrganization[] }>("list_organizations");

/**
 * Survivor access code: generated here, hashed in Postgres, shown once.
 * Dev-minted codes always expire (30 days) — per-invite codes should never
 * be immortal.
 */
export async function mintSurvivorCode(label: string): Promise<string> {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const code = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await getSupabase().rpc("mint_access_code", {
    p_code: code,
    p_label: label,
    p_expires_at: expires,
  });
  if (error) throw new Error(error.message);
  return code;
}

// ── Agent operations (config, avatars, aggregate stats) ─────────────────────

export interface AgentOps {
  voice: { base: string; regulator: string; interview: string; defense: string };
  caps: { sessionSec: number; practiceSec: number; idleSec: number };
  model: { primary: string; fallback: string | null };
  scriptwriter: "auto" | "claude" | "gemini";
  knowledgeRequireReview: boolean;
  avatar: {
    id: string | null;
    name: string | null;
    sandbox: boolean;
    interactivity: "PUSH_TO_TALK" | "CONVERSATIONAL";
    voiceId: string | null;
  };
}

export interface AgentPromptInfo {
  key: string;
  title: string;
  group: string;
  note: string;
  default: string;
  override: string | null;
  effective: string;
}

export interface AgentConfigBundle {
  ops: AgentOps;
  allow: {
    voices: string[];
    models: string[];
    capBounds: Record<"sessionSec" | "practiceSec" | "idleSec", [number, number]>;
  };
  prompts: AgentPromptInfo[];
}

export interface AvatarChoice {
  id: string;
  name: string;
  previewUrl: string | null;
  source: "featured" | "public" | "mine";
}

export interface AgentStatRow {
  day: string;
  agent: string;
  medium: string;
  started: number;
  ended_clean: number;
  tripwire_stops: number;
  errors: number;
}

export const getAgentConfig = () => adminCall<AgentConfigBundle>("get_agent_config");
export const setAgentConfig = (
  section: "voice" | "caps" | "model" | "avatar" | "scriptwriter" | "knowledgeRequireReview",
  value: unknown,
) => adminCall<{ ok: true; value: unknown }>("set_agent_config", { section, value });
export const listAvatars = () =>
  adminCall<{ avatars: AvatarChoice[]; liveavatarConfigured: boolean }>("list_avatars");
export const listAgentStats = () => adminCall<{ stats: AgentStatRow[] }>("list_agent_stats");
export const avatarKeyCheck = () =>
  adminCall<{ keySet: boolean; valid: boolean; status: number | null }>("avatar_key_check");

// ── Prompts (dev-editable, git default always restorable) ───────────────────
export const setPrompt = (key: string, content: string, source: "manual" | "ai" = "manual") =>
  adminCall<{ ok: true }>("set_prompt", { key, content, source });
export const resetPrompt = (key: string) => adminCall<{ ok: true }>("reset_prompt", { key });

export interface ImproveResult {
  improved: string;
  explanation: string;
  keyChanges: string[];
  model: string;
  latencyMs: number;
}
export async function improvePrompt(input: {
  current: string;
  title: string;
  note: string;
  instruction?: string;
}): Promise<ImproveResult> {
  const { data, error } = await getSupabase().functions.invoke("advocate-improve-prompt", {
    body: input,
  });
  if (error) {
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === "function") {
      const body = await ctx.json().catch(() => null);
      if (body?.error) throw new Error(String(body.error));
    }
    throw new Error(error.message);
  }
  return data as ImproveResult;
}

// ── Project knowledge (expert-curated; feeds the AI brains) ─────────────────
export interface KnowledgeRow {
  id: string;
  title: string;
  body: string;
  agentKeys: string[];
  status: "draft" | "published" | "retired";
  updatedAt: string;
}
// ── Guardrails (hard rules layered under every agent's prompt) ──────────────
export interface Guardrails {
  global: string[];
  byAgent: Record<string, string[]>;
}
export const getGuardrails = () =>
  adminCall<{ guardrails: Guardrails; defaults: Guardrails }>("get_guardrails");
export const setGuardrails = (value: Guardrails) =>
  adminCall<{ ok: true; guardrails: Guardrails }>("set_guardrails", { value });

// ── Acknowledgements (public SME page, dev-editable) ────────────────────────
export interface AckRow {
  id: string;
  name: string;
  role: string | null;
  bio: string | null;
  image: string | null;
  sort_order: number;
}
export const listAcknowledgements = () => adminCall<{ items: AckRow[] }>("list_acknowledgements");
export const saveAcknowledgement = (item: {
  id?: string;
  name: string;
  role: string;
  bio: string;
  image?: string | null;
  clearImage?: boolean;
  sortOrder: number;
}) => adminCall<{ ok: true; id: string }>("save_acknowledgement", { item });
export const deleteAcknowledgement = (id: string) =>
  adminCall<{ ok: true }>("delete_acknowledgement", { id });

export const listKnowledge = () => adminCall<{ items: KnowledgeRow[] }>("list_knowledge");
export const saveKnowledge = (item: {
  id?: string;
  title: string;
  body: string;
  agentKeys: string[];
  status: "draft" | "published" | "retired";
}) => adminCall<{ ok: true; id: string }>("save_knowledge", { item });
export const deleteKnowledge = (id: string) => adminCall<{ ok: true }>("delete_knowledge", { id });
