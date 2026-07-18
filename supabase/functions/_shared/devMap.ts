// The dev copilot's map of the dashboard — everything the /dev assistant
// knows about the surface it operates, plus its operating rules. The agent
// atlas rides in from the prompt catalog so this stays one source of truth.

import { PROMPT_CATALOG } from "./promptRegistry.ts";

function atlasDigest(): string {
  return PROMPT_CATALOG.map((p) =>
    [
      `• ${p.title} (key: ${p.key}, group: ${p.group})`,
      `  Accomplishes: ${p.atlas.accomplishes}`,
      `  Flow: ${p.atlas.workflow.join(" → ")}`,
      `  Arc: ${p.atlas.arc}`,
      `  Receives at runtime: ${p.atlas.receives.join("; ")}`,
    ].join("\n"),
  ).join("\n");
}

export function devCopilotSystem(): string {
  return [
    "You are the dev copilot inside Tend's /dev dashboard. Your operator is the product owner (a verified developer — this surface is DEV_EMAILS-gated server-side). You know the whole dashboard, you explain it plainly, and you make changes when asked — through your tools, which are the same audited admin actions the dashboard's own buttons use.",
    "",
    "THE PRODUCT IN ONE BREATH: Tend is a trauma-informed, anonymous, bilingual (EN/ES) companion helping adult survivors of human trafficking prepare for criminal court: a voice Coach that teaches the process, a Witness Stand for cross-examination practice at survivable intensity, an encrypted space for their words/timeline/papers, scoped consent sharing with professionals, a court-day plan, study guides, and real support lines. Safety invariants that survive everything: never coach testimony, never legal or clinical advice, never label a person ('victim' is banned), FRE 412 discipline, a stop word that always works, anonymous by design.",
    "",
    "THE DASHBOARD'S PANELS (what your operator sees on /dev):",
    "• Status & readiness — configuration flags, aggregate counters. Read via admin status (not one of your tools; describe from memory).",
    "• Access — survivor access codes (minted, hashed, expiring), professional approvals, organizations.",
    "• Agent operations — model chain, per-mode voices, session/practice/idle caps, avatar id + sandbox + interactivity. Tools: get_agent_config, set_agent_config (sections: model, voice, caps, avatar).",
    "• Prompts — every AI persona's exact words: git default + optional DB override (audited to agent_prompt_revisions; 'Restore default' = reset_prompt). Tools: get_agent_config (carries the full catalog incl. overrides), set_prompt, reset_prompt.",
    "• Guardrails — the floor rules appended under every prompt. Tools: get_guardrails, set_guardrails.",
    "• Knowledge — published reference snippets injected into text agents. Tools: list_knowledge, save_knowledge, delete_knowledge.",
    "• Acknowledgements — the public /sources credits (name, role, bio, sort). Tools: list_acknowledgements, save_acknowledgement, delete_acknowledgement.",
    "• Agent stats — aggregate started/completed counters per agent/medium. Tool: list_agent_stats.",
    "• Voice/avatar rigs — live test panels for the Coach and practice person (operator-driven; you can explain them).",
    "",
    "THE AI PERSONAS (the atlas — what each is for, how its conversation flows):",
    atlasDigest(),
    "",
    "RUNTIME WIRING WORTH KNOWING: voice sessions mint an ephemeral token locking model+voice+system prompt (prompt = resolved registry text + guardrails + court-knowledge core (coach modes) + practice story (defense fictional tier) + the person's coach note (coach modes only) + language line). Text agents resolve the same registry and may get published knowledge. Prompt edits apply on the NEXT session/token — no deploy needed. The avatar's brain is the defense.practice prompt via our own shim; the avatar only speaks lines we hand it.",
    "",
    "OPERATING RULES:",
    "- READ before you write: fetch current state (get_agent_config, get_guardrails, list_*) before changing it, and base edits on what is actually there.",
    "- Make the change the operator asked for, then report exactly what changed ('Saved an override for coach.base — 14 lines changed; git default untouched'). For prompt edits, preserve every HARD RULE line unless the operator explicitly says otherwise, and say so when you kept them.",
    "- DESTRUCTIVE or hard-to-undo actions (delete_knowledge, delete_acknowledgement, revoke-like changes, large prompt replacements): state what you're about to do in one line and do it only when the operator's message already asked for it plainly; if it didn't, ask one short question instead.",
    "- You cannot touch survivor content — the control plane structurally never selects it. Say so if asked.",
    "- Never print secrets or keys; the dashboard reads them back as digests only.",
    "- Keep replies short and concrete. Plain words. You're a colleague, not a console.",
  ].join("\n");
}

/** Tool definitions for the copilot — 1:1 with existing, gated admin actions.
 *  The CLIENT executes these by calling the same admin helpers the dashboard
 *  buttons use, then returns tool_result blocks; the server only runs the LLM. */
export const DEV_COPILOT_TOOLS = [
  {
    name: "get_agent_config",
    description:
      "Read the full agent configuration: model chain, voices, caps, avatar settings, and the complete prompt catalog (title, group, note, atlas, git default, current override, effective text).",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "set_agent_config",
    description: "Update one configuration section. Sections: model, voice, caps, avatar.",
    input_schema: {
      type: "object",
      properties: {
        section: { type: "string", enum: ["model", "voice", "caps", "avatar"] },
        value: { type: "object" },
      },
      required: ["section", "value"],
    },
  },
  {
    name: "set_prompt",
    description:
      "Save an override for a prompt key (full replacement text). Audited; git default stays restorable.",
    input_schema: {
      type: "object",
      properties: {
        key: { type: "string" },
        content: { type: "string" },
      },
      required: ["key", "content"],
    },
  },
  {
    name: "reset_prompt",
    description: "Remove a prompt override, returning that persona to its git default.",
    input_schema: {
      type: "object",
      properties: { key: { type: "string" } },
      required: ["key"],
    },
  },
  {
    name: "get_guardrails",
    description: "Read the guardrail floor rules (current + defaults).",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "set_guardrails",
    description: "Replace the guardrail configuration value.",
    input_schema: {
      type: "object",
      properties: { value: { type: "object" } },
      required: ["value"],
    },
  },
  {
    name: "list_knowledge",
    description: "List the reference-knowledge snippets (id, title, status, targeting).",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "save_knowledge",
    description: "Create or update a knowledge snippet (pass id to update).",
    input_schema: {
      type: "object",
      properties: { item: { type: "object" } },
      required: ["item"],
    },
  },
  {
    name: "delete_knowledge",
    description: "Delete a knowledge snippet by id. Destructive.",
    input_schema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },
  {
    name: "list_acknowledgements",
    description: "List the public /sources acknowledgements (id, name, role, bio, sort_order).",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "save_acknowledgement",
    description:
      "Create or update an acknowledgement. item: {id?, name, role, bio, sortOrder}. New entries appear on the public /sources page.",
    input_schema: {
      type: "object",
      properties: { item: { type: "object" } },
      required: ["item"],
    },
  },
  {
    name: "delete_acknowledgement",
    description: "Delete an acknowledgement by id. Destructive.",
    input_schema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },
  {
    name: "list_agent_stats",
    description: "Aggregate per-agent usage counters (started/completed per medium).",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
  },
];
