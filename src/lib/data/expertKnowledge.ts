// Expert knowledge data layer — talks to advocate-knowledge (approved-
// professional gated). The expert's ONLY power: curate the project knowledge
// the AI brains draw on.

import { getSupabase } from "@/lib/supabase/client";
import type { KnowledgeRow } from "@/lib/data/admin";

async function call<T>(action: string, extra: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await getSupabase().functions.invoke("advocate-knowledge", {
    body: { action, ...extra },
  });
  if (error) {
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === "function") {
      const body = await ctx.json().catch(() => null);
      if (body?.error) throw new Error(String(body.error));
    }
    throw new Error(error.message);
  }
  return data as T;
}

export const expertListKnowledge = () => call<{ items: KnowledgeRow[] }>("list");
export const expertSaveKnowledge = (item: {
  id?: string;
  title: string;
  body: string;
  agentKeys: string[];
  status: "draft" | "published" | "retired";
}) => call<{ ok: true; id: string }>("save", { item });
export const expertDeleteKnowledge = (id: string) => call<{ ok: true }>("delete", { id });
