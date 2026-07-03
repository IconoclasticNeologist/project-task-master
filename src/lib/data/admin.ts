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
