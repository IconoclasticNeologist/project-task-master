// Stateless HMAC-signed bearer for the voice proxy.
//
// SAFETY INVARIANT (no-trace): issuing a token MUST NOT create a database
// row, log line, or any persistent record. The token is self-contained:
// payload + HMAC-SHA256 signature, validated by signature only. There is
// no session table, no revocation list, no IP, no user binding.
//
// Lifetime is short (default 60s) so a leaked token has near-zero blast
// radius. The proxy validates signature + expiry on the WS upgrade.

const ALG = { name: "HMAC", hash: "SHA-256" } as const;

function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), ALG, false, [
    "sign",
    "verify",
  ]);
}

export interface VoiceTokenPayload {
  /** Expiry as unix seconds. */
  exp: number;
  /** Nonce — random, not stored anywhere. Just makes tokens non-deterministic. */
  nonce: string;
}

export async function mintToken(secret: string, ttlSec = 60): Promise<string> {
  const payload: VoiceTokenPayload = {
    exp: Math.floor(Date.now() / 1000) + ttlSec,
    nonce: b64urlEncode(crypto.getRandomValues(new Uint8Array(12))),
  };
  const body = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await getKey(secret);
  const sig = new Uint8Array(
    await crypto.subtle.sign(ALG, key, new TextEncoder().encode(body)),
  );
  return `${body}.${b64urlEncode(sig)}`;
}

export async function verifyToken(
  secret: string,
  token: string,
): Promise<VoiceTokenPayload | null> {
  const [body, sigPart] = token.split(".");
  if (!body || !sigPart) return null;
  const key = await getKey(secret);
  const ok = await crypto.subtle.verify(
    ALG,
    key,
    b64urlDecode(sigPart),
    new TextEncoder().encode(body),
  );
  if (!ok) return null;
  let payload: VoiceTokenPayload;
  try {
    payload = JSON.parse(new TextDecoder().decode(b64urlDecode(body)));
  } catch {
    return null;
  }
  if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }
  return payload;
}
