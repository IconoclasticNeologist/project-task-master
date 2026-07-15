import { describe, expect, it } from "vitest";
import {
  generatePhrase,
  hashPhrase,
  normalizePhrase,
  PHRASE_LENGTH,
  RECOVERY_WORDS,
} from "./words";

describe("recovery words", () => {
  it("has exactly 256 unique, simple, lowercase words", () => {
    expect(RECOVERY_WORDS.length).toBe(256);
    expect(new Set(RECOVERY_WORDS).size).toBe(256);
    for (const w of RECOVERY_WORDS) {
      expect(w).toMatch(/^[a-z]{3,8}$/);
    }
  });

  it("generates six words from the list", () => {
    for (let i = 0; i < 20; i++) {
      const words = generatePhrase().split(" ");
      expect(words.length).toBe(PHRASE_LENGTH);
      for (const w of words) expect(RECOVERY_WORDS).toContain(w);
    }
  });

  it("normalization forgives case, extra spaces, and line breaks", () => {
    expect(normalizePhrase("  Apple   BREAD\nhoney ")).toBe("apple bread honey");
  });

  it("hashes deterministically over the normalized phrase", async () => {
    const a = await hashPhrase("apple bread honey lemon olive peach");
    const b = await hashPhrase(" APPLE  bread\nhoney lemon olive peach ");
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    const c = await hashPhrase("apple bread honey lemon olive plum");
    expect(c).not.toBe(a);
  });
});
