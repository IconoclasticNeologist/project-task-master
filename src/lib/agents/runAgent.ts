import { getSupabase } from "@/lib/supabase/client";

export type AgentName = "translator";

export interface TranslatorInput {
  text: string;
  fromLang: "en" | "es";
  toLang: "en" | "es";
  fromRegister: "narrative" | "legal" | "plain";
  toRegister: "narrative" | "legal" | "plain";
}

export async function runAgent(agent: AgentName, input: TranslatorInput): Promise<string> {
  const { data, error } = await getSupabase().functions.invoke("advocate-agent", { body: { agent, input } });
  if (error) throw new Error(error.message);
  const text = (data as { text?: string } | null)?.text;
  if (!text || !text.trim()) throw new Error("empty agent response");
  return text;
}
