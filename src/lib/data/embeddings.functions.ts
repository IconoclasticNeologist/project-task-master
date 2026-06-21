// Embedding generation. SCAFFOLD — Cloud disabled.
//
// When Cloud is enabled: on insert/update of a statement or document chunk,
// call the Lovable AI Gateway (or Supabase Edge) to produce a 1536-dim
// embedding (placeholder model — confirm multilingual quality before any
// real survivor data is embedded; see migration 12 comment) and upsert into
// public.embeddings via the service-role client.

import { createServerFn } from "@tanstack/react-start";

export const embedAndIndexFn = createServerFn({ method: "POST" })
  .inputValidator((d: { sourceTable: "statements" | "documents"; sourceId: string; text: string; language: "en" | "es" }) => d)
  .handler(async ({ data }) => {
    // TODO(cloud-on):
    //   1) chunk(text)
    //   2) embed each chunk (text-embedding-3-small, 1536-dim placeholder)
    //   3) supabaseAdmin.from('embeddings').upsert(rows)
    return { ok: true, indexed: 0, sourceId: data.sourceId };
  });
