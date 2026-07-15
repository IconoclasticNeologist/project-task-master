// Language-aware facade over the copy bundles (spec: 2026-07-14-spanish-language-design.md).
//
// Every surface keeps importing `copy` from "@/lib/copy" exactly as before.
// This proxy resolves each top-level section against the CURRENT language
// bundle at property-access time, so a re-render after a language switch
// yields translated strings with no per-component refactor.
//
// Mechanics contract (all three legs required):
//   1. `__setCurrentLang` is called ONLY on the client (LangProvider / setLang).
//      The server never mutates it, so SSR always renders English — by design
//      ("instant client swap"): first paint matches the server, then the
//      provider swaps after mount. No hydration mismatch.
//   2. LangProvider remounts the tree (key={lang}) on switch, because
//      components that read `copy` are not context subscribers.
//   3. NEVER read `copy.*` at module level — that freezes English at import
//      time (see Shell's navItems, deliberately built inside the component).
import { copy as copyEn } from "./en";
import { copyEs } from "./es";
import type { Lang } from "@/lib/lang";

export { PLACEHOLDER } from "./en";

// en.ts is `as const`, so its typeof carries literal string types a
// translation could never satisfy. Widen leaves the SHAPE mandatory (every
// key, arrays, functions) while relaxing literals to string/number.
type Widen<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends (...args: infer A) => infer R
        ? (...args: A) => Widen<R>
        : T extends readonly (infer E)[]
          ? readonly Widen<E>[]
          : T extends object
            ? { readonly [K in keyof T]: Widen<T[K]> }
            : T;
export type CopyShape = Widen<typeof copyEn>;

const bundles: Record<Lang, CopyShape> = { en: copyEn, es: copyEs };

let currentLang: Lang = "en";

/** Internal — LangProvider only. */
export function __setCurrentLang(lang: Lang): void {
  currentLang = lang;
}

/** Internal — LangProvider only. */
export function __getCurrentLang(): Lang {
  return currentLang;
}

export const copy: CopyShape = new Proxy(copyEn, {
  get: (_target, prop) => bundles[currentLang][prop as keyof CopyShape],
}) as CopyShape;
