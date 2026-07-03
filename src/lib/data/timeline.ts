import { getSupabase } from "@/lib/supabase/client";
import { getSurvivor } from "@/lib/auth/session";
import type { Tables } from "@/lib/supabase/types";

export interface TimelineRow {
  id: string;
  date: string | null;
  relativeAnchor: string | null;
  description: string;
  visibility: "private" | "shareable";
  createdAt: string;
  updatedAt: string;
}

type DbRow = Pick<
  Tables<"timeline_events">,
  | "id"
  | "event_date"
  | "relative_anchor"
  | "description"
  | "visibility"
  | "created_at"
  | "updated_at"
>;

const COLS = "id, event_date, relative_anchor, description, visibility, created_at, updated_at";

function mapRow(r: DbRow): TimelineRow {
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
  const { data, error } = await getSupabase()
    .from("timeline_events")
    .select(COLS)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => mapRow(r as DbRow));
}

export async function upsertTimeline(input: {
  id?: string;
  date: string | null;
  relativeAnchor: string | null;
  description: string;
  visibility: "private" | "shareable";
}): Promise<TimelineRow> {
  const supabase = getSupabase();
  if (input.id) {
    const { data, error } = await supabase
      .from("timeline_events")
      .update({
        event_date: input.date,
        relative_anchor: input.relativeAnchor,
        description: input.description,
        visibility: input.visibility,
      })
      .eq("id", input.id)
      .select(COLS)
      .single();
    if (error) throw new Error(error.message);
    return mapRow(data as DbRow);
  }
  const survivor = await getSurvivor();
  if (!survivor) throw new Error("not authenticated");
  const { data, error } = await supabase
    .from("timeline_events")
    .insert({
      survivor_id: survivor.id,
      event_date: input.date,
      relative_anchor: input.relativeAnchor,
      description: input.description,
      visibility: input.visibility,
    })
    .select(COLS)
    .single();
  if (error) throw new Error(error.message);
  return mapRow(data as DbRow);
}

export async function deleteTimeline(id: string): Promise<void> {
  const { error } = await getSupabase().from("timeline_events").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
