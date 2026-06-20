# The Advocate — Scaffold Plan

Skeleton only. Empty placeholder screens, calm trauma-informed visual baseline, no logic, no backend, no auth, no content beyond screen titles.

## Stack note

The project is already on **TanStack Start (React 19 + TS + Vite + Tailwind v4 + shadcn/ui)**, not plain React 18 + React Router. Functionally equivalent and what the template ships with — I'll use TanStack Router for the routes. If you'd rather I tear this down and rebuild on plain React 18 + Vite + React Router, say so and I'll redo it; otherwise I'll proceed on the existing stack.

## Routes (file-based, under `src/routes/`)

Each renders only a placeholder `<h1>` with the screen name. No content, no inputs, no icons.


| File                          | URL           | Placeholder title |
| ----------------------------- | ------------- | ----------------- |
| `index.tsx` (exists, rewrite) | `/`           | Welcome           |
| `onboarding.tsx`              | `/onboarding` | Onboarding        |
| `home.tsx`                    | `/home`       | Home              |
| `session.tsx`                 | `/session`    | Session           |
| `account.tsx`                 | `/account`    | Account           |
| `resources.tsx`               | `/resources`  | Resources         |
| `settings.tsx`                | `/settings`   | Settings          |


`__root.tsx` stays as the router shell. No nav menu, no links between screens (you can hit URLs directly to confirm routing). Light mode only; remove the `.dark` block usage from defaults.

## Shared layout shell

A single `src/components/Shell.tsx` each route wraps with:

- Centered column, max-width 28rem, generous padding, mobile-first (380px baseline).
- Empty top region (room for future "I need a break" affordance — not built).
- Empty bottom region (room for future persistent controls — not built).
- Children render in the calm middle.

No animations, no transitions, no hover motion.

## Visual baseline (`src/styles.css`)

Replace the default token values with warm, low-stimulation light-mode tokens (oklch):

- `--background`: warm cream
- `--foreground`: soft near-black, not pure black
- `--muted` / `--muted-foreground`: sand tones
- `--primary`: muted sage, used sparingly
- `--border`: very soft sand
- Larger base font size, generous line-height (~1.7), comfortable letter-spacing, short max line-length on text.
- System humane sans-serif stack (no custom web font in this pass).
- Remove `.dark` overrides usage (file can keep the block but app never toggles it).
- Disable transition/animation defaults on interactive elements via base layer (no motion).

## Files to add/modify

- Add: `src/routes/onboarding.tsx`, `home.tsx`, `session.tsx`, `account.tsx`, `resources.tsx`, `settings.tsx`
- Add: `src/components/Shell.tsx`
- Modify: `src/routes/index.tsx` (replace placeholder image with "Welcome" inside Shell)
- Modify: `src/styles.css` (calm tokens, typography, no-motion base)
- Modify: `src/routes/__root.tsx` only to update `<title>` and meta to "The Advocate"

## Out of scope (confirmed, will not build)

Auth, dark mode/toggle, dashboard, backend/Supabase, real screen content, forms, chat UI, mock data, icons, multi-step onboarding, the break/stop button itself.

Confirm and I'll build exactly this.  
  
Approved — proceed on the existing TanStack Start / React 19 / Tailwind v4 stack, don't rebuild. Two things: make sure no components reference `dark:` variants (not just that the toggle is gone), and leave all PWA/manifest/service-worker setup out of scope — that's handled separately. Build exactly the plan.