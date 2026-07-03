// The product's working name. It WILL change — every user-facing occurrence
// references this constant so the rename is a one-line edit here.
//
// Non-code touchpoints a rename must also update (not importable):
//   public/manifest.webmanifest  (name / short_name)
//   public/offline.html          (title + heading)

export const PRODUCT_NAME = "The Advocate";

/** Document title for a page: `pageTitle("Session")` → "Session — The Advocate". */
export function pageTitle(prefix?: string): string {
  return prefix ? `${prefix} — ${PRODUCT_NAME}` : PRODUCT_NAME;
}
