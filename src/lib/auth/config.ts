// The access seam — the ONE place the front-door model is configured.
//
// GATED is the locked default and a SAFETY decision: the advocate's individualized
// tech-safety planning (is it safe for THIS person to hold this tool, on this device,
// now?) is part of the threat model. Removing the advocate changes that model.
//
// OPEN is documented for a possible future pivot but is INERT. Reaching it requires ALL of:
//   1. SME safety-review sign-off,
//   2. seeding a self-serve system gatekeeper (id below, NO auth_user_id → inert),
//   3. a create_self_serve_survivor() RPC (mirrors redeem_access_code minus the code),
//   4. setting accessMode to "open" here.
// There is deliberately NO runtime/operator switch and no UI affordance.
export type AccessMode = "gated" | "open";

export const accessMode: AccessMode = "gated";

// Self-serve is an ADDITIONAL door alongside gated codes (accessMode stays
// "gated" for the primary coded flow). A person with no advocate can enter on
// their own: the advocate's individualized tech-safety planning is replaced by
// an in-app safety check (src/routes/begin.tsx) shown BEFORE any identity is
// created, and a self-serve survivor is bound to no gatekeeper (NULL) via the
// create_self_serve_survivor() RPC. Set false to hide the solo door entirely.
export const selfServeEnabled = true;

// OPEN-MODE ONLY (dormant; not seeded in the gated build).
export const SELF_SERVE_GATEKEEPER_ID = "00000000-0000-0000-0000-0000000000bb";
