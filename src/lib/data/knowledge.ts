import { getSupabase } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import { copy } from "@/lib/copy";

export type KnowledgeSourceType = Database["public"]["Enums"]["knowledge_source_type"];
export type KnowledgeRiskClass = Database["public"]["Enums"]["knowledge_risk_class"];
export type KnowledgeItemStatus = Database["public"]["Enums"]["knowledge_item_status"];
export type KnowledgeReviewArea = Database["public"]["Enums"]["knowledge_review_area"];
export type KnowledgeReviewDecision = Database["public"]["Enums"]["knowledge_review_decision"];

export interface KnowledgeSource {
  id: string;
  title: string;
  publisher: string | null;
  sourceUrl: string;
  sourceType: KnowledgeSourceType;
  jurisdiction: string | null;
  publicationDate: string | null;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  body: string;
  jurisdiction: string | null;
  language: string;
  riskClass: KnowledgeRiskClass;
  status: KnowledgeItemStatus;
  revision: number;
  source: Pick<KnowledgeSource, "id" | "title" | "sourceUrl" | "sourceType">;
}

export const sourceTypeLabels: Record<KnowledgeSourceType, string> = {
  law_or_rule: copy.knowledge.lawOrRule,
  official_guidance: copy.knowledge.officialGuidance,
  research: copy.knowledge.research,
  professional_practice: copy.knowledge.professionalPractice,
  local_operations: copy.knowledge.localOperations,
};

export const riskClassLabels: Record<KnowledgeRiskClass, string> = {
  low: copy.knowledge.low,
  legal_sensitive: copy.knowledge.legalSensitive,
  wellbeing_sensitive: copy.knowledge.wellbeingSensitive,
  critical: copy.knowledge.critical,
};

export const statusLabels: Record<KnowledgeItemStatus, string> = {
  draft: copy.knowledge.status.draft,
  in_review: copy.knowledge.status.inReview,
  published: copy.knowledge.status.published,
  retired: copy.knowledge.status.retired,
};

export const reviewAreaLabels: Record<KnowledgeReviewArea, string> = {
  legal: copy.knowledge.legal,
  wellbeing: copy.knowledge.wellbeing,
  lived_experience: copy.knowledge.livedExperience,
};

export const reviewDecisionLabels: Record<KnowledgeReviewDecision, string> = {
  approved: copy.knowledge.approve,
  changes_requested: copy.knowledge.changesRequested,
  rejected: copy.knowledge.reject,
};

export async function listOrganizationKnowledgeSources(organizationId: string): Promise<KnowledgeSource[]> {
  const { data, error } = await getSupabase().rpc("list_organization_knowledge_sources", {
    p_organization_id: organizationId,
  });
  if (error) throw new Error(error.message);
  return (data ?? []).map((source) => ({
    id: source.source_id,
    title: source.title,
    publisher: source.publisher,
    sourceUrl: source.source_url,
    sourceType: source.source_type,
    jurisdiction: source.jurisdiction,
    publicationDate: source.publication_date,
  }));
}

export async function listOrganizationKnowledge(organizationId: string): Promise<KnowledgeItem[]> {
  const { data, error } = await getSupabase().rpc("list_organization_knowledge", {
    p_organization_id: organizationId,
  });
  if (error) throw new Error(error.message);
  return (data ?? []).map((item) => ({
    id: item.knowledge_item_id,
    title: item.title,
    body: item.body,
    jurisdiction: item.jurisdiction,
    language: item.language,
    riskClass: item.risk_class,
    status: item.status,
    revision: item.revision,
    source: {
      id: item.source_id,
      title: item.source_title,
      sourceUrl: item.source_url,
      sourceType: item.source_type,
    },
  }));
}

export async function createKnowledgeSource(input: {
  organizationId: string;
  title: string;
  publisher: string;
  sourceUrl: string;
  sourceType: KnowledgeSourceType;
  jurisdiction: string;
  publicationDate: string;
  sourceNotes: string;
}): Promise<string> {
  const { data, error } = await getSupabase().rpc("create_knowledge_source", {
    p_organization_id: input.organizationId,
    p_title: input.title,
    p_publisher: input.publisher,
    p_source_url: input.sourceUrl,
    p_source_type: input.sourceType,
    p_jurisdiction: input.jurisdiction || undefined,
    p_publication_date: input.publicationDate || undefined,
    p_source_notes: input.sourceNotes || undefined,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function createKnowledgeItem(input: {
  organizationId: string;
  primarySourceId: string;
  title: string;
  body: string;
  riskClass: KnowledgeRiskClass;
  jurisdiction: string;
}): Promise<string> {
  const { data, error } = await getSupabase().rpc("create_knowledge_item", {
    p_organization_id: input.organizationId,
    p_primary_source_id: input.primarySourceId,
    p_title: input.title,
    p_body: input.body,
    p_risk_class: input.riskClass,
    p_jurisdiction: input.jurisdiction || undefined,
    p_language: "en",
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function requestKnowledgeReview(id: string): Promise<void> {
  const { error } = await getSupabase().rpc("request_knowledge_review", {
    p_knowledge_item_id: id,
  });
  if (error) throw new Error(error.message);
}

export async function reviewKnowledgeItem(input: {
  id: string;
  area: KnowledgeReviewArea;
  decision: KnowledgeReviewDecision;
  notes: string;
}): Promise<void> {
  const { error } = await getSupabase().rpc("review_knowledge_item", {
    p_knowledge_item_id: input.id,
    p_review_area: input.area,
    p_decision: input.decision,
    p_notes: input.notes || undefined,
  });
  if (error) throw new Error(error.message);
}

export async function publishKnowledgeItem(id: string): Promise<void> {
  const { error } = await getSupabase().rpc("publish_knowledge_item", {
    p_knowledge_item_id: id,
  });
  if (error) throw new Error(error.message);
}
