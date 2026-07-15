import { getSupabase } from "@/lib/supabase/client";
import { getSurvivor } from "@/lib/auth/session";

export interface SurvivorSettings {
  language: "en" | "es";
  defaultVisibility: "private" | "shareable";
  calmingAnchor: string;
  supportPerson: string;
}

export async function loadSurvivorSettings(): Promise<SurvivorSettings> {
  const { data, error } = await getSupabase()
    .from("survivors")
    .select("preferred_language, default_visibility, calming_anchor, support_contact_name")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return {
    language: data?.preferred_language === "es" ? "es" : "en",
    defaultVisibility: data?.default_visibility ?? "private",
    calmingAnchor: data?.calming_anchor ?? "",
    supportPerson: data?.support_contact_name ?? "",
  };
}

// NOTE: support_contact_name is written directly (RLS-permitted, plain column) rather than via the
// set_support_contact RPC — that RPC is for the ENCRYPTED phone (p_phone non-null in its generated type).
// If a future slice captures a phone, route BOTH name+phone through set_support_contact to avoid divergence.
export async function saveSurvivorSettings(input: SurvivorSettings): Promise<void> {
  const survivor = await getSurvivor();
  if (!survivor) throw new Error("not authenticated");
  const { error } = await getSupabase()
    .from("survivors")
    .update({
      preferred_language: input.language,
      default_visibility: input.defaultVisibility,
      calming_anchor: input.calmingAnchor,
      support_contact_name: input.supportPerson,
    })
    .eq("id", survivor.id);
  if (error) throw new Error(error.message);
}

/** "A note to your Coach" — survivor-authored, survivor-visible, survivor-erasable.
 *  Encrypted at rest; read by the Coach at session start (never by practice modes). */
export async function loadCoachNote(): Promise<string> {
  const { data, error } = await getSupabase().rpc("app_get_coach_note");
  if (error) throw new Error(error.message);
  return data ?? "";
}

export async function saveCoachNote(note: string): Promise<void> {
  const { error } = await getSupabase().rpc("app_set_coach_note", { p_note: note });
  if (error) throw new Error(error.message);
}

/** Partial aftercare write (support person + calming anchor only) — used by the emotional onboarding. */
export async function saveAftercare(input: {
  supportPerson: string;
  calmingAnchor: string;
}): Promise<void> {
  const survivor = await getSurvivor();
  if (!survivor) throw new Error("not authenticated");
  const { error } = await getSupabase()
    .from("survivors")
    .update({ support_contact_name: input.supportPerson, calming_anchor: input.calmingAnchor })
    .eq("id", survivor.id);
  if (error) throw new Error(error.message);
}

/** Mark the emotional onboarding complete (powers the /onboarding short-circuit). */
export async function markOnboarded(): Promise<void> {
  const survivor = await getSurvivor();
  if (!survivor) return;
  const { error } = await getSupabase()
    .from("survivors")
    .update({ onboarded_at: new Date().toISOString() })
    .eq("id", survivor.id);
  if (error) throw new Error(error.message);
}
