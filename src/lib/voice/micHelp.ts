// Browser-specific guidance for re-enabling a blocked microphone.
//
// A web app CANNOT flip the browser's mic permission for the user — that's a hard
// security rule. What we can do is point them at the exact control in THEIR browser.

export type BrowserKind = "chrome" | "edge" | "firefox" | "safari" | "other";

export function detectBrowser(): BrowserKind {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return "edge";
  if (/Firefox\/|FxiOS\//.test(ua)) return "firefox";
  if (/Chrome\/|CriOS\//.test(ua)) return "chrome";
  if (/Safari\//.test(ua)) return "safari";
  return "other";
}

export interface UnblockGuide {
  /** The glyph that approximates the control in this browser's address bar. */
  icon: string;
  steps: string[];
}

export function unblockGuide(kind: BrowserKind): UnblockGuide {
  switch (kind) {
    case "chrome":
    case "edge":
      return {
        icon: "🔒",
        steps: [
          "Tap the icon at the left of the address bar.",
          "Find “Microphone.”",
          "Switch it to “Allow.”",
          "Reload this page.",
        ],
      };
    case "firefox":
      return {
        icon: "🎙",
        steps: [
          "Tap the microphone icon in the address bar.",
          "Choose “Allow.”",
          "Reload this page.",
        ],
      };
    case "safari":
      return {
        icon: "AA",
        steps: [
          "Tap “AA” (or the settings icon) at the edge of the address bar.",
          "Open “Website Settings.”",
          "Set Microphone to “Allow.”",
          "Reload this page.",
        ],
      };
    default:
      return {
        icon: "🔒",
        steps: [
          "Open your browser’s site settings for this page.",
          "Set Microphone to “Allow.”",
          "Reload this page.",
        ],
      };
  }
}
