import { getSupabase } from "@/lib/supabase/client";
import { getSurvivor } from "@/lib/auth/session";

export interface StatementRow {
  id: string;
  text: string;
  visibility: "private" | "shareable";
  language: "en" | "es" | null;
  createdAt: string;
  updatedAt: string;
}

interface DbRow {
  id: string;
  raw_text: string;
  visibility: "private" | "shareable";
  language: string | null;
  created_at: string;
  updated_at: string;
}

const COLS = "id, raw_text, visibility, language, created_at, updated_at";

function mapRow(r: DbRow): StatementRow {
  return {
    id: r.id,
    text: r.raw_text,
    visibility: r.visibility,
    language: (r.language as "en" | "es" | null) ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function listStatements(): Promise<StatementRow[]> {
  const { data, error } = await getSupabase()
    .from("statements")
    .select(COLS)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}

export async function upsertStatement(input: {
  id?: string;
  text: string;
  visibility: "private" | "shareable";
}): Promise<StatementRow> {
  const supabase = getSupabase();
  if (input.id) {
    const { data, error } = await supabase
      .from("statements")
      .update({ raw_text: input.text, visibility: input.visibility })
      .eq("id", input.id)
      .select(COLS)
      .single();
    if (error) throw new Error(error.message);
    return mapRow(data as DbRow);
  }
  const survivor = await getSurvivor();
  if (!survivor) throw new Error("not authenticated");
  const { data, error } = await supabase
    .from("statements")
    .insert({
      survivor_id: survivor.id,
      raw_text: input.text,
      visibility: input.visibility,
      language: survivor.preferred_language,
    })
    .select(COLS)
    .single();
  if (error) throw new Error(error.message);
  return mapRow(data as DbRow);
}

export async function deleteStatement(id: string): Promise<void> {
  const { error } = await getSupabase().from("statements").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
