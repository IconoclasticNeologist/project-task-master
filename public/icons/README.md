# PWA icons — PLACEHOLDERS

These are auto-generated placeholder icons (cream background + sage mark), produced by
`scripts/gen-icons.mjs` (`bun run icons`). They exist so the manifest and install flow
work end-to-end. **Replace them with real brand icons before launch:**

- `icon-192.png`, `icon-512.png` — standard icons
- `maskable-192.png`, `maskable-512.png` — full-bleed; keep important content within the
  center ~80% safe zone
- `apple-touch-icon-180.png` — iOS home screen
- `icon.svg` — crisp vector fallback

Keep the same filenames (referenced by `public/manifest.webmanifest` and
`src/routes/__root.tsx`) or update those references too.
