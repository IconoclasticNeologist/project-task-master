import { callRpc } from "@/lib/supabase/rpc";

// Client-side AES-GCM for document files. The key never appears in any table or
// storage object — it's derived server-side (get_document_key) from the Vault
// content key and handed only to the owner or an authorized gatekeeper. We cache
// it per target for the session so we don't round-trip on every file.
//
// Wire format: [12-byte IV][ciphertext+GCM tag]. AES-256-GCM (the derived key is
// a 32-byte HMAC-SHA256 digest, base64).

const keyCache = new Map<string, Promise<string>>();

/** Base64 file key for a survivor (own if omitted). Cached per session. */
export function getDocumentKey(survivorId?: string): Promise<string> {
  const cacheKey = survivorId ?? "self";
  let p = keyCache.get(cacheKey);
  if (!p) {
    p = callRpc<string>("get_document_key", survivorId ? { p_survivor_id: survivorId } : {});
    keyCache.set(cacheKey, p);
  }
  return p;
}

async function importKey(keyB64: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(keyB64), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

/** Encrypt a file to an opaque ciphertext blob (IV prepended). */
export async function encryptFile(file: File, keyB64: string): Promise<Blob> {
  const key = await importKey(keyB64);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    await file.arrayBuffer(),
  );
  return new Blob([iv, new Uint8Array(cipher)], { type: "application/octet-stream" });
}

/** Decrypt a ciphertext blob back to a typed blob for viewing. */
export async function decryptToBlob(
  cipher: Blob,
  keyB64: string,
  mimeType: string | null,
): Promise<Blob> {
  const key = await importKey(keyB64);
  const buf = new Uint8Array(await cipher.arrayBuffer());
  const iv = buf.slice(0, 12);
  const data = buf.slice(12);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return new Blob([plain], { type: mimeType ?? "application/octet-stream" });
}
