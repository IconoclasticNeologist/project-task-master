# The Advocate — Make the Shell Visible

A visual + structural pass. No new features, no real screen content, no auth, no backend, no voice UI, no onboarding flow. Each route stays a calm placeholder inside a now-visible shell.

## 1. Visual baseline — already global, light touch-ups only

The calm tokens in `src/styles.css` (warm cream `--background`, soft near-black `--foreground`, muted sage `--primary`, sand `--muted` / `--border`, system humane sans, `font-size: 17px`, `line-height: 1.7`, `p { max-width: 34ch }`, no-motion base layer, light-mode only) are already applied globally via `@theme inline`. They render on every route through `<Shell>`'s `bg-background text-foreground`. No re-theming needed.

Small additions only:
- Add a subtle warm divider tone for the shell's header/footer hairlines (reuse `--border`, no new token).
- Confirm no component in `src/components/` or `src/routes/` uses `dark:` utilities (spot check; remove any I find — shadcn `ui/*` files are unused and stay untouched).

## 2. Shell becomes real

Edit `src/components/Shell.tsx`. Same centered `max-w-md` column, mobile-first at ~380px. The two reserved regions become visible:

- **Top region (`<header>`)** — a quiet bar containing only the persistent "I need a break" affordance on the right. Plain text link/button styling using `--muted-foreground`, no icon, no color alarm, no animation. Always reachable from every route. In this pass it navigates to `/` (Welcome acts as the safe landing). Soft `--border` hairline beneath.
- **Bottom region (`<footer>`)** — the primary nav. Five calm text links, evenly spaced, single row, wrapping gracefully on narrow widths: Home · Session · Resources · Account · Settings. Active route gets `--foreground`; the rest sit at `--muted-foreground`. No icons, no pill backgrounds, no motion. Soft `--border` hairline above.
- Middle `<main>` keeps `py-8` and renders `children` unchanged.

Welcome (`/`) and Onboarding (`/onboarding`) render inside the same shell — the break link and nav are visible there too, since the affordance must live everywhere.

## 3. Navigation works

Use TanStack Router `<Link>` (`@tanstack/react-router`) for both the break affordance and the five nav items. `useRouterState` (or `useMatchRoute`) drives the active-route styling. No new routes, no nav menu component beyond what lives inside `Shell`.

## 4. Routes stay calm placeholders

Each of the seven route files keeps its single `<h1>` inside `<Shell>`. No content, no inputs, no controls added. Specifically:
- `/onboarding` — single placeholder, no paced sequence.
- `/session` — single placeholder, no voice UI, no controls.
- `/` — single Welcome placeholder.

Placeholder copy stays plain and experience-based. None of the forbidden label words appear anywhere (code, comments, or UI).

## Files

- Modify: `src/components/Shell.tsx` (real header with break link, real footer nav, hairlines).
- No new files. No route files change. No `styles.css` token changes (only possibly removing stray `dark:` if found in app code).

## Out of scope (will not build)

Auth, dark mode, dashboard, backend / Supabase calls, real screen content, forms, chat UI, timelines, uploads, voice UI, multi-step onboarding, mock data, icon decoration, motion, PWA changes.

Confirm and I'll build exactly this.
