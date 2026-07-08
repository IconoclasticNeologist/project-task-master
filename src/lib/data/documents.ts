import { getSupabase } from "@/lib/supabase/client";
import { getSurvivor } from "@/lib/auth/session";
import { callRpc } from "@/lib/supabase/rpc";
import { decryptToBlob, encryptFile, getDocumentKey } from "@/lib/data/fileCrypto";

export interface DocumentRow {
  id: string;
  fileName: string;
  note: string | null;
  mimeType: string | null;
  visibility: "private" | "shareable";
  storagePath: string;
  uploadedAt: string;
}

// Shape returned by the content RPCs — note + file_name are decrypted server-side.
interface RpcRow {
  id: string;
  storage_path: string;
  note: string | null;
  file_name: string | null;
  mime_type: string | null;
  visibility: "private" | "shareable";
  uploaded_at: string;
}

const BUCKET = "documents";

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024; // 10 MB

// Fallback only, for any legacy path that still carries a name.
function fileNameFromPath(path: string): string {
  const seg = path.split("/").pop() ?? path;
  const us = seg.indexOf("_");
  return us >= 0 ? seg.slice(us + 1) : seg;
}

function mapRow(r: RpcRow): DocumentRow {
  return {
    id: r.id,
    fileName: r.file_name ?? fileNameFromPath(r.storage_path),
    note: r.note,
    mimeType: r.mime_type,
    visibility: r.visibility,
    storagePath: r.storage_path,
    uploadedAt: r.uploaded_at,
  };
}

export async function listDocuments(): Promise<DocumentRow[]> {
  const rows = await callRpc<RpcRow[]>("app_list_documents");
  return (rows ?? []).map(mapRow);
}

export async function uploadDocument(input: {
  file: File;
  note: string;
  visibility: "private" | "shareable";
}): Promise<DocumentRow> {
  const supabase = getSupabase();
  // Storage RLS scopes each survivor to their own {survivor_id}/… folder, so we
  // need the id for the path. The metadata RPC resolves the survivor itself.
  const survivor = await getSurvivor();
  if (!survivor) throw new Error("not authenticated");

  // Encrypt the bytes in the browser; Storage only ever holds ciphertext. The
  // filename is NOT in the path anymore (it's encrypted in the metadata row).
  const keyB64 = await getDocumentKey();
  const cipher = await encryptFile(input.file, keyB64);
  const path = `${survivor.id}/${crypto.randomUUID()}`;
  const up = await supabase.storage
    .from(BUCKET)
    .upload(path, cipher, { upsert: false, contentType: "application/octet-stream" });
  if (up.error) throw new Error(up.error.message);
  try {
    const rows = await callRpc<RpcRow[]>("app_save_document", {
      p_storage_path: path,
      p_note: input.note ?? "",
      p_visibility: input.visibility,
      p_file_name: input.file.name,
      p_mime_type: input.file.type || "application/octet-stream",
    });
    const row = (rows ?? [])[0];
    if (!row) throw new Error("save failed");
    return mapRow(row);
  } catch (e) {
    // Roll back the orphaned blob if the metadata write fails.
    await supabase.storage.from(BUCKET).remove([path]);
    throw e instanceof Error ? e : new Error("save failed");
  }
}

export async function deleteDocument(doc: { id: string; storagePath: string }): Promise<void> {
  const supabase = getSupabase();
  // Delete the metadata row first (the reversible, user-visible step). Only then remove
  // the ciphertext blob. If we removed bytes first and the row delete failed, the document
  // would stay listed forever but be permanently unopenable; an orphaned blob is harmless
  // ciphertext by comparison.
  const { error } = await supabase.from("documents").delete().eq("id", doc.id);
  if (error) throw new Error(error.message);
  const del = await supabase.storage.from(BUCKET).remove([doc.storagePath]);
  if (del.error) {
    // Best-effort: the authoritative record is already gone. Don't fail the user action
    // over a leftover encrypted blob.
    console.warn("[documents] blob cleanup failed after row delete:", del.error.message);
  }
}

/**
 * Download the ciphertext, decrypt it in the browser, and return an object URL
 * for viewing. Pass the owning survivor's id when a gatekeeper is viewing a
 * shared document (omit for the survivor's own files). Revoke the URL when done.
 */
export async function getDecryptedObjectUrl(
  doc: { storagePath: string; mimeType: string | null },
  survivorId?: string,
): Promise<string> {
  const supabase = getSupabase();
  const signed = await supabase.storage.from(BUCKET).createSignedUrl(doc.storagePath, 60);
  if (signed.error) throw new Error(signed.error.message);
  const res = await fetch(signed.data.signedUrl);
  if (!res.ok) throw new Error("Could not download the file.");
  const cipher = await res.blob();
  const keyB64 = await getDocumentKey(survivorId);
  const plain = await decryptToBlob(cipher, keyB64, doc.mimeType);
  return URL.createObjectURL(plain);
}
