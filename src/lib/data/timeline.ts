import { getSupabase } from "@/lib/supabase/client";
import { callRpc } from "@/lib/supabase/rpc";

export interface TimelineRow {
  id: string;
  date: string | null;
  relativeAnchor: string | null;
  description: string;
  visibility: "private" | "shareable";
  createdAt: string;
  updatedAt: string;
}

// Shape returned by the content RPCs — description is decrypted server-side.
interface RpcRow {
  id: string;
  event_date: string | null;
  relative_anchor: string | null;
  description: string | null;
  visibility: "private" | "shareable";
  created_at: string;
  updated_at: string;
}

function mapRow(r: RpcRow): TimelineRow {
  return {
    id: r.id,
    date: r.event_date,
    relativeAnchor: r.relative_anchor,
    description: r.description ?? "",
    visibility: r.visibility,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function listTimeline(): Promise<TimelineRow[]> {
  const rows = await callRpc<RpcRow[]>("app_list_timeline");
  return (rows ?? []).map(mapRow);
}

export async function upsertTimeline(input: {
  id?: string;
  date: string | null;
  relativeAnchor: string | null;
  description: string;
  visibility: "private" | "shareable";
}): Promise<TimelineRow> {
  const rows = await callRpc<RpcRow[]>("app_save_timeline_event", {
    p_id: input.id ?? null,
    p_event_date: input.date,
    p_relative_anchor: input.relativeAnchor,
    p_description: input.description,
    p_visibility: input.visibility,
  });
  const row = (rows ?? [])[0];
  if (!row) throw new Error("save failed");
  return mapRow(row);
}

export async function deleteTimeline(id: string): Promise<void> {
  // Delete never touches ciphertext, so it stays a direct RLS-scoped call.
  const { error } = await getSupabase().from("timeline_events").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
