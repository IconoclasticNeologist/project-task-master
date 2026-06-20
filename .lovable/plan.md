# Quick-Exit ("Leave now") — Plan

A single new control in the shell header. Nothing else changes.

## Placement

In `src/components/Shell.tsx`, the `<header>` row becomes two items on one line:

- **Left:** new "Leave now" control (this pass).
- **Right:** existing "I need a break" link (untouched — same text, same muted styling, same `to="/"`).

Both are plain muted-foreground text, same font size, no icon, no alarm color, no motion. The header keeps its h-16 height and bottom hairline. No other file is touched.

## The control

A `<button type="button">` (not an `<a>`), styled identically to the break link so it reads as a quiet text item. Label: **"Leave now"**.

On click, one synchronous call:

```ts
window.location.replace("https://www.weather.gov/")
```

- One tap, no confirmation, no delay.
- `replace` (not `assign`, not `href=`) so the current entry is overwritten — Back does not return to the app screen.
- Destination is a real external page (US National Weather Service), not a fake in-app decoy. Hard-coded for this pass; configurable destination is out of scope.

No new dependencies, no new routes, no history shim, no `beforeunload`, no analytics hook.

## Standalone-PWA flag (surfacing, not solving)

This app currently has no manifest and no service worker, so today it always runs as a normal browser tab and `location.replace` cleanly leaves the app. If the app is later installed as a standalone PWA, behavior diverges from the browser-tab case and I cannot fully solve it from inside the web app:

- **Android (Chrome installed PWA):** `location.replace` to a cross-origin URL typically opens the weather page in a Custom Tab / external browser overlay. The PWA window stays alive in the background and remains reachable via the OS app switcher. Visually off-screen, not process-killed.
- **iOS (Safari installed PWA, standalone):** cross-origin navigation from a standalone PWA is restricted and inconsistent across iOS versions — it may open Safari as a separate app while leaving the PWA running in the background, or stay inside the standalone shell. No reliable way to force-close the PWA from script.
- **Net:** in installed-PWA mode the control will get the watcher's eyes off the app, but it cannot guarantee the app process is gone or unreachable via the app switcher. The browser-tab case is clean. Verify on a real device when/if PWA install is added.

## Out of scope (confirming)

Configurable destination, PIN-lock on exit, restyling the break affordance, any change to existing screens / routes / styles, dialogs, motion, icons, manifest/SW work.

## Files

- Modify: `src/components/Shell.tsx` only.
