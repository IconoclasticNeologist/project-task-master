// Server functions for statements.
//
// SCAFFOLD ONLY — Lovable Cloud is disabled in this project, so these are
// not invoked at runtime today. The UI uses src/lib/data/local-store.ts as
// the build-eval store. The moment Cloud is enabled and an auth
// middleware is wired, swap the UI list/mutation call sites to these
// functions (one-line change per site) — the row shapes match.

import { createServerFn } from "@tanstack/react-start";

export interface StatementInput {
  id?: string;
  text: string;
  visibility: "private" | "shareable";
  language?: "en" | "es";
}

export const listStatementsFn = createServerFn({ method: "GET" }).handler(
  async () => {
    // TODO(cloud-on): use requireSupabaseAuth middleware and:
    //   ctx.supabase.from('statements').select('*').order('created_at', { ascending: false })
    return [] as StatementInput[];
  },
);

export const upsertStatementFn = createServerFn({ method: "POST" })
  .inputValidator((d: StatementInput) => d)
  .handler(async ({ data }) => {
    // TODO(cloud-on): ctx.supabase.from('statements').upsert({ ...data })
    return data;
  });

export const deleteStatementFn = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    // TODO(cloud-on): ctx.supabase.from('statements').delete().eq('id', data.id)
    return { ok: true, id: data.id };
  });
