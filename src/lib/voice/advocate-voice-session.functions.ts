// Server function: mint a short-lived bearer for the voice WS proxy.
//
// SAFETY: stateless — issuing a token writes nothing. No DB, no log of who
// asked, no IP. Caller gets back a bearer + the proxy URL; the Gemini API
// key never leaves the server.

import { createServerFn } from "@tanstack/react-start";
import { ADVOCATE_VOICE_CONFIG } from "./config";
import { isUnderCap } from "./cost-breaker";
import { mintToken } from "./session-token";

export const startAdvocateVoiceSession = createServerFn({ method: "POST" }).handler(
  async () => {
    const secret = process.env.VOICE_BEARER_SECRET;
    if (!secret) {
      throw new Error("VOICE_BEARER_SECRET not configured");
    }
    if (!isUnderCap(ADVOCATE_VOICE_CONFIG.caps.dailyDollarCap)) {
      throw new Error("Voice service temporarily unavailable");
    }
    const token = await mintToken(secret, 60);
    return {
      token,
      proxyPath: "/api/voice/proxy",
      model: ADVOCATE_VOICE_CONFIG.connection.model,
      voice: ADVOCATE_VOICE_CONFIG.connection.voice,
    };
  },
);
