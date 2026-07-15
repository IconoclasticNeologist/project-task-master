// Client mirror of the canonical app map (supabase/functions/_shared/appMap.ts).
// Used for starter chips and defense-in-depth validation of navigation targets.
// appMap.test.ts asserts this route list matches the server's exactly.

export const HELPER_ROUTES = [
  "/",
  "/begin",
  "/enter",
  "/home",
  "/session",
  "/guide",
  "/study",
  "/notebooks",
  "/resources",
  "/account",
  "/team",
  "/plan",
  "/settings",
  "/recover",
  "/break",
  "/privacy",
  "/tour",
  "/judges",
  "/sources",
] as const;

export type HelperRoute = (typeof HELPER_ROUTES)[number];

export function isAllowedRoute(route: unknown): route is HelperRoute {
  return typeof route === "string" && (HELPER_ROUTES as readonly string[]).includes(route);
}

/** Where the helper widget itself appears. Flow/safety surfaces stay quiet. */
export const WIDGET_ROUTES: readonly string[] = [
  "/",
  "/home",
  "/plan",
  "/account",
  "/team",
  "/settings",
  "/guide",
  "/study",
  "/resources",
  "/notebooks",
  "/privacy",
  "/judges",
  "/sources",
];

export function widgetAllowedOn(pathname: string): boolean {
  if (WIDGET_ROUTES.includes(pathname)) return true;
  // Notebook and study-guide pages share their shelves' chrome.
  return pathname.startsWith("/notebooks/") || pathname.startsWith("/study/");
}

/** Page-aware starter chips — instant, free, no model call. */
const CHIPS: Record<string, string[]> = {
  "/": ["What is this app?", "Is anything about me saved?", "How do I leave this page fast?"],
  "/home": [
    "Where do I practice for court?",
    "What does 'Your space' hold?",
    "How do I get support from a real person?",
  ],
  "/plan": [
    "What kind of steps go here?",
    "Does anything here have a deadline?",
    "Who can see my plan?",
  ],
  "/account": [
    "What does 'okay to share' mean?",
    "What is the draft for my lawyer?",
    "How do I add something I want to say?",
  ],
  "/team": [
    "How does someone get access?",
    "How do I end someone's access?",
    "What can a professional see?",
  ],
  "/settings": [
    "What does the PIN lock do?",
    "How do I change the language?",
    "How do I download or delete my data?",
  ],
  "/guide": [
    "What happens on a court day?",
    "Where can I practice being asked questions?",
    "Is this legal advice?",
  ],
  "/study": [
    "Can I listen instead of read?",
    "Which guide explains cross-examination?",
    "Is any of this scored?",
  ],
  "/resources": [
    "Can I call without giving my name?",
    "Which number is for right now?",
    "What if I'm not in the United States?",
  ],
  "/notebooks": [
    "Which guide helps with hard questions?",
    "What if my case ends in a deal?",
    "Do I have my own lawyer?",
  ],
  "/privacy": ["What is saved, exactly?", "Who can see what I write?", "What does 'Leave now' do?"],
  "/judges": [
    "How do I try the app with sample data?",
    "Where is the interactive tour?",
    "How is testimony never coached?",
  ],
  "/sources": [
    "Where do the legal claims come from?",
    "Who reviewed this work?",
    "How do I take the tour?",
  ],
};

const DEFAULT_CHIPS = [
  "What can I do here?",
  "How do I stay safe using this?",
  "Where do I find support?",
];

export function pageChips(pathname: string): string[] {
  if (CHIPS[pathname]) return CHIPS[pathname];
  if (pathname.startsWith("/notebooks/")) return CHIPS["/notebooks"];
  if (pathname.startsWith("/study/")) return CHIPS["/study"];
  return DEFAULT_CHIPS;
}
