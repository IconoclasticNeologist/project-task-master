// Ephemeral caption stream for the live session.
//
// SAFETY INVARIANT (matches useGeminiLive): this is a rolling render of the
// words currently being spoken — never an accumulating transcript. It holds at
// most ~one caption line of text, is cleared instantly by the same local-first
// path that silences audio, and nothing here is ever persisted.
//
// Gemini Live delivers the model's speech transcription as small text chunks
// with no turn marker on this path, so a new turn is inferred from a quiet gap.

export interface CaptionStream {
  /** Append a spoken chunk; returns the caption to display right now. */
  push(chunk: string): string;
  /** The caption to display right now (previous turn stays until a new one starts). */
  current(): string;
  /** Instant wipe — wired into the same paths that silence playback. */
  clear(): void;
}

interface CaptionStreamOptions {
  /** Longest caption kept on screen; older words fall off at a word boundary. */
  maxChars?: number;
  /** Quiet gap after which the next chunk starts a fresh caption. */
  gapMs?: number;
  /** Injectable clock for tests. */
  now?: () => number;
}

export function makeCaptionStream(opts: CaptionStreamOptions = {}): CaptionStream {
  const maxChars = opts.maxChars ?? 260;
  const gapMs = opts.gapMs ?? 2500;
  const now = opts.now ?? (() => Date.now());

  let text = "";
  let lastPushAt: number | null = null;

  const trimToTail = (s: string): string => {
    if (s.length <= maxChars) return s;
    // Keep the tail; step forward to the next word start so we never cut mid-word.
    let start = s.length - (maxChars - 2); // reserve room for "… "
    while (start < s.length && s[start - 1] !== " ") start++;
    return "… " + s.slice(start).trimStart();
  };

  return {
    push(chunk: string): string {
      const t = now();
      const isNewTurn = lastPushAt === null || t - lastPushAt > gapMs;
      text = trimToTail(isNewTurn ? chunk : text + chunk);
      lastPushAt = t;
      return text;
    },
    current(): string {
      return text;
    },
    clear(): void {
      text = "";
      lastPushAt = null;
    },
  };
}
