// Containment / aftercare close.
//
// No session that touched hard material may end without this. The Coach
// names something the survivor did today and points back to their aftercare
// plan. This is structural — the session-end path checks `requiresContainment`.

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
  const named =
    s.notableMoments.length > 0
      ? `You named something today: ${s.notableMoments[s.notableMoments.length - 1]}. That took something.`
      : `You showed up today. That took something.`;
  const aftercare = s.aftercare
    ? `Your care plan is right here: ${s.aftercare.supportPerson} is who helps you feel safe; ${s.aftercare.calmingThing} is what helps you feel calm.`
    : `When you are ready, take a few minutes for yourself.`;
  // The containment frame: what was said stays here, and it will be here
  // when the person comes back. This line is the point of the close.
  const staysHere = `What we talked about stays here. It will be here when you come back.`;
  return `${named} ${aftercare} ${staysHere} Thank you for trusting me with that.`;
}
