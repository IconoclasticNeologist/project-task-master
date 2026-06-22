# Non-Voice Agent Layer — N2: RAG (embeddings + retrieval) + "search your words"

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**Goal:** Stand up survivor-scoped semantic search over their own statements — the RAG substrate the future context-aware agents (N3) will use — and ship an immediate payoff: a "search your words" feature.

**Decisions (recorded):** Embedding model = **Gemini `gemini-embedding-001`, `outputDimensionality: 1536`** (keeps the existing `embeddings.embedding vector(1536)` schema, single-provider, multilingual). Nothing is embedded yet, so the dimension is settled now.

**Architecture:**
- **`match_embeddings` RPC** (migration): cosine search over `embeddings`, **scoped to `current_survivor_id()`** (SECURITY DEFINER, locked search_path), HNSW `<=>`. Returns only safe columns (no PII).
- **`advocate-rag` edge function** mirrors `advocate-agent` but **forwards the survivor's JWT** (`createClient(url, anonKey, { global: { headers: { Authorization } } })`) so every DB op is RLS-scoped to the caller — NO service role. Actions: `index` (embed text → upsert into `embeddings` for the survivor) and `search` (embed query → `match_embeddings` → return hits). Gemini `embedContent` with `outputDimensionality: 1536`. No PII logging.
- **Client:** `indexStatement(sourceId, text, language)` + `searchWords(query)` via `functions.invoke`. Auto-index on statement create (fire-and-forget in the `useStatements` upsert success). A "search your words" panel on Account.

**Flags:** edge function needs operator deploy + `GEMINI_API_KEY`; embedding cost per statement is tiny but real (daily cap still TODO); unverifiable here (no Deno/live), same as the other edge functions. **N3 (agents that give advice/recognition over the words) remains SME-gated.**

---

## Task N2a: `match_embeddings` RPC migration

**Files:** Create `supabase/migrations/20260622000001_match_embeddings.sql`.

- [ ] **Step 1:** Create it:
```sql
-- Survivor-scoped semantic search over the survivor's own embeddings (RAG retrieval).
-- SECURITY DEFINER + current_survivor_id() bind: a caller only ever sees THEIR vectors.
-- Returns ONLY safe columns (no name/contact) — the no-PII-to-model boundary.

create or replace function public.match_embeddings(
  query_embedding extensions.vector(1536),
  match_count int
)
returns table (
  source_type public.embedding_source,
  source_id   uuid,
  chunk_text  text,
  language    text,
  score       double precision
)
language sql stable security definer set search_path = public, extensions as $$
  select e.source_type, e.source_id, e.chunk_text, e.language,
         1 - (e.embedding <=> query_embedding) as score
  from public.embeddings e
  where e.survivor_id = public.current_survivor_id()
    and e.embedding is not null
  order by e.embedding <=> query_embedding
  limit greatest(1, least(coalesce(match_count, 6), 20));
$$;

grant execute on function public.match_embeddings(extensions.vector, int) to authenticated;

-- One embedding row per source (N2: no chunking). Enables the edge function's
-- upsert(onConflict: 'source_id'). A future chunking pass would drop this and key
-- on (source_id, chunk_index) instead.
create unique index if not exists embeddings_source_id_key on public.embeddings (source_id);
```

- [ ] **Step 2:** `bunx tsc --noEmit` → clean (no app code references it; types.ts not required since it's called only inside the edge function). 
- [ ] **Step 3:** Commit:
```bash
git add supabase/migrations/20260622000001_match_embeddings.sql
git commit -m "feat(db): add survivor-scoped match_embeddings RPC (RAG cosine search)"
```

---

## Task N2b: `advocate-rag` edge function (authored)

**Files:** Create `supabase/functions/advocate-rag/index.ts`.

- [ ] **Step 1:** Create it:
```ts
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
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY") ?? Deno.env.get("GOOGLE_AI_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const authHeader = req.headers.get("Authorization");
    if (!apiKey || !supabaseUrl || !anonKey || !authHeader) {
      return json(503, { error: "RAG service not configured" });
    }
    // Survivor-scoped client (forwards the caller's JWT -> RLS + current_survivor_id()).
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
      const vec = await embed(apiKey, text);
      if (!vec) return json(502, { error: "Embedding failed" });
      const { error } = await supabase.from("embeddings").upsert(
        { source_type: sourceType, source_id: sourceId, chunk_text: text, language, embedding: `[${vec.join(",")}]` },
        { onConflict: "source_id" },
      );
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
```
> Note: this assumes `source_id` is unique enough for upsert `onConflict`. The `embeddings` table has no unique constraint on `source_id` today — for N2 (one embedding per statement, no chunking) this is acceptable; a real chunking pass (multiple rows per source) would key on `(source_id, chunk_index)` and add that column. Flagged.

- [ ] **Step 2:** Deno — do not tsc/test. Commit:
```bash
git add supabase/functions/advocate-rag/index.ts
git commit -m "feat(agents): add advocate-rag edge function (Gemini embeddings, JWT-scoped index/search)"
```

---

## Task N2c: client `indexStatement`/`searchWords` (TDD) + auto-index + search UI

**Files:** Create `src/lib/agents/rag.ts`, `src/lib/agents/rag.test.ts`; modify `src/lib/data/useStatements.ts`; modify `src/lib/copy/index.ts` + `src/routes/account.tsx` (search panel).

- [ ] **Step 1: Tests** — `src/lib/agents/rag.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const functions = { invoke: vi.fn() };
vi.mock("@/lib/supabase/client", () => ({ getSupabase: () => ({ functions }) }));

import { indexStatement, searchWords } from "./rag";

beforeEach(() => vi.clearAllMocks());

describe("indexStatement", () => {
  it("invokes advocate-rag with an index action", async () => {
    functions.invoke.mockResolvedValue({ data: { ok: true }, error: null });
    await indexStatement("s1", "hello", "en");
    expect(functions.invoke).toHaveBeenCalledWith("advocate-rag", {
      body: { action: "index", sourceType: "statement", sourceId: "s1", text: "hello", language: "en" },
    });
  });
  it("does not throw on error (best-effort indexing)", async () => {
    functions.invoke.mockResolvedValue({ data: null, error: { message: "x" } });
    await expect(indexStatement("s1", "hello", "en")).resolves.toBeUndefined();
  });
});

describe("searchWords", () => {
  it("returns hits", async () => {
    functions.invoke.mockResolvedValue({ data: { hits: [{ source_id: "s1", chunk_text: "hello", score: 0.9 }] }, error: null });
    const hits = await searchWords("hi");
    expect(hits).toEqual([{ source_id: "s1", chunk_text: "hello", score: 0.9 }]);
    expect(functions.invoke).toHaveBeenCalledWith("advocate-rag", { body: { action: "search", query: "hi", k: 6 } });
  });
  it("throws on a search error", async () => {
    functions.invoke.mockResolvedValue({ data: null, error: { message: "boom" } });
    await expect(searchWords("hi")).rejects.toThrow("boom");
  });
});
```

- [ ] **Step 2:** `bun run test` → FAIL.

- [ ] **Step 3: Implement** — `src/lib/agents/rag.ts`:
```ts
import { getSupabase } from "@/lib/supabase/client";

export interface RagHit {
  source_type?: "statement" | "document";
  source_id: string;
  chunk_text: string;
  language?: string | null;
  score: number;
}

/** Best-effort: a failed index must never disrupt the survivor's flow. */
export async function indexStatement(sourceId: string, text: string, language: "en" | "es" | null): Promise<void> {
  try {
    await getSupabase().functions.invoke("advocate-rag", {
      body: { action: "index", sourceType: "statement", sourceId, text, language },
    });
  } catch {
    /* swallow — indexing is best-effort */
  }
}

export async function searchWords(query: string, k = 6): Promise<RagHit[]> {
  const { data, error } = await getSupabase().functions.invoke("advocate-rag", {
    body: { action: "search", query, k },
  });
  if (error) throw new Error(error.message);
  return ((data as { hits?: RagHit[] } | null)?.hits ?? []);
}
```
(Note: the index test expects the invoke call even on error — so call `invoke` then swallow; with the mock resolving `{error}` the call still happened. The `try/catch` only guards a thrown invoke; a returned `{error}` is ignored by design. Confirm the first test still passes — it asserts the call shape, not a throw.)

- [ ] **Step 4:** `bun run test` → PASS.

- [ ] **Step 5: Auto-index on statement create.** In `src/lib/data/useStatements.ts`, import `indexStatement` from `@/lib/agents/rag`, and in the `upsert` mutation's `onSuccess`, after invalidating, fire-and-forget index the saved row:
```ts
    upsert: useMutation({
      mutationFn: upsertStatement,
      onSuccess: (row) => { invalidate(); void indexStatement(row.id, row.text, row.language); },
      onError,
    }),
```
(`upsertStatement` returns the `StatementRow` with `id`, `text`, `language`.)

- [ ] **Step 6: Search UI.** Add copy under `account` in `src/lib/copy/index.ts`:
```ts
    searchPlaceholder: "Search your words…",
    searchEmpty: "No matches yet.",
```
In `src/routes/account.tsx`, add a small search panel ABOVE the tabs (only meaningful on statements, but harmless globally): an input + a button that calls `searchWords`, showing the returned `chunk_text` snippets. Implement with a tiny local component or inline state using `useState` + `searchWords` (calm error → toast). Keep it minimal: input, "Search" button (disabled while pending), and a list of result snippets each in a small card. Do not disturb the existing tabs/lists.

- [ ] **Step 7:** `bunx tsc --noEmit` (clean), `bun run test` (pass). Commit:
```bash
git add src/lib/agents/rag.ts src/lib/agents/rag.test.ts src/lib/data/useStatements.ts src/lib/copy/index.ts src/routes/account.tsx
git commit -m "feat(agents): RAG client (index/search) + auto-index statements + search-your-words panel"
```

---

## Self-Review notes
- **Coverage:** match_embeddings RPC (N2a) ✓; JWT-scoped index/search edge fn (N2b) ✓; client + auto-index + search UI (N2c) ✓.
- **Safety:** retrieval is `current_survivor_id()`-scoped (RLS + the RPC's where-clause); edge fn forwards the JWT (no service role); only safe columns returned; indexing is best-effort (never blocks the survivor).
- **Flags:** edge fn deploy + key; embedding cost per write (daily cap TODO); single-embedding-per-statement (no chunking) — `onConflict: source_id` works for that, chunking would add `chunk_index`; N3 advice/recognition agents remain SME-gated.
