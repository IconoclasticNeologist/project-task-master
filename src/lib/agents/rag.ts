import { getSupabase } from "@/lib/supabase/client";

export interface RagHit {
  source_type?: "statement" | "document";
  source_id: string;
  chunk_text: string;
  language?: string | null;
  score: number;
}

/** Best-effort: a failed index must never disrupt the survivor's flow. */
export async function indexStatement(sourceId: string, text: string, language: "en" | "es" | null): Promise<void> {
  try {
    await getSupabase().functions.invoke("advocate-rag", {
      body: { action: "index", sourceType: "statement", sourceId, text, language },
    });
  } catch {
    /* swallow — indexing is best-effort */
  }
}

export async function searchWords(query: string, k = 6): Promise<RagHit[]> {
  const { data, error } = await getSupabase().functions.invoke("advocate-rag", {
    body: { action: "search", query, k },
  });
  if (error) throw new Error(error.message);
  return ((data as { hits?: RagHit[] } | null)?.hits ?? []);
}
