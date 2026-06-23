import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
vi.mock("@/lib/supabase/client", () => ({ getSupabase: () => ({ rpc }) }));

import {
  accessScopeLabels,
  listMyClientAccessGrants,
  professionalRoleLabel,
  respondToClientAccessGrant,
} from "./access";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("client access data", () => {
  it("maps the survivor-safe access projection", async () => {
    rpc.mockResolvedValue({
      data: [{
        grant_id: "grant-1",
        organization_name: "Harbor House",
        professional_name: "Jordan",
        professional_role: "advocate",
        scopes: ["support_plan", "shared_timeline"],
        purpose: "Help with court-day planning.",
        status: "pending",
        origin: "organization_request",
        requested_at: "2026-06-23T00:00:00Z",
        responded_at: null,
        expires_at: null,
      }],
      error: null,
    });

    await expect(listMyClientAccessGrants()).resolves.toEqual([{
      id: "grant-1",
      organizationName: "Harbor House",
      professionalName: "Jordan",
      professionalRole: "advocate",
      scopes: ["support_plan", "shared_timeline"],
      purpose: "Help with court-day planning.",
      status: "pending",
      origin: "organization_request",
      requestedAt: "2026-06-23T00:00:00Z",
      respondedAt: null,
      expiresAt: null,
    }]);
  });

  it("sends only an explicit client decision to the protected RPC", async () => {
    rpc.mockResolvedValue({ error: null });
    await respondToClientAccessGrant("grant-1", "revoke");
    expect(rpc).toHaveBeenCalledWith("respond_to_client_access_grant", {
      p_grant_id: "grant-1",
      p_decision: "revoke",
    });
  });

  it("keeps role and scope labels plain", () => {
    expect(professionalRoleLabel("legal_professional")).toBe("Legal professional");
    expect(accessScopeLabels.shared_documents).toContain("okay to share");
  });
});
