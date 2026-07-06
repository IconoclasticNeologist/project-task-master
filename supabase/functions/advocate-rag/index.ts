/**
 * advocate-rag — survivor-scoped RAG (Gemini gemini-embedding-001 @ 1536).
 * Forwards the caller's JWT so ALL db ops are RLS-scoped (current_survivor_id()).
 * No service role. No PII logging. The raw GEMINI_API_KEY never leaves this function.
 *
 * Actions:
 *   index:  { action:"index", sourceType, sourceId, text, language }
 *           -> embed(text) -> upsert into public.embeddings (RLS: own rows only)
 *   search: { action:"search", query, k? }
 *           -> embed(query) -> rpc match_embeddings -> safe hits
 *
 * Cost: daily aggregate cap = TODO (pricing unknown).
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

const EMBED_MODEL = Deno.env.get("GEMINI_EMBED_MODEL") ?? "gemini-embedding-001";
const EMBED_DIM = 1536;

async function embed(apiKey: string, text: string): Promise<number[] | null> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { parts: [{ text }] },
        outputDimensionality: EMBED_DIM,
      }),
    },
  );
  if (!res.ok) return null;
  const out = await res.json();
  const values = out?.embedding?.values;
  return Array.isArray(values) && values.length === EMBED_DIM ? values : null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY") ?? Deno.env.get("GOOGLE_AI_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const authHeader = req.headers.get("Authorization");
    if (!apiKey || !supabaseUrl || !anonKey || !authHeader) {
      return json(503, { error: "RAG service not configured" });
    }
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const body = await req.json().catch(() => null);
    const action = body && typeof body === "object" ? body.action : null;

    if (action === "index") {
      const sourceType = body.sourceType === "document" ? "document" : "statement";
      const sourceId = typeof body.sourceId === "string" ? body.sourceId : null;
      const text = typeof body.text === "string" ? body.text : "";
      const language = typeof body.language === "string" ? body.language : null;
      if (!sourceId || !text.trim()) return json(400, { error: "Bad index request" });

      // Resolve survivor_id via RPC (JWT-scoped client: resolves to current_survivor_id()).
      // survivor_id is NOT NULL with no default — must be set explicitly in the upsert row.
      const { data: sv } = await supabase.rpc("current_survivor_id");
      if (!sv) return json(401, { error: "Not authenticated as a survivor" });

      const vec = await embed(apiKey, text);
      if (!vec) return json(502, { error: "Embedding failed" });
      // Index through the DEFINER RPC so the chunk is encrypted at rest
      // (chunk_text is stored as ciphertext; match_embeddings decrypts on read).
      const { error } = await supabase.rpc("app_index_embedding", {
        p_source_type: sourceType,
        p_source_id: sourceId,
        p_chunk_text: text,
        p_language: language,
        p_embedding: `[${vec.join(",")}]`,
      });
      if (error) return json(502, { error: "Index write failed" });
      return json(200, { ok: true });
    }

    if (action === "search") {
      const query = typeof body.query === "string" ? body.query : "";
      const k = Number.isFinite(body.k) ? Number(body.k) : 6;
      if (!query.trim()) return json(400, { error: "Empty query" });
      const vec = await embed(apiKey, query);
      if (!vec) return json(502, { error: "Embedding failed" });
      const { data, error } = await supabase.rpc("match_embeddings", {
        query_embedding: `[${vec.join(",")}]`,
        match_count: k,
      });
      if (error) return json(502, { error: "Search failed" });
      return json(200, { hits: data ?? [] });
    }

    return json(400, { error: "Unknown action" });
  } catch (_e) {
    return json(500, { error: "Internal error" });
  }
});
