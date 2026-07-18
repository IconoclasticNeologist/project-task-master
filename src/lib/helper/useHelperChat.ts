// The helper chat's state machine. In-memory only — turns are wiped when the
// widget closes ("This chat isn't saved."), and nothing here is ever persisted.
//
// SAFETY ORDER (non-negotiable): the deterministic tripwire runs on every
// outgoing message BEFORE any network call. Crisis language never reaches a
// model; it renders the human-help card instantly and logs an aggregate count.

import { useCallback, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { exampleModeActive } from "@/lib/data/demoTools";
import { tripwire } from "@/lib/agents/safety/distress";
import { sendAgentTelemetry } from "@/lib/agents/telemetry";
import { parseHelperReply, type HelperReply } from "./parse";

export type HelperTurn =
  | { role: "user"; content: string; kind?: "crisis" | "stop" }
  | {
      role: "assistant";
      content: string;
      suggestions: string[];
      navigate?: HelperReply["navigate"];
      kind?: "crisis" | "stop";
    };

export type HelperSendState = "idle" | "sending";
export type HelperNotice = null | "offline" | "resting" | "error";

const MAX_HISTORY_TURNS = 12;
const MAX_MESSAGE_CHARS = 600;

export function useHelperChat(opts: { route: string; language: "en" | "es" }) {
  const [turns, setTurns] = useState<HelperTurn[]>([]);
  const [sendState, setSendState] = useState<HelperSendState>("idle");
  const [notice, setNotice] = useState<HelperNotice>(null);
  const exchangedRef = useRef(false);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim().slice(0, MAX_MESSAGE_CHARS);
      if (!text) return;

      // Deterministic safety first — crisis language never reaches the network.
      const sig = tripwire(text);
      if (sig?.kind === "crisis") {
        // kind on BOTH turns: the history filter below drops them, so crisis
        // text never reaches a model — not now, and not as later-turn context.
        setTurns((t) => [
          ...t,
          { role: "user", content: text, kind: "crisis" },
          { role: "assistant", content: "", suggestions: [], kind: "crisis" },
        ]);
        sendAgentTelemetry("helper", "text", "tripwire_stops");
        return;
      }
      if (sig?.kind === "stop") {
        setTurns((t) => [
          ...t,
          { role: "user", content: text, kind: "stop" },
          { role: "assistant", content: "", suggestions: [], kind: "stop" },
        ]);
        return;
      }

      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        setNotice("offline");
        return;
      }

      setNotice(null);
      setSendState("sending");
      const history = [...turns, { role: "user" as const, content: text }]
        .filter((t) => !("kind" in t && t.kind)) // crisis/stop cards are not conversation
        .slice(-MAX_HISTORY_TURNS)
        .map((t) => ({ role: t.role, content: t.content }));
      setTurns((t) => [...t, { role: "user", content: text }]);

      try {
        const { data, error } = await getSupabase().functions.invoke<{
          reply?: string;
          suggestions?: string[];
          navigate?: { to: string; label: string };
          error?: string;
        }>("advocate-agent", {
          body: {
            agent: "helper",
            input: {
              messages: history,
              route: optsRef.current.route,
              language: optsRef.current.language,
              example: exampleModeActive(),
            },
          },
        });
        if (error) {
          // supabase-js surfaces non-2xx as FunctionsHttpError with a Response.
          const status = (error as { context?: { status?: number } }).context?.status;
          if (status === 429) setNotice("resting");
          else setNotice("error");
          sendAgentTelemetry("helper", "text", "errors");
          return;
        }
        // Server already validated; parse re-validates (defense in depth).
        const parsed = parseHelperReply(JSON.stringify(data ?? {}));
        if (!parsed.reply) {
          setNotice("error");
          sendAgentTelemetry("helper", "text", "errors");
          return;
        }
        exchangedRef.current = true;
        setTurns((t) => [
          ...t,
          {
            role: "assistant",
            content: parsed.reply,
            suggestions: parsed.suggestions,
            navigate: parsed.navigate,
          },
        ]);
      } catch {
        setNotice("error");
        sendAgentTelemetry("helper", "text", "errors");
      } finally {
        setSendState("idle");
      }
    },
    [turns],
  );

  /** First open of a page-load — one aggregate count, no content. */
  const noteOpened = useCallback(() => {
    sendAgentTelemetry("helper", "text", "started");
  }, []);

  /** Close wipes the conversation (the privacy promise in the footer). */
  const closeAndWipe = useCallback(() => {
    if (exchangedRef.current) sendAgentTelemetry("helper", "text", "ended_clean");
    exchangedRef.current = false;
    setTurns([]);
    setNotice(null);
    setSendState("idle");
  }, []);

  return { turns, sendState, notice, send, noteOpened, closeAndWipe };
}
