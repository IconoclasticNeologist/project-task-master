import { getSupabase } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

export type AccessScope = Database["public"]["Enums"]["client_access_scope"];
export type OrganizationRole = Database["public"]["Enums"]["organization_member_role"];

export interface OrganizationMembership {
  id: string;
  name: string;
  jurisdiction: string | null;
  role: OrganizationRole;
}

export async function listMyOrganizations(): Promise<OrganizationMembership[]> {
  const { data, error } = await getSupabase().rpc("list_my_organizations");
  if (error) throw new Error(error.message);
  return (data ?? []).map((organization) => ({
    id: organization.organization_id,
    name: organization.organization_name,
    jurisdiction: organization.default_jurisdiction,
    role: organization.role,
  }));
}

export async function isApprovedProfessional(): Promise<boolean> {
  const { data, error } = await getSupabase().rpc("is_approved_professional");
  if (error) throw new Error(error.message);
  return data;
}

export async function canCreateOrganization(): Promise<boolean> {
  const { data, error } = await getSupabase().rpc("can_create_organization");
  if (error) throw new Error(error.message);
  return data;
}

export async function createOrganization(input: {
  name: string;
  displayName: string;
  jurisdiction: string;
}): Promise<string> {
  const { data, error } = await getSupabase().rpc("create_organization", {
    p_name: input.name,
    p_display_name: input.displayName || undefined,
    p_default_jurisdiction: input.jurisdiction || undefined,
  });
  if (error) throw new Error(error.message);
  return data;
}

export function makeClientInviteCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

export async function createOrganizationMemberInvite(input: {
  organizationId: string;
  code: string;
  role: Exclude<OrganizationRole, "owner">;
}): Promise<string> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await getSupabase().rpc("create_organization_member_invite", {
    p_organization_id: input.organizationId,
    p_code: input.code,
    p_role: input.role,
    p_expires_at: expiresAt,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function redeemOrganizationMemberInvite(input: {
  code: string;
  displayName: string;
}): Promise<string> {
  const { data, error } = await getSupabase().rpc("redeem_organization_member_invite", {
    p_code: input.code,
    p_display_name: input.displayName,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function createClientInvite(input: {
  organizationId: string;
  code: string;
  label: string;
  scopes: AccessScope[];
  purpose: string;
}): Promise<string> {
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await getSupabase().rpc("create_client_invite", {
    p_organization_id: input.organizationId,
    p_code: input.code,
    p_label: input.label,
    p_scopes: input.scopes,
    p_purpose: input.purpose,
    p_expires_at: expiresAt,
  });
  if (error) throw new Error(error.message);
  return data;
}

export interface ClientInviteStatusRow {
  id: string;
  label: string | null;
  scopes: AccessScope[];
  createdAt: string;
  expiresAt: string | null;
  redeemed: boolean;
}

/**
 * The org's client invites, for the professional overview. RLS
 * (invites_manager_read) already limits rows to client-managing roles —
 * everyone else simply sees an empty list.
 */
export async function listOrganizationClientInvites(
  organizationId: string,
): Promise<ClientInviteStatusRow[]> {
  const { data, error } = await getSupabase()
    .from("client_invites")
    .select("id, label, scopes, created_at, expires_at, redeemed_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    label: row.label,
    scopes: row.scopes,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    redeemed: Boolean(row.redeemed_at),
  }));
}
