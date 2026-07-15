// Parsing + validation for the helper agent's reply contract.
//
// The model is asked for strict JSON: { reply, suggestions?, navigate? }.
// Models drift, so parsing is lenient (fenced blocks, prose fallback) while
// VALIDATION is strict: navigation only to allowlisted in-app routes,
// suggestions clamped in count and length. The server validates too — this
// client pass is defense in depth.

import { isAllowedRoute, type HelperRoute } from "./appMap";

export interface HelperReply {
  reply: string;
  suggestions: string[];
  navigate?: { to: HelperRoute; label: string };
}

const MAX_SUGGESTIONS = 3;
const MAX_SUGGESTION_CHARS = 80;
const MAX_LABEL_CHARS = 40;

function extractJson(raw: string): unknown | null {
  const trimmed = raw.trim();
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(trimmed);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  if (!candidate.startsWith("{")) return null;
  try {
    return JSON.parse(candidate);
  } catch {
    // A JSON-looking prefix with trailing prose: try the outermost braces.
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

export function parseHelperReply(raw: string): HelperReply {
  const fallback: HelperReply = { reply: raw.trim(), suggestions: [] };
  const parsed = extractJson(raw);
  if (!parsed || typeof parsed !== "object") return fallback;

  const obj = parsed as Record<string, unknown>;
  const reply =
    typeof obj.reply === "string" && obj.reply.trim() ? obj.reply.trim() : fallback.reply;

  const suggestions = Array.isArray(obj.suggestions)
    ? obj.suggestions
        .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
        .map((s) => s.trim().slice(0, MAX_SUGGESTION_CHARS))
        .slice(0, MAX_SUGGESTIONS)
    : [];

  let navigate: HelperReply["navigate"];
  if (obj.navigate && typeof obj.navigate === "object") {
    const nav = obj.navigate as Record<string, unknown>;
    if (isAllowedRoute(nav.to)) {
      const label =
        typeof nav.label === "string" && nav.label.trim()
          ? nav.label.trim().slice(0, MAX_LABEL_CHARS)
          : nav.to;
      navigate = { to: nav.to, label };
    }
  }

  return { reply, suggestions, navigate };
}
