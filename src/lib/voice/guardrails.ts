// Advocate voice guardrails — STRUCTURE only.
//
// Mirrors the shape of MindCrafter's DeveloperGuardrails so the wiring is
// identical, but the *content* is empty by default. Guardrails live in
// version-controlled TypeScript (not a DB row) so any change goes through
// git review — this is a safety-critical surface for survivors of trafficking.
//
// To add a rule: edit DEFAULT_ADVOCATE_GUARDRAILS below and ship via PR.

export interface AdvocateGuardrails {
  /** Topics Liv/the agent must refuse to engage with. */
  blockedTopics: string[];
  /** Map: trigger phrase -> redirect text the agent must say instead. */
  topicRedirects: Record<string, string>;
  /** Information the agent must never provide (e.g. legal advice). */
  neverProvide: string[];
  /** Topics the agent must always refer out (e.g. medical -> hotline). */
  alwaysRefer: { topic: string; referTo: string }[];
  /** Required tone descriptors (e.g. "calm", "non-judgmental"). */
  requiredTone: string[];
  /** Phrases the agent must never utter verbatim. */
  forbiddenPhrases: string[];
  /** Free-form style notes injected into the system prompt. */
  communicationStyle: string;
  /** Catch-all custom rules appended to the system prompt verbatim. */
  customRules: string[];
}

export const DEFAULT_ADVOCATE_GUARDRAILS: AdvocateGuardrails = {
  blockedTopics: [],
  topicRedirects: {},
  neverProvide: [],
  alwaysRefer: [],
  requiredTone: [],
  forbiddenPhrases: [],
  communicationStyle: "",
  customRules: [],
};
