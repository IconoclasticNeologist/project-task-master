// CORS for the edge functions. Browser calls come only from the app itself, so lock the
// allowed origin down in real environments via the APP_ORIGIN secret (e.g. the deployed
// site URL). Defaults to "*" so local dev (localhost:8080) and the demo build keep working
// when APP_ORIGIN is unset. JWT/bearer auth is the real gate; this is defense-in-depth.
const APP_ORIGIN = Deno.env.get("APP_ORIGIN")?.trim();

export const corsHeaders = {
  "Access-Control-Allow-Origin": APP_ORIGIN && APP_ORIGIN.length > 0 ? APP_ORIGIN : "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  Vary: "Origin",
};
