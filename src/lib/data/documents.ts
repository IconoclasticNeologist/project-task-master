import { getSupabase } from "@/lib/supabase/client";
import { getSurvivor } from "@/lib/auth/session";
import { callRpc } from "@/lib/supabase/rpc";

export interface DocumentRow {
  id: string;
  fileName: string;
  note: string | null;
  visibility: "private" | "shareable";
  storagePath: string;
  uploadedAt: string;
}

// Shape returned by the content RPCs — note is decrypted server-side.
interface RpcRow {
  id: string;
  storage_path: string;
  note: string | null;
  visibility: "private" | "shareable";
  uploaded_at: string;
}

const BUCKET = "documents";

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024; // 10 MB

function fileNameFromPath(path: string): string {
  const seg = path.split("/").pop() ?? path;
  const us = seg.indexOf("_");
  return us >= 0 ? seg.slice(us + 1) : seg;
}

function mapRow(r: RpcRow): DocumentRow {
  return {
    id: r.id,
    fileName: fileNameFromPath(r.storage_path),
    note: r.note,
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
  // The storage RLS scopes each survivor to their own {survivor_id}/… folder,
  // so we still need the id for the upload path (the metadata insert resolves
  // the survivor itself, inside the RPC).
  const survivor = await getSurvivor();
  if (!survivor) throw new Error("not authenticated");
  const safe = input.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${survivor.id}/${crypto.randomUUID()}_${safe}`;
  const up = await supabase.storage.from(BUCKET).upload(path, input.file, { upsert: false });
  if (up.error) throw new Error(up.error.message);
  try {
    const rows = await callRpc<RpcRow[]>("app_save_document", {
      p_storage_path: path,
      p_note: input.note ?? "",
      p_visibility: input.visibility,
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
  const del = await supabase.storage.from(BUCKET).remove([doc.storagePath]);
  if (del.error) throw new Error(del.error.message);
  const { error } = await supabase.from("documents").delete().eq("id", doc.id);
  if (error) throw new Error(error.message);
}

export async function getDocumentUrl(storagePath: string): Promise<string> {
  const { data, error } = await getSupabase().storage.from(BUCKET).createSignedUrl(storagePath, 60);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
