// Aggregate-only daily dollar circuit breaker.
//
// SAFETY INVARIANTS (no-trace, zero IP retention):
//   - No IP addresses, ever.
//   - No per-session rows.
//   - No per-user counters.
//   - Just one running number: today's estimated spend.
//
// Implementation note: state lives in module-scope memory inside the Worker
// instance. Cloudflare Workers don't share memory across instances, so this
// is *best-effort* — it catches a runaway bug within a single instance but
// will not provide a strict global cap. The acceptable failure mode (per
// approved plan) is "soft cap" rather than building an admin surface or
// a DB table that would create traceable records.
//
// If a strict global cap is ever needed, the upgrade path is a single
// Durable Object holding one integer — still no IPs, no rows.

interface BreakerState {
  dayKey: string;
  cents: number;
}

const state: BreakerState = { dayKey: "", cents: 0 };

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC
}

function rollIfNewDay() {
  const k = todayKey();
  if (state.dayKey !== k) {
    state.dayKey = k;
    state.cents = 0;
  }
}

/** Returns true if today's spend is still under the cap. */
export function isUnderCap(dailyDollarCap: number): boolean {
  rollIfNewDay();
  if (dailyDollarCap <= 0) return true; // cap disabled
  return state.cents < Math.round(dailyDollarCap * 100);
}

/** Record an estimated cost in cents. No IP, no session id, no user id. */
export function recordSpendCents(cents: number) {
  rollIfNewDay();
  state.cents += Math.max(0, Math.floor(cents));
}

/** Read-only snapshot for debugging. Never expose over public endpoints. */
export function _snapshot(): Readonly<BreakerState> {
  rollIfNewDay();
  return { ...state };
}
