import { getSupabase } from "@/lib/supabase/client";
import { callRpc } from "@/lib/supabase/rpc";

export interface StatementRow {
  id: string;
  text: string;
  visibility: "private" | "shareable";
  language: "en" | "es" | null;
  createdAt: string;
  updatedAt: string;
}

// Shape returned by the content RPCs — raw_text is decrypted server-side.
interface RpcRow {
  id: string;
  raw_text: string | null;
  visibility: "private" | "shareable";
  language: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(r: RpcRow): StatementRow {
  return {
    id: r.id,
    text: r.raw_text ?? "",
    visibility: r.visibility,
    language: r.language === "es" ? "es" : r.language === "en" ? "en" : null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function listStatements(): Promise<StatementRow[]> {
  const rows = await callRpc<RpcRow[]>("app_list_statements");
  return (rows ?? []).map(mapRow);
}

export async function upsertStatement(input: {
  id?: string;
  text: string;
  visibility: "private" | "shareable";
}): Promise<StatementRow> {
  const rows = await callRpc<RpcRow[]>("app_save_statement", {
    p_id: input.id ?? null,
    p_text: input.text,
    p_visibility: input.visibility,
  });
  const row = (rows ?? [])[0];
  if (!row) throw new Error("save failed");
  return mapRow(row);
}

export async function deleteStatement(id: string): Promise<void> {
  // Delete never touches ciphertext, so it stays a direct RLS-scoped call.
  const { error } = await getSupabase().from("statements").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
