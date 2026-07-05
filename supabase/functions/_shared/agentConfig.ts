/**
 * Operational agent config: dashboard-editable knobs, validated on BOTH
 * write (advocate-admin) and read (token minters), so a corrupted row can
 * never push an un-allowlisted voice/model or an unsafe cap into a session.
 *
 * Prompts and guardrail content are NOT here — they live in git
 * (_shared/advocatePrompts.ts), SME-gated. Config affects session SETUP
 * only; the deterministic stop path never depends on it.
 */

import type { Mode } from "./advocatePrompts.ts";

export const VOICE_ALLOWLIST = ["Aoede", "Charon", "Kore", "Leda", "Puck", "Fenrir"];
export const MODEL_ALLOWLIST = ["gemini-3.1-flash-live-preview"];

export const MODE_DEFAULT_VOICE: Record<Mode, string> = {
  base: "Aoede",
  regulator: "Aoede",
  interview: "Aoede",
  defense: "Charon",
};

export interface AgentCaps {
  sessionSec: number;
  practiceSec: number;
  idleSec: number;
}

export interface AgentOpsConfig {
  voice: Record<Mode, string>;
  caps: AgentCaps;
  model: { primary: string; fallback: string | null };
  avatar: {
    id: string | null;
    name: string | null;
    sandbox: boolean;
    /** PUSH_TO_TALK (default): the mic opens only while answering, so the
     *  avatar can never be barged-in mid-sentence by ambient sound — and the
     *  person explicitly controls when they are heard. */
    interactivity: "PUSH_TO_TALK" | "CONVERSATIONAL";
  };
}

export const DEFAULT_OPS: AgentOpsConfig = {
  voice: { ...MODE_DEFAULT_VOICE },
  caps: { sessionSec: 45 * 60, practiceSec: 8 * 60, idleSec: 3 * 60 },
  model: { primary: MODEL_ALLOWLIST[0], fallback: null },
  avatar: { id: null, name: null, sandbox: true, interactivity: "PUSH_TO_TALK" },
};

// Caps are clamped, never trusted: a typo in the dashboard cannot create a
// 10-hour practice or a 1-second session.
export const CAP_BOUNDS: Record<keyof AgentCaps, [number, number]> = {
  sessionSec: [600, 3600],
  practiceSec: [180, 900],
  idleSec: [60, 600],
};

function clampCap(field: keyof AgentCaps, value: unknown): number {
  const [lo, hi] = CAP_BOUNDS[field];
  const n = typeof value === "number" && Number.isFinite(value) ? Math.round(value) : NaN;
  if (Number.isNaN(n)) return DEFAULT_OPS.caps[field];
  return Math.min(hi, Math.max(lo, n));
}

function pickVoice(value: unknown, fallback: string): string {
  return typeof value === "string" && VOICE_ALLOWLIST.includes(value) ? value : fallback;
}

/** Coerce arbitrary stored JSON into a safe, complete config. */
export function sanitizeOps(rows: Record<string, unknown>): AgentOpsConfig {
  const voice = (rows.voice ?? {}) as Record<string, unknown>;
  const caps = (rows.caps ?? {}) as Record<string, unknown>;
  const model = (rows.model ?? {}) as Record<string, unknown>;
  const avatar = (rows.avatar ?? {}) as Record<string, unknown>;
  return {
    voice: {
      base: pickVoice(voice.base, MODE_DEFAULT_VOICE.base),
      regulator: pickVoice(voice.regulator, MODE_DEFAULT_VOICE.regulator),
      interview: pickVoice(voice.interview, MODE_DEFAULT_VOICE.interview),
      defense: pickVoice(voice.defense, MODE_DEFAULT_VOICE.defense),
    },
    caps: {
      sessionSec: clampCap("sessionSec", caps.sessionSec),
      practiceSec: clampCap("practiceSec", caps.practiceSec),
      idleSec: clampCap("idleSec", caps.idleSec),
    },
    model: {
      primary:
        typeof model.primary === "string" && MODEL_ALLOWLIST.includes(model.primary)
          ? model.primary
          : DEFAULT_OPS.model.primary,
      fallback:
        typeof model.fallback === "string" && MODEL_ALLOWLIST.includes(model.fallback)
          ? model.fallback
          : null,
    },
    avatar: {
      id: typeof avatar.id === "string" && avatar.id ? avatar.id : null,
      name: typeof avatar.name === "string" && avatar.name ? avatar.name : null,
      sandbox: avatar.sandbox !== false, // safe default: sandbox ON
      interactivity: avatar.interactivity === "CONVERSATIONAL" ? "CONVERSATIONAL" : "PUSH_TO_TALK",
    },
  };
}

interface ConfigClient {
  from(table: string): {
    select(cols: string): Promise<{ data: Array<{ key: string; value: unknown }> | null }>;
  };
}

let cache: { at: number; ops: AgentOpsConfig } | null = null;
const CACHE_MS = 60_000;

/** Load + sanitize config with a 60s in-instance cache. Never throws. */
export async function loadOps(client: ConfigClient | null): Promise<AgentOpsConfig> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.ops;
  let rows: Record<string, unknown> = {};
  try {
    if (client) {
      const { data } = await client.from("agent_config").select("key, value");
      for (const row of data ?? []) rows[row.key] = row.value;
    }
  } catch {
    rows = {}; // config unavailable → safe defaults
  }
  const ops = sanitizeOps(rows);
  cache = { at: Date.now(), ops };
  return ops;
}

/** Test/admin hook: drop the cache so the next load reflects fresh writes. */
export function invalidateOpsCache(): void {
  cache = null;
}
