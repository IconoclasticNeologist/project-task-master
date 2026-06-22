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
