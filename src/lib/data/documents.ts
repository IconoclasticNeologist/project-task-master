import { getSupabase } from "@/lib/supabase/client";
import { getSurvivor } from "@/lib/auth/session";
import type { Tables } from "@/lib/supabase/types";

export interface DocumentRow {
  id: string;
  fileName: string;
  note: string | null;
  visibility: "private" | "shareable";
  storagePath: string;
  uploadedAt: string;
}

type DbRow = Pick<Tables<"documents">, "id" | "storage_path" | "note" | "visibility" | "uploaded_at">;

const COLS = "id, storage_path, note, visibility, uploaded_at";
const BUCKET = "documents";

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024; // 10 MB

function fileNameFromPath(path: string): string {
  const seg = path.split("/").pop() ?? path;
  const us = seg.indexOf("_");
  return us >= 0 ? seg.slice(us + 1) : seg;
}

function mapRow(r: DbRow): DocumentRow {
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
  const { data, error } = await getSupabase()
    .from("documents")
    .select(COLS)
    .order("uploaded_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => mapRow(r as DbRow));
}

export async function uploadDocument(input: {
  file: File;
  note: string;
  visibility: "private" | "shareable";
}): Promise<DocumentRow> {
  const supabase = getSupabase();
  const survivor = await getSurvivor();
  if (!survivor) throw new Error("not authenticated");
  const safe = input.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${survivor.id}/${crypto.randomUUID()}_${safe}`;
  const up = await supabase.storage.from(BUCKET).upload(path, input.file, { upsert: false });
  if (up.error) throw new Error(up.error.message);
  const { data, error } = await supabase
    .from("documents")
    .insert({ survivor_id: survivor.id, storage_path: path, note: input.note || null, visibility: input.visibility })
    .select(COLS)
    .single();
  if (error) {
    await supabase.storage.from(BUCKET).remove([path]);
    throw new Error(error.message);
  }
  return mapRow(data as DbRow);
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
