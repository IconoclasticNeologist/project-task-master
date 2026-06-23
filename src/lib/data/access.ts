import { getSupabase } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import { copy } from "@/lib/copy";

type AccessScope = Database["public"]["Enums"]["client_access_scope"];
type AccessStatus = Database["public"]["Enums"]["client_access_status"];
type ProfessionalRole = Database["public"]["Enums"]["organization_member_role"];

export interface ClientAccessGrant {
  id: string;
  organizationName: string;
  professionalName: string | null;
  professionalRole: ProfessionalRole;
  scopes: AccessScope[];
  purpose: string;
  status: AccessStatus;
  origin: string;
  requestedAt: string;
  respondedAt: string | null;
  expiresAt: string | null;
}

type GrantDecision = "accept" | "decline" | "revoke";

export const accessScopeLabels: Record<AccessScope, string> = {
  logistics: copy.team.scopes.logistics,
  support_plan: copy.team.scopes.supportPlan,
  shared_statements: copy.team.scopes.sharedStatements,
  shared_timeline: copy.team.scopes.sharedTimeline,
  shared_documents: copy.team.scopes.sharedDocuments,
  client_questions: copy.team.scopes.clientQuestions,
};

const roleLabels: Record<ProfessionalRole, string> = {
  owner: copy.team.roles.owner,
  admin: copy.team.roles.admin,
  content_editor: copy.team.roles.contentEditor,
  legal_reviewer: copy.team.roles.legalReviewer,
  wellbeing_reviewer: copy.team.roles.wellbeingReviewer,
  lived_experience_reviewer: copy.team.roles.livedExperienceReviewer,
  legal_professional: copy.team.roles.legalProfessional,
  advocate: copy.team.roles.advocate,
  case_worker: copy.team.roles.caseWorker,
  clinical_professional: copy.team.roles.clinicalProfessional,
  justice_partner: copy.team.roles.justicePartner,
};

export function professionalRoleLabel(role: ProfessionalRole): string {
  return roleLabels[role];
}

export async function listMyClientAccessGrants(): Promise<ClientAccessGrant[]> {
  const { data, error } = await getSupabase().rpc("list_my_client_access_grants");
  if (error) throw new Error(error.message);
  return (data ?? []).map((grant) => ({
    id: grant.grant_id,
    organizationName: grant.organization_name,
    professionalName: grant.professional_name,
    professionalRole: grant.professional_role,
    scopes: grant.scopes,
    purpose: grant.purpose,
    status: grant.status,
    origin: grant.origin,
    requestedAt: grant.requested_at,
    respondedAt: grant.responded_at,
    expiresAt: grant.expires_at,
  }));
}

export async function respondToClientAccessGrant(
  id: string,
  decision: GrantDecision,
): Promise<void> {
  const { error } = await getSupabase().rpc("respond_to_client_access_grant", {
    p_grant_id: id,
    p_decision: decision,
  });
  if (error) throw new Error(error.message);
}
