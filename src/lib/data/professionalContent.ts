// Professional (read-only) access to a client's SHARED content. Every call is
// authorized server-side by the scoped consent model — has_active_client_access
// (workspace_id, 'shared_*') — inside DEFINER RPCs that resolve the survivor and
// decrypt. The professional only ever holds a workspace_id.

import { getSupabase } from "@/lib/supabase/client";
import { callRpc } from "@/lib/supabase/rpc";
import { decryptToBlob } from "@/lib/data/fileCrypto";

export interface SharedClient {
  workspaceId: string;
  organizationName: string;
  clientName: string;
  scopes: string[];
}
export interface SharedStatement {
  id: string;
  text: string;
  createdAt: string;
}
export interface SharedTimelineItem {
  id: string;
  date: string | null;
  relativeAnchor: string | null;
  description: string;
  createdAt: string;
}
export interface SharedDocument {
  id: string;
  fileName: string;
  note: string | null;
  mimeType: string | null;
  storagePath: string;
  uploadedAt: string;
}

export const SHARED_STATEMENTS_SCOPE = "shared_statements";
export const SHARED_TIMELINE_SCOPE = "shared_timeline";
export const SHARED_DOCUMENTS_SCOPE = "shared_documents";

export async function listSharedClients(): Promise<SharedClient[]> {
  const rows = await callRpc<
    Array<{
      workspace_id: string;
      organization_name: string;
      client_name: string;
      scopes: string[];
    }>
  >("list_my_shared_content_clients");
  return (rows ?? []).map((r) => ({
    workspaceId: r.workspace_id,
    organizationName: r.organization_name,
    clientName: r.client_name,
    scopes: r.scopes ?? [],
  }));
}

export async function listSharedStatements(workspaceId: string): Promise<SharedStatement[]> {
  const rows = await callRpc<Array<{ id: string; raw_text: string | null; created_at: string }>>(
    "app_list_shared_statements",
    { p_workspace_id: workspaceId },
  );
  return (rows ?? []).map((r) => ({ id: r.id, text: r.raw_text ?? "", createdAt: r.created_at }));
}

export async function listSharedTimeline(workspaceId: string): Promise<SharedTimelineItem[]> {
  const rows = await callRpc<
    Array<{
      id: string;
      event_date: string | null;
      relative_anchor: string | null;
      description: string | null;
      created_at: string;
    }>
  >("app_list_shared_timeline", { p_workspace_id: workspaceId });
  return (rows ?? []).map((r) => ({
    id: r.id,
    date: r.event_date,
    relativeAnchor: r.relative_anchor,
    description: r.description ?? "",
    createdAt: r.created_at,
  }));
}

export async function listSharedDocuments(workspaceId: string): Promise<SharedDocument[]> {
  const rows = await callRpc<
    Array<{
      id: string;
      storage_path: string;
      note: string | null;
      file_name: string | null;
      mime_type: string | null;
      uploaded_at: string;
    }>
  >("app_list_shared_documents", { p_workspace_id: workspaceId });
  return (rows ?? []).map((r) => ({
    id: r.id,
    fileName: r.file_name ?? "document",
    note: r.note,
    mimeType: r.mime_type,
    storagePath: r.storage_path,
    uploadedAt: r.uploaded_at,
  }));
}

/** Download the ciphertext, decrypt with the workspace-scoped key, return an object URL. */
export async function getSharedDocumentObjectUrl(
  workspaceId: string,
  doc: { storagePath: string; mimeType: string | null },
): Promise<string> {
  const supabase = getSupabase();
  const signed = await supabase.storage.from("documents").createSignedUrl(doc.storagePath, 60);
  if (signed.error) throw new Error(signed.error.message);
  const res = await fetch(signed.data.signedUrl);
  if (!res.ok) throw new Error("Could not download the file.");
  const cipher = await res.blob();
  const keyB64 = await callRpc<string>("get_document_key_for_workspace", {
    p_workspace_id: workspaceId,
  });
  const plain = await decryptToBlob(cipher, keyB64, doc.mimeType);
  return URL.createObjectURL(plain);
}
