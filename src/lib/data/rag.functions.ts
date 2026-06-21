// RAG retrieval for the agent stack. SCAFFOLD — Cloud disabled.
//
// CRITICAL no-PII boundary: this function returns ONLY the survivor's own
// chunk text + ids + language. Never names, contacts, or any column outside
// the embeddings table.

import { createServerFn } from "@tanstack/react-start";

export interface RagHit {
  sourceTable: "statements" | "documents";
  sourceId: string;
  chunk: string;
  language: "en" | "es";
  score: number;
}

export const retrieveContextFn = createServerFn({ method: "POST" })
  .inputValidator((d: { query: string; k?: number }) => d)
  .handler(async ({ data }) => {
    // TODO(cloud-on):
    //   1) embed(query)
    //   2) ctx.supabase.rpc('match_embeddings', { q: vec, k: data.k ?? 6 })
    //   3) return only safe columns
    return [] as RagHit[];
  });
