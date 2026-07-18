import { getSupabase } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import { copy } from "@/lib/copy";

export type CourtPlanCategory = Database["public"]["Enums"]["court_plan_category"];
export type CourtPlanItemStatus = Database["public"]["Enums"]["court_plan_item_status"];

export interface CourtPlanItem {
  id: string;
  workspaceId: string;
  category: CourtPlanCategory;
  title: string;
  details: string | null;
  status: CourtPlanItemStatus;
  dueDate: string | null;
}

export interface ClientWorkspace {
  id: string;
  organizationName: string;
  clientName: string;
  scopes: Database["public"]["Enums"]["client_access_scope"][];
}

// Lazy lookups, NOT a module-level map: reading copy.* at import time freezes
// English forever (the language-aware proxy resolves at ACCESS time — see
// src/lib/copy/index.ts rule 3). These re-resolve on every render.
export function courtPlanCategoryLabel(category: CourtPlanCategory): string {
  const labels: Record<CourtPlanCategory, string> = {
    hearing_details: copy.plan.categories.hearingDetails,
    travel: copy.plan.categories.travel,
    accommodation: copy.plan.categories.accommodation,
    support: copy.plan.categories.support,
    question: copy.plan.categories.question,
  };
  return labels[category];
}

export function courtPlanStatusLabel(status: CourtPlanItemStatus): string {
  const labels: Record<CourtPlanItemStatus, string> = {
    not_started: copy.plan.status.notStarted,
    in_progress: copy.plan.status.inProgress,
    done: copy.plan.status.done,
  };
  return labels[status];
}

export async function listMyCourtPlanItems(): Promise<CourtPlanItem[]> {
  const { data, error } = await getSupabase().rpc("list_my_court_plan_items");
  if (error) throw new Error(error.message);
  return (data ?? []).map((item) => ({
    id: item.court_plan_item_id,
    workspaceId: item.workspace_id,
    category: item.category,
    title: item.title,
    details: item.details,
    status: item.status,
    dueDate: item.due_date,
  }));
}

export async function createMyCourtPlanItem(input: {
  category: CourtPlanCategory;
  title: string;
  details: string;
}): Promise<string> {
  const supabase = getSupabase();
  const workspace = await supabase.rpc("get_my_court_plan_workspace");
  if (workspace.error || !workspace.data) throw new Error("No court plan workspace");
  return createCourtPlanItem({ ...input, workspaceId: workspace.data });
}

export async function createCourtPlanItem(input: {
  workspaceId: string;
  category: CourtPlanCategory;
  title: string;
  details: string;
}): Promise<string> {
  const { data, error } = await getSupabase().rpc("create_court_plan_item", {
    p_workspace_id: input.workspaceId,
    p_category: input.category,
    p_title: input.title,
    p_details: input.details || undefined,
    p_due_date: undefined,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function listMyClientWorkspaces(): Promise<ClientWorkspace[]> {
  const { data, error } = await getSupabase().rpc("list_my_client_workspaces");
  if (error) throw new Error(error.message);
  return (data ?? []).map((workspace) => ({
    id: workspace.workspace_id,
    organizationName: workspace.organization_name,
    clientName: workspace.client_name,
    scopes: workspace.scopes,
  }));
}

export async function listCourtPlanItemsForWorkspace(
  workspaceId: string,
): Promise<CourtPlanItem[]> {
  const { data, error } = await getSupabase().rpc("list_court_plan_items_for_workspace", {
    p_workspace_id: workspaceId,
  });
  if (error) throw new Error(error.message);
  return (data ?? []).map((item) => ({
    id: item.court_plan_item_id,
    workspaceId,
    category: item.category,
    title: item.title,
    details: item.details,
    status: item.status,
    dueDate: item.due_date,
  }));
}

/** Delete never touches ciphertext, so it stays a direct RLS-scoped call
 *  (court_plan_items_client_delete permits the survivor's own workspace). */
export async function deleteMyCourtPlanItem(id: string): Promise<void> {
  const { error } = await getSupabase().from("court_plan_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function updateCourtPlanItemStatus(
  id: string,
  status: CourtPlanItemStatus,
): Promise<void> {
  const { error } = await getSupabase().rpc("update_court_plan_item_status", {
    p_court_plan_item_id: id,
    p_status: status,
  });
  if (error) throw new Error(error.message);
}
