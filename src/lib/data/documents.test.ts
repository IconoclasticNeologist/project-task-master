import { describe, it, expect, vi, beforeEach } from "vitest";

const storageBucket = { upload: vi.fn(), remove: vi.fn(), createSignedUrl: vi.fn() };
const mockClient = { rpc: vi.fn(), from: vi.fn(), storage: { from: vi.fn(() => storageBucket) } };
vi.mock("@/lib/supabase/client", () => ({ getSupabase: () => mockClient }));
vi.mock("@/lib/auth/session", () => ({
  getSurvivor: vi.fn().mockResolvedValue({
    id: "sv1",
    first_name: null,
    preferred_language: "en",
    onboarded_at: null,
  }),
}));

import { listDocuments, uploadDocument, deleteDocument, getDocumentUrl } from "./documents";

beforeEach(() => vi.clearAllMocks());

describe("listDocuments", () => {
  it("maps a row and derives fileName from storage_path (stripping the uuid prefix)", async () => {
    mockClient.rpc.mockResolvedValue({
      data: [
        {
          id: "1",
          storage_path: "sv1/abc-123_report.pdf",
          note: "court",
          visibility: "private",
          uploaded_at: "t",
        },
      ],
      error: null,
    });
    const rows = await listDocuments();
    expect(mockClient.rpc).toHaveBeenCalledWith("app_list_documents", undefined);
    expect(rows[0]).toMatchObject({
      id: "1",
      fileName: "report.pdf",
      note: "court",
      visibility: "private",
      storagePath: "sv1/abc-123_report.pdf",
    });
  });
});

describe("uploadDocument", () => {
  it("uploads to the survivor's folder then saves metadata via the content RPC", async () => {
    storageBucket.upload.mockResolvedValue({ data: { path: "p" }, error: null });
    mockClient.rpc.mockResolvedValue({
      data: [
        {
          id: "2",
          storage_path: "sv1/u_report.pdf",
          note: null,
          visibility: "private",
          uploaded_at: "t",
        },
      ],
      error: null,
    });
    const file = new File(["x"], "report.pdf", { type: "application/pdf" });
    await uploadDocument({ file, note: "", visibility: "private" });
    expect((storageBucket.upload.mock.calls[0] as unknown[])[0]).toMatch(/^sv1\//);
    expect(mockClient.rpc).toHaveBeenCalledTimes(1);
    const [fn, args] = mockClient.rpc.mock.calls[0] as [string, Record<string, unknown>];
    expect(fn).toBe("app_save_document");
    expect(args).toMatchObject({ p_note: "", p_visibility: "private" });
    expect(String(args.p_storage_path)).toMatch(/^sv1\//);
  });

  it("removes the orphaned object if the metadata save fails", async () => {
    storageBucket.upload.mockResolvedValue({ data: { path: "p" }, error: null });
    storageBucket.remove.mockResolvedValue({ data: null, error: null });
    mockClient.rpc.mockResolvedValue({ data: null, error: { message: "insert boom" } });
    const file = new File(["x"], "a.pdf", { type: "application/pdf" });
    await expect(uploadDocument({ file, note: "", visibility: "private" })).rejects.toThrow(
      "insert boom",
    );
    expect(storageBucket.remove).toHaveBeenCalledTimes(1);
  });
});

describe("deleteDocument", () => {
  it("removes the object then deletes the row", async () => {
    storageBucket.remove.mockResolvedValue({ data: null, error: null });
    const eq = vi.fn().mockResolvedValue({ error: null });
    mockClient.from.mockReturnValue({ delete: () => ({ eq }) });
    await deleteDocument({ id: "9", storagePath: "sv1/x_a.pdf" });
    expect(storageBucket.remove).toHaveBeenCalledWith(["sv1/x_a.pdf"]);
    expect(eq).toHaveBeenCalledWith("id", "9");
  });
});

describe("getDocumentUrl", () => {
  it("returns a signed url", async () => {
    storageBucket.createSignedUrl.mockResolvedValue({
      data: { signedUrl: "https://signed" },
      error: null,
    });
    expect(await getDocumentUrl("sv1/x_a.pdf")).toBe("https://signed");
  });
});
