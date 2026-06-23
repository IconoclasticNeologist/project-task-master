import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
vi.mock("@/lib/supabase/client", () => ({ getSupabase: () => ({ rpc }) }));

import {
  createMyCourtPlanItem,
  updateCourtPlanItemStatus,
} from "./courtPlan";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("court plan data", () => {
  it("creates a client-owned court-plan item in the current workspace", async () => {
    rpc
      .mockResolvedValueOnce({ data: "workspace-1", error: null })
      .mockResolvedValueOnce({ data: "item-1", error: null });
    await expect(createMyCourtPlanItem({
      category: "travel",
      title: "Plan a ride",
      details: "Ask about a pickup time.",
    })).resolves.toBe("item-1");
    expect(rpc).toHaveBeenNthCalledWith(1, "get_my_court_plan_workspace");
    expect(rpc).toHaveBeenNthCalledWith(2, "create_court_plan_item", expect.objectContaining({
      p_workspace_id: "workspace-1",
      p_category: "travel",
    }));
  });

  it("changes only the status of an existing plan item", async () => {
    rpc.mockResolvedValue({ error: null });
    await updateCourtPlanItemStatus("item-1", "done");
    expect(rpc).toHaveBeenCalledWith("update_court_plan_item_status", {
      p_court_plan_item_id: "item-1",
      p_status: "done",
    });
  });
});
