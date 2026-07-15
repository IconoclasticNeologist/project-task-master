// Session closes.
//
// Containment close: no session that touched hard material may end without
// it. The Coach names something the survivor did today and points back to
// their aftercare plan. This is structural — the session-end path checks
// `requiresContainment`.
//
// Gentle close: every OTHER session still ends by naming one real thing the
// person did. Felt progress, without scores, streaks, or pressure — the only
// kind of progress marker the product's principles allow.
//
// All strings resolve through the language-aware copy proxy at CALL time, so
// a Spanish session closes in Spanish.

import { copy } from "@/lib/copy";

export interface SessionState {
  /** Has the session touched material that warrants a containment close? */
  hardMaterialTouched: boolean;
  /** From onboarding aftercare step. */
  aftercare: {
    supportPerson: string;
    calmingThing: string;
  } | null;
  /** Optional list of things the survivor did/said worth naming back. */
  notableMoments: string[];
}

export function requiresContainment(s: SessionState): boolean {
  return s.hardMaterialTouched;
}

export function generateContainmentClose(s: SessionState): string {
  const c = copy.session.close;
  const named =
    s.notableMoments.length > 0
      ? c.containmentNamed.replace("{moment}", s.notableMoments[s.notableMoments.length - 1])
      : c.containmentShowedUp;
  const aftercare = s.aftercare
    ? c.containmentAftercare
        .replace("{person}", s.aftercare.supportPerson)
        .replace("{thing}", s.aftercare.calmingThing)
    : c.containmentAftercareEmpty;
  // The containment frame, told truthfully: the spoken conversation is not
  // recorded anywhere (deliberate design), and the durable comfort points at
  // what IS kept — the words they chose to save, and the open door. The
  // closing screen's title already says "Thank you for trusting me with
  // that," so the close must not repeat it.
  return `${named} ${aftercare} ${c.staysHere}`;
}

/** The close for sessions that stayed light: name one real thing, truthfully. */
export function generateGentleClose(s: SessionState): string {
  const c = copy.session.close;
  const named = s.notableMoments.length > 0 ? c.gentleTalked : c.gentleShowedUp;
  return `${named} ${c.staysHere}`;
}
