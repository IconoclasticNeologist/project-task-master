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

import { listDocuments, uploadDocument, deleteDocument } from "./documents";

// 32 zero bytes, base64 — a valid AES-256 key for the crypto round-trip.
const KEY_B64 = btoa(String.fromCharCode(...new Uint8Array(32)));
const ROW = {
  id: "2",
  storage_path: "sv1/uuid",
  note: "court",
  file_name: "report.pdf",
  mime_type: "application/pdf",
  visibility: "private",
  uploaded_at: "t",
};

// Route rpc by function name; the file-key call is cached across the file, so
// always answer it with a valid key when it does fire.
function routeRpc(saveResult: { data: unknown; error: unknown }) {
  return (fn: string) => {
    if (fn === "get_document_key") return Promise.resolve({ data: KEY_B64, error: null });
    if (fn === "app_list_documents") return Promise.resolve({ data: [ROW], error: null });
    if (fn === "app_save_document") return Promise.resolve(saveResult);
    return Promise.resolve({ data: [], error: null });
  };
}

beforeEach(() => vi.clearAllMocks());

describe("listDocuments", () => {
  it("maps a row using the decrypted file_name + mime_type", async () => {
    mockClient.rpc.mockImplementation(routeRpc({ data: [ROW], error: null }));
    const rows = await listDocuments();
    expect(rows[0]).toMatchObject({
      id: "2",
      fileName: "report.pdf",
      mimeType: "application/pdf",
      note: "court",
      visibility: "private",
      storagePath: "sv1/uuid",
    });
  });
});

describe("uploadDocument", () => {
  it("encrypts the bytes, uploads ciphertext to a name-less path, saves metadata", async () => {
    storageBucket.upload.mockResolvedValue({ data: { path: "p" }, error: null });
    mockClient.rpc.mockImplementation(routeRpc({ data: [ROW], error: null }));
    const file = new File(["the private contents"], "report.pdf", { type: "application/pdf" });
    await uploadDocument({ file, note: "", visibility: "private" });

    // uploaded a Blob (ciphertext) to {survivor}/{uuid} with NO filename in path
    const [path, blob] = storageBucket.upload.mock.calls[0] as [string, Blob];
    expect(path).toMatch(/^sv1\/[0-9a-f-]+$/);
    expect(blob).toBeInstanceOf(Blob);

    // metadata carries the (to-be-encrypted) filename + mime, not in the path
    const saveCall = mockClient.rpc.mock.calls.find((c) => c[0] === "app_save_document");
    expect(saveCall?.[1]).toMatchObject({
      p_storage_path: path,
      p_file_name: "report.pdf",
      p_mime_type: "application/pdf",
      p_visibility: "private",
    });
  });

  it("removes the orphaned object if the metadata save fails", async () => {
    storageBucket.upload.mockResolvedValue({ data: { path: "p" }, error: null });
    storageBucket.remove.mockResolvedValue({ data: null, error: null });
    mockClient.rpc.mockImplementation(routeRpc({ data: null, error: { message: "insert boom" } }));
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
    await deleteDocument({ id: "9", storagePath: "sv1/x" });
    expect(storageBucket.remove).toHaveBeenCalledWith(["sv1/x"]);
    expect(eq).toHaveBeenCalledWith("id", "9");
  });
});
