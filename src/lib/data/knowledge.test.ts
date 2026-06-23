import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
vi.mock("@/lib/supabase/client", () => ({ getSupabase: () => ({ rpc }) }));

import {
  createKnowledgeItem,
  createKnowledgeSource,
  publishKnowledgeItem,
  requestKnowledgeReview,
  reviewKnowledgeItem,
} from "./knowledge";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("knowledge data", () => {
  it("creates a source with provenance fields", async () => {
    rpc.mockResolvedValue({ data: "source-1", error: null });
    await createKnowledgeSource({
      organizationId: "org-1",
      title: "Federal rule",
      publisher: "U.S. Courts",
      sourceUrl: "https://example.test/rule",
      sourceType: "law_or_rule",
      jurisdiction: "Federal",
      publicationDate: "2026-01-01",
      sourceNotes: "Check annually.",
    });
    expect(rpc).toHaveBeenCalledWith("create_knowledge_source", expect.objectContaining({
      p_organization_id: "org-1",
      p_source_type: "law_or_rule",
      p_source_url: "https://example.test/rule",
    }));
  });

  it("creates a draft card with an explicit risk class and source", async () => {
    rpc.mockResolvedValue({ data: "item-1", error: null });
    await createKnowledgeItem({
      organizationId: "org-1",
      primarySourceId: "source-1",
      title: "Asking for a break",
      body: "You can ask the court for a pause if you need one.",
      riskClass: "wellbeing_sensitive",
      jurisdiction: "Federal",
    });
    expect(rpc).toHaveBeenCalledWith("create_knowledge_item", expect.objectContaining({
      p_primary_source_id: "source-1",
      p_risk_class: "wellbeing_sensitive",
    }));
  });

  it("keeps review and publishing as separate explicit actions", async () => {
    rpc.mockResolvedValue({ error: null });
    await requestKnowledgeReview("item-1");
    await reviewKnowledgeItem({
      id: "item-1",
      area: "wellbeing",
      decision: "approved",
      notes: "",
    });
    await publishKnowledgeItem("item-1");
    expect(rpc.mock.calls.map(([name]) => name)).toEqual([
      "request_knowledge_review",
      "review_knowledge_item",
      "publish_knowledge_item",
    ]);
  });
});
