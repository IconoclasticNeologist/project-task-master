import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
vi.mock("@/lib/supabase/client", () => ({ getSupabase: () => ({ rpc }) }));

import {
  createClientInvite,
  createOrganization,
  createOrganizationMemberInvite,
  makeClientInviteCode,
  redeemOrganizationMemberInvite,
} from "./organizations";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("organization data", () => {
  it("creates an organization without creating client access", async () => {
    rpc.mockResolvedValue({ data: "org-1", error: null });
    await expect(
      createOrganization({
        name: "Harbor House",
        displayName: "Jordan",
        jurisdiction: "Illinois",
      }),
    ).resolves.toBe("org-1");
    expect(rpc).toHaveBeenCalledWith("create_organization", {
      p_name: "Harbor House",
      p_display_name: "Jordan",
      p_default_jurisdiction: "Illinois",
    });
  });

  it("creates a client invite with an expiry and explicit requested scopes", async () => {
    rpc.mockResolvedValue({ data: "invite-1", error: null });
    await createClientInvite({
      organizationId: "org-1",
      code: "SAFECODE23",
      label: "Court preparation",
      purpose: "Help with court-day planning.",
      scopes: ["logistics"],
    });
    expect(rpc).toHaveBeenCalledWith(
      "create_client_invite",
      expect.objectContaining({
        p_organization_id: "org-1",
        p_code: "SAFECODE23",
        p_scopes: ["logistics"],
        p_expires_at: expect.any(String),
      }),
    );
  });

  it("makes a readable, non-ambiguous one-time code", () => {
    const code = makeClientInviteCode();
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]{12}$/);
  });

  it("makes a seven-day staff invitation with an explicit role", async () => {
    rpc.mockResolvedValue({ data: "staff-invite-1", error: null });
    await createOrganizationMemberInvite({
      organizationId: "org-1",
      code: "TEAMCODE2",
      role: "advocate",
    });
    expect(rpc).toHaveBeenCalledWith(
      "create_organization_member_invite",
      expect.objectContaining({
        p_organization_id: "org-1",
        p_code: "TEAMCODE2",
        p_role: "advocate",
        p_expires_at: expect.any(String),
      }),
    );
  });

  it("redeems a staff invitation only with the professional's chosen display name", async () => {
    rpc.mockResolvedValue({ data: "membership-1", error: null });
    await redeemOrganizationMemberInvite({ code: "TEAMCODE2", displayName: "Jordan" });
    expect(rpc).toHaveBeenCalledWith("redeem_organization_member_invite", {
      p_code: "TEAMCODE2",
      p_display_name: "Jordan",
    });
  });
});
