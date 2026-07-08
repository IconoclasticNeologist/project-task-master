import { getSupabase } from "@/lib/supabase/client";
import { callRpc } from "@/lib/supabase/rpc";
import { signOut } from "@/lib/auth/session";
import { listStatements } from "@/lib/data/statements";
import { listTimeline } from "@/lib/data/timeline";
import { listDocuments } from "@/lib/data/documents";
import { listMyCourtPlanItems } from "@/lib/data/courtPlan";
import { loadSurvivorSettings } from "@/lib/data/settings";

const BUCKET = "documents";

/**
 * Everything the survivor has entered, gathered into one JSON object for download.
 * Document *files* aren't inlined (they can be large/binary and are viewable in-app);
 * their metadata is included so the export is a complete record of what exists.
 */
export async function exportMySpace(): Promise<{ filename: string; json: string }> {
  const [statements, timeline, documents, courtPlan, settings] = await Promise.all([
    listStatements(),
    listTimeline(),
    listDocuments(),
    listMyCourtPlanItems(),
    loadSurvivorSettings(),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    format: "the-advocate.export.v1",
    settings,
    statements,
    timeline,
    courtPlan,
    documents: documents.map((d) => ({
      fileName: d.fileName,
      note: d.note,
      visibility: d.visibility,
      uploadedAt: d.uploadedAt,
    })),
  };

  return {
    filename: `my-advocate-data-${new Date().toISOString().slice(0, 10)}.json`,
    json: JSON.stringify(payload, null, 2),
  };
}

/** Trigger a browser download of the export. */
export async function downloadMySpace(): Promise<void> {
  const { filename, json } = await exportMySpace();
  const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/**
 * Permanently erase the survivor's space: remove the document file blobs from Storage
 * (which the DB cascade can't reach), then cascade-delete every row via delete_my_space,
 * then sign out. Best-effort on blob removal — a leftover encrypted blob is harmless
 * ciphertext, and the metadata that points to it is gone regardless.
 */
export async function deleteMySpace(): Promise<void> {
  const supabase = getSupabase();

  try {
    const documents = await listDocuments();
    const paths = documents.map((d) => d.storagePath).filter(Boolean);
    if (paths.length > 0) await supabase.storage.from(BUCKET).remove(paths);
  } catch {
    // Proceed with the DB erase even if blob cleanup fails.
  }

  await callRpc<void>("delete_my_space");
  await signOut();
}
