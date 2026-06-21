// Server function: mint a short-lived bearer for the voice WS proxy.
//
// SAFETY: stateless — issuing a token writes nothing. No DB, no log of who
// asked, no IP. Caller gets back a bearer + the proxy URL; the Gemini API
// key never leaves the server.

import { createServerFn } from "@tanstack/react-start";
import { ADVOCATE_VOICE_CONFIG } from "./config";
import { isUnderCap } from "./cost-breaker";
import { mintToken } from "./session-token";

type AdvocateVoiceSessionStart =
  | {
      ok: true;
      token: string;
      proxyPath: string;
      model: string;
      voice: string;
    }
  | {
      ok: false;
      reason: "not_configured" | "temporarily_unavailable";
    };

export const startAdvocateVoiceSession = createServerFn({ method: "POST" }).handler(
  async (): Promise<AdvocateVoiceSessionStart> => {
    const secret = process.env.VOICE_BEARER_SECRET;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!secret || !apiKey) {
      return { ok: false, reason: "not_configured" };
    }
    if (!isUnderCap(ADVOCATE_VOICE_CONFIG.caps.dailyDollarCap)) {
      return { ok: false, reason: "temporarily_unavailable" };
    }
    const token = await mintToken(secret, 60);
    return {
      ok: true,
      token,
      proxyPath: "/api/voice/proxy",
      model: ADVOCATE_VOICE_CONFIG.connection.model,
      voice: ADVOCATE_VOICE_CONFIG.connection.voice,
    };
  },
);
