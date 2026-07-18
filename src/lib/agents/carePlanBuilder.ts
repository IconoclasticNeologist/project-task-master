// The care-plan helper's client runner — the person says what's coming up and
// what steadies them; the helper hands back DRAFT court-day steps (logistics
// and care, never testimony content). Keep-per-step into the real plan.
//
// The thread lives in component memory only (never persisted); the server is
// stateless; nothing touches the real plan until the person keeps a step.

import { getSupabase } from "@/lib/supabase/client";
import type { CourtPlanCategory } from "@/lib/data/courtPlan";

export interface CarePlanStep {
  category: CourtPlanCategory;
  title: string;
  details: string;
}

export interface CarePlanProposal {
  steps: CarePlanStep[];
  /** The helper's ONE skippable question, or "". */
  question: string;
  note: string;
}

export interface CarePlanTurn {
  role: "user" | "helper";
  content: string;
}

const CATEGORIES: CourtPlanCategory[] = [
  "hearing_details",
  "travel",
  "accommodation",
  "support",
  "question",
];

/** Defensive re-validation of the server's already-validated contract. */
export function parseCarePlanProposal(data: unknown): CarePlanProposal {
  const v = (data ?? {}) as Record<string, unknown>;
  const steps = (Array.isArray(v.steps) ? v.steps : [])
    .map((e) => {
      if (!e || typeof e !== "object") return null;
      const row = e as { category?: unknown; title?: unknown; details?: unknown };
      const title = typeof row.title === "string" ? row.title.trim().slice(0, 200) : "";
      const details = typeof row.details === "string" ? row.details.trim().slice(0, 300) : "";
      const category =
        typeof row.category === "string" && (CATEGORIES as string[]).includes(row.category)
          ? (row.category as CourtPlanCategory)
          : "support";
      return title ? { category, title, details } : null;
    })
    .filter((e): e is CarePlanStep => e !== null)
    .slice(0, 4);
  const question = typeof v.question === "string" ? v.question.trim().slice(0, 200) : "";
  const note = typeof v.note === "string" ? v.note.trim().slice(0, 200) : "";
  return { steps, question, note };
}

export async function runCarePlanBuilder(
  turns: CarePlanTurn[],
  language: "en" | "es",
  aftercare: { supportPerson: string; calmingAnchor: string },
  example = false,
): Promise<CarePlanProposal> {
  const { data, error } = await getSupabase().functions.invoke("advocate-agent", {
    body: { agent: "careplan_builder", input: { turns, language, aftercare, example } },
  });
  if (error) throw new Error(error.message);
  const proposal = parseCarePlanProposal(data);
  if (proposal.steps.length === 0 && !proposal.question && !proposal.note) {
    throw new Error("empty proposal");
  }
  return proposal;
}
