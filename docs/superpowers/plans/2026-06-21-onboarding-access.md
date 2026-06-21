# Onboarding & Access (Sub-project A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the advocate-gated front door — access code → anonymous Supabase identity → `survivors` row → minimal profile — in front of the existing emotional onboarding.

**Architecture:** One isolated `src/lib/auth/` module holds the entire entry seam. Gated is the locked default; "open" is documented but inert (SME-gated, never runtime-switchable). A new `redeem_access_code` RPC atomically creates the survivor row and marks the code redeemed; the client verifies the code pre-auth (so a bad code never creates an orphan anon user), then signs in anonymously, then redeems. A new `/enter` route runs code-entry + a 2-field profile, then hands off to the existing `/onboarding`.

**Tech Stack:** TanStack Start/Router (React 19), Supabase JS (anon key, RLS), `signInAnonymously()`, Postgres `SECURITY DEFINER` RPC, React Query, Vitest (new), shadcn/ui, Tailwind v4.

**Source spec:** `docs/superpowers/specs/2026-06-21-onboarding-access-design.md`

---

## Prerequisites (manual — do before Task 8 can pass end-to-end)

These are environment steps, not code. They gate *execution/verification*, not authoring.

- [ ] **Enable Supabase anonymous sign-ins (live):** Dashboard for project `suanbsyewsudlhrrzfks` → Authentication → Providers/Settings → enable "Anonymous sign-ins." (This — not Lovable Cloud — is the real blocker.)
- [ ] **Enable anonymous sign-ins (local):** add to `supabase/config.toml` under `[auth]`:
  ```toml
  [auth]
  enabled = true
  site_url = "http://localhost:3000"
  enable_anonymous_sign_ins = true
  ```
- [ ] **Local Supabase running** for DB/integration verification: `bunx supabase start`.

---

## File Structure

**Create:**
- `vitest.config.ts`, `vitest.setup.ts` — test infrastructure (Task 1)
- `supabase/migrations/20260621000002_redeem_access_code.sql` — the redeem RPC + grants (Task 2)
- `src/lib/auth/config.ts` — the `accessMode` seam constant (Task 3)
- `src/lib/auth/session.ts` — Supabase auth/identity wrappers + redeem orchestration (Task 4)
- `src/lib/auth/session.test.ts` — unit tests for the orchestration (Task 4)
- `src/lib/auth/useSurvivor.ts` — React Query hook (Task 5)
- `src/lib/auth/guard.ts` — `requireSurvivor` route guard (Task 5)
- `src/routes/enter.tsx` — the gate (code entry + profile) (Task 6)

**Modify:**
- `package.json` — add `test` scripts + dev deps (Task 1)
- `supabase/seed.sql` — dev gatekeeper + known dev code (Task 2)
- `src/lib/copy/index.ts` — add the `enter` copy section (Task 6)
- `src/routes/index.tsx` — point "Begin" at the seam (Task 7)
- `src/routes/{home,session,account,settings,onboarding}.tsx` — add the `requireSurvivor` guard (Task 7)

---

## Task 1: Test infrastructure (Vitest)

**Files:**
- Create: `vitest.config.ts`, `vitest.setup.ts`
- Modify: `package.json`

- [ ] **Step 1: Add dev dependencies**

Run:
```bash
bun add -d vitest jsdom @testing-library/react @testing-library/jest-dom
```
> ⚠️ Two gotchas: (1) this project runs an unusual **Vite 8** — let bun resolve the matching Vitest major rather than pinning; if a peer-dependency conflict appears, install the Vitest version whose peer range includes Vite 8 and note it. (2) If bun's 24h supply-chain guard skips a version, **stop and ask** before editing `minimumReleaseAgeExcludes` (per the foundation plan's standing rule).

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

// Standalone from vite.config.ts on purpose: the tanstackStart() plugin is not needed
// (and can interfere) under unit tests. We only need React + path-alias resolution.
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
```

- [ ] **Step 3: Create `vitest.setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Add scripts to `package.json`**

In the `"scripts"` block, add:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Add a sanity test to confirm the runner works**

Create `src/lib/auth/__sanity__.test.ts`:
```ts
import { describe, it, expect } from "vitest";

describe("vitest runner", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 6: Run it**

Run: `bun run test`
Expected: PASS — 1 passed.

- [ ] **Step 7: Commit**

```bash
git add package.json bun.lock vitest.config.ts vitest.setup.ts src/lib/auth/__sanity__.test.ts
git commit -m "test: add Vitest infrastructure"
```

---

## Task 2: `redeem_access_code` RPC migration + dev seed

**Files:**
- Create: `supabase/migrations/20260621000002_redeem_access_code.sql`
- Modify: `supabase/seed.sql`

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260621000002_redeem_access_code.sql`:
```sql
-- Atomically turn a valid access code + the caller's (anonymous) auth identity into a
-- survivor row. The client calls verify_access_code (migration 06) FIRST, pre-auth, so a
-- bad code never creates an orphan anonymous user; redeem_access_code is the authoritative,
-- locked write.

create or replace function public.redeem_access_code(p_code text)
  returns uuid
  language plpgsql security definer set search_path = public, extensions as $$
declare
  v_uid        uuid := auth.uid();
  v_survivor   uuid;
  v_code_id    uuid;
  v_gatekeeper uuid;
begin
  if v_uid is null then
    raise exception 'must be authenticated';
  end if;

  -- Idempotent: auth_user_id is unique, so an auth user maps to exactly one survivor.
  -- A double-submit / retry returns the existing row instead of erroring.
  select id into v_survivor from public.survivors where auth_user_id = v_uid;
  if v_survivor is not null then
    return v_survivor;
  end if;

  -- Lock the matching unredeemed, unexpired code so two concurrent redeems can't both win.
  select id, gatekeeper_id into v_code_id, v_gatekeeper
    from public.access_codes
   where code_hash = crypt(p_code, code_hash)
     and redeemed_by is null
     and (expires_at is null or expires_at > now())
   order by created_at
   limit 1
   for update;

  if v_code_id is null then
    raise exception 'invalid or expired code';
  end if;

  insert into public.survivors (auth_user_id, gatekeeper_id)
  values (v_uid, v_gatekeeper)
  returning id into v_survivor;

  update public.access_codes
     set redeemed_by = v_survivor, redeemed_at = now()
   where id = v_code_id;

  return v_survivor;
end;
$$;

grant execute on function public.redeem_access_code(text) to authenticated;
-- verify_access_code must be reachable before sign-in (anon role):
grant execute on function public.verify_access_code(text) to anon, authenticated;
```

- [ ] **Step 2: Add the dev seed**

Replace the contents of `supabase/seed.sql` with:
```sql
-- DEV SEED — local / preview ONLY. A dev gatekeeper + a known access code so the
-- onboarding gate is testable without the (later) gatekeeper provisioning UI.
-- Production codes are minted via mint_access_code(); never depend on this seed in prod.

insert into public.gatekeepers (id, role, org_name)
values ('00000000-0000-0000-0000-0000000000aa', 'advocate', 'DEV — local only')
on conflict (id) do nothing;

insert into public.access_codes (gatekeeper_id, code_hash, label)
select
  '00000000-0000-0000-0000-0000000000aa',
  extensions.crypt('DEV-CALM-PATH', extensions.gen_salt('bf')),
  'dev seed — DEV-CALM-PATH'
where not exists (
  select 1 from public.access_codes where label = 'dev seed — DEV-CALM-PATH'
);
```

- [ ] **Step 3: Apply migrations + seed against local Supabase**

Run: `bun run db:reset`
Expected: all migrations apply cleanly through `20260621000002`, seed runs without error.

- [ ] **Step 4: Verify the no-auth path (verify_access_code finds the seeded code)**

Run this SQL in the **Supabase Studio SQL editor** (http://localhost:54323) or via psql (`postgresql://postgres:postgres@127.0.0.1:54322/postgres`):
```sql
select public.verify_access_code('DEV-CALM-PATH') as gk,
       public.verify_access_code('NOPE') as bad;
```
Expected: `gk` = `00000000-0000-0000-0000-0000000000aa`, `bad` = `null`.
> Full redeem behavior (creates survivor + marks code) needs a real `auth.users` row from `signInAnonymously()`, so it is verified end-to-end in Task 8 via the JS client.

- [ ] **Step 5: Regenerate types so the new RPC is typed**

Run: `bun run gen:types`
Expected: `src/lib/supabase/types.ts` now lists `redeem_access_code` under `Functions`.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260621000002_redeem_access_code.sql supabase/seed.sql src/lib/supabase/types.ts
git commit -m "feat(db): add redeem_access_code RPC + dev access-code seed"
```

---

## Task 3: The `accessMode` seam

**Files:**
- Create: `src/lib/auth/config.ts`

- [ ] **Step 1: Write the config**

Create `src/lib/auth/config.ts`:
```ts
// The access seam — the ONE place the front-door model is configured.
//
// GATED is the locked default and a SAFETY decision: the advocate's individualized
// tech-safety planning (is it safe for THIS person to hold this tool, on this device,
// now?) is part of the threat model. Removing the advocate changes that model.
//
// OPEN is documented for a possible future pivot but is INERT. Reaching it requires ALL of:
//   1. SME safety-review sign-off,
//   2. seeding a self-serve system gatekeeper (id below, NO auth_user_id → inert),
//   3. a create_self_serve_survivor() RPC (mirrors redeem_access_code minus the code),
//   4. setting accessMode to "open" here.
// There is deliberately NO runtime/operator switch and no UI affordance.
export type AccessMode = "gated" | "open";

export const accessMode: AccessMode = "gated";

// OPEN-MODE ONLY (dormant; not seeded in the gated build).
export const SELF_SERVE_GATEKEEPER_ID = "00000000-0000-0000-0000-0000000000bb";
```

- [ ] **Step 2: Typecheck**

Run: `bunx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/auth/config.ts
git commit -m "feat(auth): add accessMode seam (gated default)"
```

---

## Task 4: `session.ts` — auth/identity wrappers + redeem orchestration (TDD)

**Files:**
- Create: `src/lib/auth/session.ts`, `src/lib/auth/session.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/auth/session.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockClient = {
  auth: {
    getSession: vi.fn(),
    signInAnonymously: vi.fn(),
    signOut: vi.fn(),
  },
  rpc: vi.fn(),
};
vi.mock("@/lib/supabase/client", () => ({ getSupabase: () => mockClient }));

import { redeemCode } from "./session";

beforeEach(() => {
  vi.clearAllMocks();
  mockClient.auth.getSession.mockResolvedValue({ data: { session: null } });
  mockClient.auth.signInAnonymously.mockResolvedValue({ data: { session: {} }, error: null });
  mockClient.auth.signOut.mockResolvedValue({ error: null });
});

describe("redeemCode", () => {
  it("rejects an invalid code WITHOUT creating an anonymous user", async () => {
    mockClient.rpc.mockResolvedValueOnce({ data: null, error: null }); // verify → null
    const result = await redeemCode("BAD");
    expect(result).toEqual({ ok: false });
    expect(mockClient.auth.signInAnonymously).not.toHaveBeenCalled();
  });

  it("redeems a valid code and returns the survivor id", async () => {
    mockClient.rpc
      .mockResolvedValueOnce({ data: "gk-1", error: null })        // verify → gatekeeper
      .mockResolvedValueOnce({ data: "survivor-1", error: null }); // redeem → survivor
    const result = await redeemCode("GOOD");
    expect(result).toEqual({ ok: true, survivorId: "survivor-1" });
    expect(mockClient.auth.signInAnonymously).toHaveBeenCalledTimes(1);
  });

  it("signs the anon session back out if redeem fails after sign-in (half-state guard)", async () => {
    mockClient.rpc
      .mockResolvedValueOnce({ data: "gk-1", error: null })
      .mockResolvedValueOnce({ data: null, error: { message: "invalid or expired code" } });
    const result = await redeemCode("GOOD");
    expect(result).toEqual({ ok: false });
    expect(mockClient.auth.signOut).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `bun run test`
Expected: FAIL — cannot resolve `./session` / `redeemCode is not a function`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/auth/session.ts`:
```ts
import { getSupabase } from "@/lib/supabase/client";

export interface Survivor {
  id: string;
  first_name: string | null;
  preferred_language: string | null;
}

export type RedeemResult = { ok: true; survivorId: string } | { ok: false };

/** Ensure an anonymous Supabase session exists (idempotent). */
export async function ensureAnonymous(): Promise<void> {
  const supabase = getSupabase();
  const { data } = await supabase.auth.getSession();
  if (data.session) return;
  const { error } = await supabase.auth.signInAnonymously();
  if (error) throw new Error(error.message);
}

/**
 * Gated entry: verify the code pre-auth (so a bad code never creates an orphan anon
 * user), establish an anonymous identity, then redeem (creates the survivor row +
 * marks the code used, atomically). If redeem fails after sign-in, sign back out so
 * no stuck half-state identity remains. Failure is single-reason by design.
 */
export async function redeemCode(code: string): Promise<RedeemResult> {
  const supabase = getSupabase();

  const verify = await supabase.rpc("verify_access_code", { p_code: code });
  if (verify.error || !verify.data) return { ok: false };

  try {
    await ensureAnonymous();
  } catch {
    return { ok: false };
  }

  const redeem = await supabase.rpc("redeem_access_code", { p_code: code });
  if (redeem.error || !redeem.data) {
    await supabase.auth.signOut(); // half-state guard
    return { ok: false };
  }
  return { ok: true, survivorId: redeem.data as string };
}

/** The current survivor row, or null if there is no session / no row. */
export async function getSurvivor(): Promise<Survivor | null> {
  const supabase = getSupabase();
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return null;
  const { data, error } = await supabase
    .from("survivors")
    .select("id, first_name, preferred_language")
    .maybeSingle();
  if (error) return null;
  return data;
}

/** Save the minimal post-redeem profile. RLS restricts the update to the own row. */
export async function updateProfile(
  survivorId: string,
  input: { preferred_language: "en" | "es"; first_name: string | null },
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("survivors")
    .update({ preferred_language: input.preferred_language, first_name: input.first_name })
    .eq("id", survivorId);
  if (error) throw new Error(error.message);
}

export async function signOut(): Promise<void> {
  await getSupabase().auth.signOut();
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `bun run test`
Expected: PASS — 3 passed (redeemCode) + the sanity test.

- [ ] **Step 5: Typecheck**

Run: `bunx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/auth/session.ts src/lib/auth/session.test.ts
git commit -m "feat(auth): add session.ts (anon sign-in, redeem orchestration, profile)"
```

---

## Task 5: `useSurvivor` hook + `requireSurvivor` guard

**Files:**
- Create: `src/lib/auth/useSurvivor.ts`, `src/lib/auth/guard.ts`

- [ ] **Step 1: Write the hook**

Create `src/lib/auth/useSurvivor.ts`:
```ts
import { useQuery } from "@tanstack/react-query";
import { getSurvivor, type Survivor } from "./session";

export function useSurvivor() {
  return useQuery<Survivor | null>({
    queryKey: ["survivor"],
    queryFn: getSurvivor,
    staleTime: 5 * 60 * 1000,
  });
}
```

- [ ] **Step 2: Write the guard**

Create `src/lib/auth/guard.ts`:
```ts
import { redirect } from "@tanstack/react-router";
import { getSurvivor } from "./session";

/**
 * Route guard for protected screens. Auth is client-side (anonymous session in
 * localStorage), so the check is skipped during SSR/prerender and enforced on the client.
 *
 * getSurvivor() throws on a transient query error and returns null ONLY when there is
 * genuinely no identity. We therefore redirect on a clean null, but on a transient error
 * we do NOT evict the survivor to the welcome screen — we let the route render (RLS keeps
 * data safe). The redirect throw stays OUTSIDE the try so it is not swallowed.
 */
export async function requireSurvivor() {
  if (typeof document === "undefined") return;
  let survivor;
  try {
    survivor = await getSurvivor();
  } catch {
    return; // transient error — do not evict; let the route render
  }
  if (!survivor) {
    throw redirect({ to: "/" });
  }
}
```

- [ ] **Step 3: Typecheck**

Run: `bunx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/auth/useSurvivor.ts src/lib/auth/guard.ts
git commit -m "feat(auth): add useSurvivor hook and requireSurvivor guard"
```

---

## Task 6: The `/enter` gate (copy + route)

**Files:**
- Modify: `src/lib/copy/index.ts`
- Create: `src/routes/enter.tsx`

- [ ] **Step 1: Add the `enter` copy section**

In `src/lib/copy/index.ts`, inside the `copy` object, add this block immediately **after** the `appName` line (before `shell:`):
```ts
  enter: {
    codeTitle: "Enter your code.",
    codeBody:
      "Whoever invited you gave you a code. You can type it here. There is no rush.",
    codeLabel: "Your code",
    codePlaceholder: "The code you were given",
    codeCta: "Continue",
    codeError:
      "That code did not work. A code can run out, or be used one time. You can check with whoever gave it to you.",
    profileTitle: "A couple of small things.",
    profileBody: "These help this space fit you. You can change them later.",
    languageLabel: "Which language feels easiest?",
    languageEn: "English",
    languageEs: "Español",
    nameLabel: "What can I call you? You can skip this.",
    namePlaceholder: "A name or a nickname",
    profileCta: "Continue",
  },
```

- [ ] **Step 2: Create the route**

Create `src/routes/enter.tsx`:
```tsx
import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { copy } from "@/lib/copy";
import { redeemCode, updateProfile } from "@/lib/auth/session";

export const Route = createFileRoute("/enter")({
  head: () => ({ meta: [{ title: "Enter — The Advocate" }] }),
  component: EnterScreen,
});

function EnterScreen() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"code" | "profile">("code");
  const [code, setCode] = useState("");
  const [survivorId, setSurvivorId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [language, setLanguage] = useState<"en" | "es">("en");
  const [name, setName] = useState("");

  const submitCode = async () => {
    setBusy(true);
    setFailed(false);
    const result = await redeemCode(code.trim());
    setBusy(false);
    if (!result.ok) {
      setFailed(true);
      return;
    }
    setSurvivorId(result.survivorId);
    setPhase("profile");
  };

  const submitProfile = async () => {
    setBusy(true);
    if (survivorId) {
      await updateProfile(survivorId, {
        preferred_language: language,
        first_name: name.trim() || null,
      });
    }
    setBusy(false);
    void navigate({ to: "/onboarding" });
  };

  return (
    <Shell hideNav>
      <div className="flex flex-1 flex-col justify-between gap-8 py-6">
        {phase === "code" ? (
          <>
            <div className="space-y-6 pt-10">
              <h1 className="text-2xl font-normal leading-snug tracking-tight">
                {copy.enter.codeTitle}
              </h1>
              <p className="text-base leading-relaxed text-foreground">{copy.enter.codeBody}</p>
              <Card>
                <CardContent className="space-y-2 py-5">
                  <Label htmlFor="code" className="text-xs uppercase tracking-wide text-muted-foreground">
                    {copy.enter.codeLabel}
                  </Label>
                  <Input
                    id="code"
                    value={code}
                    autoComplete="off"
                    autoCapitalize="characters"
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={copy.enter.codePlaceholder}
                  />
                  {failed && (
                    <p className="pt-1 text-sm leading-relaxed text-foreground">{copy.enter.codeError}</p>
                  )}
                </CardContent>
              </Card>
            </div>
            <button
              type="button"
              onClick={submitCode}
              disabled={busy || code.trim().length === 0}
              className="block w-full rounded-md bg-primary px-4 py-3 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
            >
              {copy.enter.codeCta}
            </button>
          </>
        ) : (
          <>
            <div className="space-y-6 pt-10">
              <h1 className="text-2xl font-normal leading-snug tracking-tight">
                {copy.enter.profileTitle}
              </h1>
              <p className="text-base leading-relaxed text-foreground">{copy.enter.profileBody}</p>
              <Card>
                <CardContent className="space-y-5 py-5">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                      {copy.enter.languageLabel}
                    </Label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setLanguage("en")}
                        className={`flex-1 rounded-md border px-3 py-2 text-sm ${
                          language === "en" ? "border-primary text-foreground" : "border-border text-muted-foreground"
                        }`}
                      >
                        {copy.enter.languageEn}
                      </button>
                      <button
                        type="button"
                        onClick={() => setLanguage("es")}
                        className={`flex-1 rounded-md border px-3 py-2 text-sm ${
                          language === "es" ? "border-primary text-foreground" : "border-border text-muted-foreground"
                        }`}
                      >
                        {copy.enter.languageEs}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs uppercase tracking-wide text-muted-foreground">
                      {copy.enter.nameLabel}
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={copy.enter.namePlaceholder}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            <button
              type="button"
              onClick={submitProfile}
              disabled={busy}
              className="block w-full rounded-md bg-primary px-4 py-3 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
            >
              {copy.enter.profileCta}
            </button>
          </>
        )}
      </div>
    </Shell>
  );
}
```

- [ ] **Step 3: Typecheck (also generates the route into `routeTree.gen.ts` via the dev server)**

Run: `bunx tsc --noEmit`
Expected: no errors. (If the `/enter` route type isn't known yet, start the dev server once — `bun run dev` — so the router plugin regenerates `routeTree.gen.ts`, then re-run.)

- [ ] **Step 4: Commit**

```bash
git add src/lib/copy/index.ts src/routes/enter.tsx src/routeTree.gen.ts
git commit -m "feat(auth): add /enter gate (code entry + minimal profile)"
```

---

## Task 7: Wire the welcome CTA to the seam + guard protected routes

**Files:**
- Modify: `src/routes/index.tsx`, `src/routes/home.tsx`, `src/routes/session.tsx`, `src/routes/account.tsx`, `src/routes/settings.tsx`, `src/routes/onboarding.tsx`

- [ ] **Step 1: Point "Begin" at the seam in `src/routes/index.tsx`**

Add the import near the top:
```ts
import { accessMode } from "@/lib/auth/config";
```
Change the "Begin" `<Link>`'s `to` prop from `"/onboarding"` to:
```tsx
            to={accessMode === "gated" ? "/enter" : "/onboarding"}
```
(Leave the "I've been here before" → `/home` link as-is; the guard added below handles a missing session.)

- [ ] **Step 2: Add the guard to each protected route**

For **each** of these files, add the import and the `beforeLoad` option to the `createFileRoute(...)` call.

`src/routes/home.tsx` — add import `import { requireSurvivor } from "@/lib/auth/guard";`, then in the route options add `beforeLoad: requireSurvivor,`:
```ts
export const Route = createFileRoute("/home")({
  beforeLoad: requireSurvivor,
  head: () => ({ meta: [{ title: "Home — The Advocate" }] }),
  component: HomeScreen,
});
```

`src/routes/session.tsx` — add the same import and `beforeLoad: requireSurvivor,` to its `createFileRoute("/session")({ ... })`.

`src/routes/account.tsx` — same: import + `beforeLoad: requireSurvivor,` in `createFileRoute("/account")({ ... })`.

`src/routes/settings.tsx` — same: import + `beforeLoad: requireSurvivor,` in `createFileRoute("/settings")({ ... })`.

`src/routes/onboarding.tsx` — same: import + `beforeLoad: requireSurvivor,` in `createFileRoute("/onboarding")({ ... })`. (In gated mode the emotional flow is reachable only after the gate.)

- [ ] **Step 3: Typecheck**

Run: `bunx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/routes/index.tsx src/routes/home.tsx src/routes/session.tsx src/routes/account.tsx src/routes/settings.tsx src/routes/onboarding.tsx
git commit -m "feat(auth): gate protected routes and route Begin through /enter"
```

---

## Task 8: End-to-end integration verification

> Requires the Prerequisites (anon sign-ins enabled, local Supabase running, `bun run db:reset` applied).

**Files:** none (verification only).

- [ ] **Step 1: Start the app**

Run: `bun run dev` (serves http://localhost:8080).

- [ ] **Step 2: Happy path**

In the browser: `/` → "Begin" → `/enter`. Enter `DEV-CALM-PATH` → Continue. Expected: advances to the profile step (no error). Pick a language, optionally a name → Continue. Expected: lands on `/onboarding` (the emotional flow), which then reaches `/home`.

- [ ] **Step 3: Confirm the DB side effects**

Run this SQL in the **Supabase Studio SQL editor** (http://localhost:54323) or via psql (`postgresql://postgres:postgres@127.0.0.1:54322/postgres`):
```sql
select (select count(*) from survivors) as survivors,
       (select redeemed_by is not null from access_codes
        where label = 'dev seed — DEV-CALM-PATH') as code_redeemed;
```
Expected: `survivors` ≥ 1, `code_redeemed` = `true`.

- [ ] **Step 4: Reused / invalid code**

Reload `/enter` in a fresh session (clear site data) and enter `DEV-CALM-PATH` again. Expected: the calm single-reason error (`copy.enter.codeError`) — the code is now redeemed. Enter a random string → same calm error. Confirm no second survivor row was created for the bad attempts.

- [ ] **Step 5: Guard redirects**

With site data cleared (no session), visit `/home` directly. Expected: redirected to `/`. After completing the gate once, "I've been here before" → `/home` works while the device session persists.

- [ ] **Step 6: Escape affordance**

On `/enter` (both steps), confirm "Leave now" (→ weather.gov) is present in the header.

- [ ] **Step 7: Run the full test suite once more**

Run: `bun run test`
Expected: all green.

---

## Self-Review notes

- **Spec coverage:** accessMode seam (Task 3) ✓; gated flow `/` → `/enter` → `/onboarding` → `/home` (Tasks 6–7) ✓; `verify` pre-auth + `signInAnonymously` + `redeem_access_code` SECURITY DEFINER / FOR UPDATE / idempotent (Tasks 2, 4) ✓; half-state sign-out (Task 4 test 3) ✓; minimal profile language+name (Task 6) ✓; calm single-reason error (Tasks 4, 6) ✓; guards incl. SSR skip (Task 5) ✓; dev seed for testability (Task 2) ✓; anon-sign-ins prerequisite, not Lovable Cloud (Prerequisites) ✓; migration named `20260621000002` (Task 2) ✓; `open` documented inert/SME-gated (Task 3) ✓.
- **Out of scope held:** emotional-onboarding → Supabase persistence (B); gatekeeper code-minting UI; email/multi-device recovery; UI i18n. Carried as spec flags.
- **Type consistency:** `redeemCode → RedeemResult`, `getSurvivor → Survivor | null`, `updateProfile(survivorId, {preferred_language, first_name})` used identically in `session.ts`, `useSurvivor.ts`, and `enter.tsx`. `accessMode` consumed in `index.tsx`. `requireSurvivor` signature matches `beforeLoad` usage.
- **Carried flags (non-blocking):** server-side rate-limiting on `verify_access_code`; bcrypt O(rows) at scale; React-Query-cache vs. per-nav guard fetch (acceptable for v1).
