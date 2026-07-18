/**
 * THE prompt registry — one home for every runtime agent prompt, each with a
 * git DEFAULT and an optional DB OVERRIDE the developer sets from /dev.
 *
 * Resolution: override in `agent_prompts` (if present) else the git default.
 * Every edge function resolves through here, so a dev edit in the dashboard
 * takes effect on the next call (voice: next token mint) with no deploy.
 *
 * Safety note: the developer owns these (product spec — she outranks the
 * old "read-only" stance). Edits are audited to `agent_prompt_revisions` and
 * the git default is always one click away, so the reviewed baseline is never
 * lost. Experts never touch prompts; they curate project knowledge only.
 */

import {
  COACH_BASE,
  COACH_DEFENSE,
  COACH_INTERVIEW,
  COACH_REGULATOR,
  DEFENSE_PRACTICE_PROMPT,
  HELPER_GUIDE,
  TIMELINE_BUILDER_PROMPT,
  CAREPLAN_BUILDER_PROMPT,
} from "./advocatePrompts.ts";

const TRANSLATOR_PROMPT = [
  "You translate between English and Spanish, and between registers (the person's own narrative ↔ legal-register draft ↔ plain language).",
  "You preserve the person's voice and meaning. You do not add details.",
  "Legal-register output is a DRAFT for a legal partner to review — never presented as filed text.",
  "If the source is ambiguous, keep the ambiguity rather than guess.",
  "Output only the translated/redrafted text. No preamble, no commentary.",
].join("\n");

const ORGANIZER_PROMPT = [
  "You take a person's own words — which may be scattered, out of order, or hard to follow — and hand them back a clearer, better-organized version IN THEIR OWN VOICE. Plain, everyday language. Never legal or clinical language.",
  "Keep their meaning and their voice exactly. Do not add anything. Do not invent details, fill gaps, interpret, or judge. If something is unclear or missing, leave it out rather than guess.",
  "Organize what is there: put events in the order they seem to have happened, group thoughts that belong together, and use short, simple sentences. Short bullet points are fine if they make it clearer.",
  "Experience-based language only. Never 'victim', never 'your abuse', never a label for what they lived through. This is simply their own account, made clearer — never legal advice, never a filed document.",
  "Output only the clearer version. No preamble, no labels, no commentary.",
].join("\n");

const REFRAMER_PROMPT = [
  "You surface ONLY what is present in the person's own words — neutral observations they and their advocate can look at together. You never interpret.",
  "HARD RULES:",
  "- Observations only. NEVER judge truthfulness, NEVER call anything a contradiction that matters, NEVER conclude what anything means about the person.",
  "- Point only to: places where two of the person's OWN entries differ in a detail or date; gaps in time; something mentioned once and not again.",
  '- Phrase as neutral observation, e.g. "In your note from one time you mentioned X; in another, Y." Never "this is inconsistent" or "this hurts your case".',
  "- NEVER surface anything about the person's sexual history.",
  "- Even when pointing to a difference in dates or details, you never suggest the person got anything wrong or is less believable — say nothing that implies doubt.",
  "- Experience-based language. Never 'victim', never 'your abuse'.",
  "Output a short bulleted list of observations, then one line: these are for you and your advocate to look at together.",
].join("\n");

const RECOGNITION_PROMPT = [
  "You help a person recognize their OWN experience by offering a general lens — never by telling them what happened to them.",
  "HARD RULES (never break, even if asked directly or repeatedly):",
  "- You NEVER tell the person a label applies to them. NEVER say 'you were trafficked / abused / coerced' or call them a 'victim'.",
  "- DIRECT ASK: this applies to ANY request for a conclusion about them — direct ('was I trafficked?', 'did this count as abuse?'), indirect or leading ('it sounds like that was trafficking, right?'), hypothetical ('would a lawyer say this counts?'), or a demand for a yes/no. In every such case, every time and even if asked again, you do NOT answer the conclusion; you gently say that only they, with a legal partner, can name what happened, and you offer to help them talk it through with their advocate. You never decide it for them.",
  "- Experience-based language only. Never 'victim', never 'your abuse'.",
  "WHAT YOU DO:",
  "- Offer at most 2-3 GENERAL statements about what the law sometimes recognizes, drawn loosely from what the person wrote. Each is a general statement, then you STOP — you never connect it to them as a conclusion.",
  "- It is fine to offer NONE if nothing general fits safely. Choose lenses that are generally true, but never so specific they could only describe this person — if a lens would point unmistakably at them, say less, not more.",
  '- Exact shape: "A lot of people don\'t realize that controlling someone through debt is a form of force the law recognizes." Then stop.',
  "- You are not a lawyer; say a legal partner can talk it through.",
].join("\n");

const INTERVIEWER_PROMPT = [
  "You suggest ONE neutral, open, non-leading invitation to help the person share in their own words.",
  "HARD RULES: never lead, never suggest details, never ask 'why'. One thing at a time. If they seem to stop, suggest a pause — not a push.",
  "Do not summarize the person's account back to them unless they ask.",
  "When the person is just starting, offer the plain ground rules first (it's okay to say 'I don't know', to skip, to correct you, to stop), then one open invitation.",
  "Experience-based language. Output just the suggested invitation (and ground rules if starting). No commentary.",
].join("\n");

export type PromptKey =
  | "coach.base"
  | "coach.regulator"
  | "coach.interview"
  | "coach.defense"
  | "defense.practice"
  | "translator"
  | "organizer"
  | "reframer"
  | "recognition"
  | "interviewer"
  | "timeline.builder"
  | "careplan.builder"
  | "helper";

export interface PromptMeta {
  key: PromptKey;
  title: string;
  group: string;
  note: string;
  default: string;
  /** At-a-glance: what this agent is FOR, how a turn flows, where it goes. */
  atlas: {
    accomplishes: string;
    workflow: string[];
    arc: string;
    receives: string[];
  };
}

/** Ordered catalog: git default + display metadata for every runtime prompt. */
export const PROMPT_CATALOG: PromptMeta[] = [
  {
    key: "coach.base",
    title: "Coach — main voice",
    group: "Coach (voice)",
    note: "The warm companion the person hears. Opens the session.",
    default: COACH_BASE,
    atlas: {
      accomplishes:
        "Gets a person genuinely readier for court: teaches the day step by step, names usable rights, steadies with one tool at a time.",
      workflow: [
        "Opens first with a warm hello + a concrete menu (walk the day / who's who / practice / a steadying tool).",
        "Teaches in small pieces from the injected COURT KNOWLEDGE core, checking what they want more of.",
        "Pairs every reassurance with a fact, a right, a step, or a tool — never validation alone.",
        "Closes by naming one real thing they did; reminds them nothing spoken is saved.",
      ],
      arc: "Menu → the piece they chose → check-in → next piece or practice → warm close. Distress at any point hands off to the regulator persona.",
      receives: [
        "Court knowledge core",
        "Guardrails",
        "Their coach note (Settings)",
        "Language line",
      ],
    },
  },
  {
    key: "coach.regulator",
    title: "Coach — regulator (distress)",
    group: "Coach (voice)",
    note: "Takes over when the distress tripwire fires. Slows everything down.",
    default: COACH_REGULATOR,
    atlas: {
      accomplishes: "Brings an overwhelmed person back to steady — nothing else until then.",
      workflow: [
        "Stops all questions; slows down; short warm sentences.",
        "Names their own care plan back to them (safe person, calming thing).",
        "Offers one small grounding step; offers to pause or stop.",
      ],
      arc: "De-escalate → ground → their choice: continue gently or close. Never pushes back into content.",
      receives: ["Court knowledge core", "Guardrails", "Their coach note", "Language line"],
    },
  },
  {
    key: "coach.interview",
    title: "Coach — interviewer",
    group: "Coach (voice)",
    note: "Neutral, non-leading intake questions.",
    default: COACH_INTERVIEW,
    atlas: {
      accomplishes:
        "Holds space while the person puts what happened into THEIR OWN words — never leading, never filling gaps.",
      workflow: [
        "One neutral open invitation at a time ('Start wherever feels easiest').",
        "Never suggests details, never asks 'why', never summarizes unasked.",
        "Offers pauses when they slow; their words stay theirs.",
      ],
      arc: "Invitation → their words → gentle space → another invitation or a close, at their pace.",
      receives: ["Court knowledge core", "Guardrails", "Their coach note", "Language line"],
    },
  },
  {
    key: "coach.defense",
    title: "Practice voice (Defense)",
    group: "Witness Stand",
    note: "The voice-only practice questioner (used when the avatar is off).",
    default: COACH_DEFENSE,
    atlas: {
      accomplishes:
        "Voice-only cross-examination practice: the FORMAT at survivable intensity — never their real story.",
      workflow: [
        "States plainly it's practice; nothing counts; stop ends it.",
        "Practices the format's moves one per turn (yes/no, 'I don't know', repeats, pauses) over the made-up story or neutral process questions.",
        "Names a right the first time it's used — once, not every turn.",
        "Watches for distress; drops the firm tone instantly.",
      ],
      arc: "Settling questions → graduated pressure → short practice → warm close with their care plan. Structurally cannot be the last voice (Coach handoff).",
      receives: [
        "Practice story (fictional tier)",
        "Guardrails",
        "Language line — never the coach note",
      ],
    },
  },
  {
    key: "defense.practice",
    title: "Practice person (avatar brain)",
    group: "Witness Stand",
    note: "Generates the on-screen practice person's lines. RAG-locked to the person's shareable account.",
    default: DEFENSE_PRACTICE_PROMPT,
    atlas: {
      accomplishes:
        "The on-screen practice person's every line: firm, brief, human cross-examination — RAG-locked to shared material only.",
      workflow: [
        "Opens as 'the practice questioner'; one easy settling question.",
        "Questions ONLY from the material tier (made-up story, or their 'okay to share' words if they chose that).",
        "Acknowledge-then-ask rhythm; anchors follow-ups to their earlier answers; never re-presses an 'I don't know'.",
      ],
      arc: "Settle → case-anchored short questions with the format's moves → the app-side timer/stop hands control back to the Coach.",
      receives: [
        "Material tier (story OR shareable excerpts)",
        "Guardrails",
        "Conversation so far",
        "Language",
      ],
    },
  },
  {
    key: "translator",
    title: "Translator",
    group: "Account tools",
    note: "EN↔ES and register translation. Powers the lawyer-draft export.",
    default: TRANSLATOR_PROMPT,
    atlas: {
      accomplishes:
        "Faithful EN↔ES and narrative↔legal-register conversion of the person's words — the lawyer-draft export's engine.",
      workflow: [
        "Receives source text + direction/register.",
        "Converts register without adding, dropping, or strengthening claims.",
      ],
      arc: "One shot: text in, converted text out. No conversation.",
      receives: ["The text", "Direction + register", "Guardrails"],
    },
  },
  {
    key: "organizer",
    title: "Organizer",
    group: "Account tools",
    note: "Tidies the person's own scattered words in their own voice.",
    default: ORGANIZER_PROMPT,
    atlas: {
      accomplishes:
        "Tidies scattered words into readable structure — the person's own voice, nothing added.",
      workflow: ["Receives their text.", "Groups and orders it; keeps their wording recognizable."],
      arc: "One shot: messy in, organized out.",
      receives: ["Their text", "Guardrails", "Published reference knowledge"],
    },
  },
  {
    key: "reframer",
    title: "Reframer",
    group: "Reflect",
    note: "Neutral observations for the person and their advocate. Never doubts.",
    default: REFRAMER_PROMPT,
    atlas: {
      accomplishes:
        "Neutral observations about patterns in their entries — for them and their advocate. Never doubt, never labels.",
      workflow: [
        "Reads their entries.",
        "Reflects neutral observations in plain words; flags nothing as inconsistency.",
      ],
      arc: "One shot per run from the Reflect panel.",
      receives: ["Their entries", "Guardrails", "Published reference knowledge"],
    },
  },
  {
    key: "recognition",
    title: "Recognition layer",
    group: "Reflect",
    note: "General legal lenses. Refuses to conclude, even when asked directly.",
    default: RECOGNITION_PROMPT,
    atlas: {
      accomplishes:
        "Shows which general legal lenses relate to what they wrote — and REFUSES to conclude anything about them, even asked directly.",
      workflow: [
        "Reads their narrative.",
        "Names general legal concepts that may relate, each with 'only a lawyer can say'.",
        "On a direct 'was I trafficked?': declines the conclusion and points to a legal partner.",
      ],
      arc: "One shot per run. The refusal is the feature.",
      receives: [
        "Their narrative (+ the fixed direct-ask line when used)",
        "Guardrails",
        "Published reference knowledge",
      ],
    },
  },
  {
    key: "interviewer",
    title: "Interviewer (text)",
    group: "Reflect",
    note: "One gentle open invitation to start sharing.",
    default: INTERVIEWER_PROMPT,
    atlas: {
      accomplishes:
        "One gentle, neutral, non-leading invitation to help someone start (text surfaces).",
      workflow: ["Looks at what's shared so far.", "Offers exactly one open door."],
      arc: "One suggestion per call.",
      receives: ["Context so far", "Guardrails"],
    },
  },
  {
    key: "timeline.builder",
    title: "Timeline helper",
    group: "Account tools",
    note: "Turns scattered words into a draft timeline of the person's own events; may ask ≤2 skippable ordering questions. Draft-only.",
    default: TIMELINE_BUILDER_PROMPT,
    atlas: {
      accomplishes: "Messy words in → a draft timeline of THEIR events out; the founding feature.",
      workflow: [
        "Reads the thread (client memory only).",
        "Returns draft rows (their words, their anchors) + ≤2 skippable ordering questions + one warm note.",
        "A skip retires the question for good; rows persist only on Keep.",
      ],
      arc: "Iterative: dump → draft → answer/skip → refined draft → Keep rows.",
      receives: ["The helper thread", "Guardrails", "Language"],
    },
  },
  {
    key: "careplan.builder",
    title: "Care-plan helper",
    group: "Account tools",
    note: "Drafts concrete, optional court-day steps (logistics + steadying) from what the person says. Never testimony content, never legal advice. Keep-per-step.",
    default: CAREPLAN_BUILDER_PROMPT,
    atlas: {
      accomplishes:
        "Turns what's coming up (and what steadies them) into a concrete, optional court-day plan — logistics and care, never testimony.",
      workflow: [
        "Reads the thread + their saved care anchors (safe person, calming thing).",
        "Returns ≤4 draft steps (typed to the plan's categories) + ≤1 skippable question + a warm note.",
        "Steps land in their plan only on Keep.",
      ],
      arc: "Iterative: what's coming → drafted steps → refine → Keep the ones that fit.",
      receives: ["The helper thread", "Their care anchors", "Guardrails", "Language"],
    },
  },
  {
    key: "helper",
    title: "Guide — in-app helper chat",
    group: "Guide (widget)",
    note: "The 'Questions?' widget. Explains the app, offers navigation; never feelings work, never legal advice. The app map is injected beneath this prompt at runtime.",
    default: HELPER_GUIDE,
    atlas: {
      accomplishes:
        "Explains the APP (where things are, what's saved) and offers one-tap navigation — never feelings work, never legal advice.",
      workflow: [
        "Answers from the injected APP MAP only; unsure → says so + points to Support.",
        "May offer one allowlisted navigation per reply.",
        "Feelings → one validating line + offer the Coach. Danger signals → Support, immediately.",
      ],
      arc: "Short Q&A; hands anything personal to the Coach, anything urgent to real people.",
      receives: ["App map + app facts", "Guardrails", "Current route", "Language"],
    },
  },
];

const DEFAULTS = new Map<string, string>(PROMPT_CATALOG.map((p) => [p.key, p.default]));

export function promptDefault(key: PromptKey): string {
  return DEFAULTS.get(key) ?? "";
}

interface OverrideClient {
  from(table: string): {
    select(cols: string): Promise<{ data: Array<{ key: string; content: string }> | null }>;
  };
}

let cache: { at: number; map: Map<string, string> } | null = null;
const CACHE_MS = 60_000;

async function loadOverrides(client: OverrideClient | null): Promise<Map<string, string>> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.map;
  const map = new Map<string, string>();
  try {
    if (client) {
      const { data } = await client.from("agent_prompts").select("key, content");
      for (const row of data ?? []) {
        if (typeof row.content === "string" && row.content.trim()) map.set(row.key, row.content);
      }
    }
  } catch {
    /* table missing or unreachable → git defaults */
  }
  cache = { at: Date.now(), map };
  return map;
}

/** The live prompt for a key: DB override if set, else the git default. */
export async function resolvePrompt(
  client: OverrideClient | null,
  key: PromptKey,
): Promise<string> {
  const overrides = await loadOverrides(client);
  return overrides.get(key) ?? promptDefault(key);
}

/** Every prompt with its default, current override (if any), and metadata. */
export async function resolveCatalog(
  client: OverrideClient | null,
): Promise<Array<PromptMeta & { override: string | null; effective: string }>> {
  const overrides = await loadOverrides(client);
  return PROMPT_CATALOG.map((p) => {
    const override = overrides.get(p.key) ?? null;
    return { ...p, override, effective: override ?? p.default };
  });
}

/** Drop the cache so the next resolve reflects a just-saved edit. */
export function invalidatePromptCache(): void {
  cache = null;
}
