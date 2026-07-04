// Aggregate-only session telemetry. Fire-and-forget: never blocks anything,
// never throws, and carries NOTHING but three allowlisted enum values —
// no content, no ids, no timing beyond the server's own day bucket.
// The deterministic stop path never waits on this.

import { getSupabase } from "@/lib/supabase/client";

export type TelemetryAgent = "base" | "regulator" | "interview" | "defense";
export type TelemetryMedium = "voice" | "avatar" | "text";
export type TelemetryEvent = "ended_clean" | "tripwire_stops" | "errors";

export function sendAgentTelemetry(
  agent: TelemetryAgent,
  medium: TelemetryMedium,
  event: TelemetryEvent,
): void {
  try {
    void getSupabase()
      .functions.invoke("advocate-agent", {
        body: { agent: "telemetry", input: { agent, medium, event } },
      })
      .catch(() => undefined);
  } catch {
    /* telemetry must never surface */
  }
}
