import { describe, it, expect, vi, beforeEach } from "vitest";

const mockClient = { rpc: vi.fn(), storage: { from: vi.fn() } };
vi.mock("@/lib/supabase/client", () => ({ getSupabase: () => mockClient }));

import {
  listSharedClients,
  listSharedStatements,
  listSharedTimeline,
  listSharedDocuments,
} from "./professionalContent";

beforeEach(() => vi.clearAllMocks());

describe("professionalContent", () => {
  it("maps shared clients", async () => {
    mockClient.rpc.mockResolvedValue({
      data: [
        {
          workspace_id: "w1",
          organization_name: "Org",
          client_name: "A",
          scopes: ["shared_statements"],
        },
      ],
      error: null,
    });
    const c = await listSharedClients();
    expect(mockClient.rpc).toHaveBeenCalledWith("list_my_shared_content_clients", undefined);
    expect(c[0]).toEqual({
      workspaceId: "w1",
      organizationName: "Org",
      clientName: "A",
      scopes: ["shared_statements"],
    });
  });

  it("maps shared statements (decrypted server-side) and passes the workspace id", async () => {
    mockClient.rpc.mockResolvedValue({
      data: [{ id: "s1", raw_text: "hello", created_at: "t" }],
      error: null,
    });
    const s = await listSharedStatements("w1");
    expect(mockClient.rpc).toHaveBeenCalledWith("app_list_shared_statements", {
      p_workspace_id: "w1",
    });
    expect(s[0]).toEqual({ id: "s1", text: "hello", createdAt: "t" });
  });

  it("maps shared timeline", async () => {
    mockClient.rpc.mockResolvedValue({
      data: [
        {
          id: "t1",
          event_date: null,
          relative_anchor: "after the move",
          description: "d",
          created_at: "t",
        },
      ],
      error: null,
    });
    const t = await listSharedTimeline("w1");
    expect(t[0]).toMatchObject({
      id: "t1",
      date: null,
      relativeAnchor: "after the move",
      description: "d",
    });
  });

  it("maps shared documents", async () => {
    mockClient.rpc.mockResolvedValue({
      data: [
        {
          id: "d1",
          storage_path: "sv/x",
          note: "n",
          file_name: "f.pdf",
          mime_type: "application/pdf",
          uploaded_at: "t",
        },
      ],
      error: null,
    });
    const d = await listSharedDocuments("w1");
    expect(d[0]).toMatchObject({
      id: "d1",
      fileName: "f.pdf",
      note: "n",
      mimeType: "application/pdf",
      storagePath: "sv/x",
    });
  });
});
