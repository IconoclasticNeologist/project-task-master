import { describe, it, expect, vi } from "vitest";

// fileCrypto imports callRpc → the supabase client; stub it so importing the
// module never tries to build a real client. The crypto tests don't call the RPC.
vi.mock("@/lib/supabase/client", () => ({ getSupabase: () => ({}) }));

import { encryptFile, decryptToBlob } from "./fileCrypto";

const KEY_B64 = btoa(String.fromCharCode(...Array.from({ length: 32 }, (_, i) => (i * 7) % 256)));

describe("fileCrypto", () => {
  it("round-trips a file through AES-GCM and preserves the mime type", async () => {
    const original = "the sensitive contents of a document";
    const file = new File([original], "doc.txt", { type: "text/plain" });
    const cipher = await encryptFile(file, KEY_B64);
    // ciphertext differs from plaintext and carries the 12-byte IV + GCM tag
    expect(cipher.size).toBeGreaterThan(original.length);
    const back = await decryptToBlob(cipher, KEY_B64, "text/plain");
    expect(await back.text()).toBe(original);
    expect(back.type).toBe("text/plain");
  });

  it("cannot be decrypted with the wrong key", async () => {
    const file = new File(["secret"], "x.txt", { type: "text/plain" });
    const cipher = await encryptFile(file, KEY_B64);
    const wrong = btoa(String.fromCharCode(...new Uint8Array(32).fill(9)));
    await expect(decryptToBlob(cipher, wrong, "text/plain")).rejects.toBeTruthy();
  });
});
