import { getSupabase } from "@/lib/supabase/client";

export type AgentName = "translator" | "reframer" | "recognition" | "interviewer" | "organizer";

export interface TranslatorInput {
  text: string;
  fromLang: "en" | "es";
  toLang: "en" | "es";
  fromRegister: "narrative" | "legal" | "plain";
  toRegister: "narrative" | "legal" | "plain";
}
export interface ReframerInput {
  entries: string[];
}
export interface RecognitionInput {
  narrative: string;
  /** Scripted refusal demonstration — the server appends a FIXED direct ask
   *  ("Was I trafficked?") that the recognition prompt must decline. */
  directAsk?: boolean;
}
export interface InterviewerInput {
  context: string;
}
export interface OrganizerInput {
  text: string;
}
export type AgentInput =
  TranslatorInput | ReframerInput | RecognitionInput | InterviewerInput | OrganizerInput;

export async function runAgent(agent: AgentName, input: AgentInput): Promise<string> {
  const { data, error } = await getSupabase().functions.invoke("advocate-agent", {
    body: { agent, input },
  });
  if (error) throw new Error(error.message);
  const text = (data as { text?: string } | null)?.text;
  if (!text || !text.trim()) throw new Error("empty agent response");
  return text;
}
