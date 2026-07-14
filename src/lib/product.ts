// The product name. In-app surfaces say "Tend"; judge-facing surfaces
// (/judges) present it as "Project Tend". Every user-facing occurrence
// references this constant so a rename is a one-line edit here.
//
// Non-code touchpoints a rename must also update (not importable):
//   public/manifest.webmanifest  (name / short_name)
//   public/offline.html          (title + heading)

export const PRODUCT_NAME = "Tend";

/** Document title for a page: `pageTitle("Session")` → "Session — Tend". */
export function pageTitle(prefix?: string): string {
  return prefix ? `${prefix} — ${PRODUCT_NAME}` : PRODUCT_NAME;
}
