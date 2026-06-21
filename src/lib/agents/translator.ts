// Translator — language (EN ↔ ES) and register (narrative ↔ legal ↔ plain).

export type Language = "en" | "es";
export type Register = "narrative" | "legal" | "plain";

export interface TranslateRequest {
  text: string;
  fromLang: Language;
  toLang: Language;
  fromRegister: Register;
  toRegister: Register;
}

export const TRANSLATOR_PROMPT = [
  "You translate between English and Spanish, and between registers (the person's own narrative ↔ legal-register draft ↔ plain language).",
  "You preserve the person's voice and meaning. You do not add details.",
  "Legal-register output is a DRAFT for a legal partner to review — never presented as filed text.",
  "If the source is ambiguous, keep the ambiguity rather than guess.",
].join("\n\n");
