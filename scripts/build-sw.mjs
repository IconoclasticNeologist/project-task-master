// Post-build service worker generation.
// Why post-build: tanstackStart() preempts vite-plugin-pwa / Serwist in-build SW generation
// (TanStack/router #4988), so we generate the SW AFTER `vite build` against the Nitro 3
// client output. This is the single, auditable caching-policy file.
import { generateSW } from "workbox-build";
import { existsSync } from "node:fs";

// The client output dir depends on the build context:
//   Lovable sandbox / Cloudflare deploy → dist/client
//   local `nitro: true` build           → .output/public
// Detect by the copied manifest so the SW lands beside the served assets.
const CANDIDATES = ["dist/client", ".output/public", "dist/public", "dist"];
const OUT = CANDIDATES.find((d) => existsSync(`${d}/manifest.webmanifest`));

if (!OUT) {
  // Local non-sandbox builds intentionally skip Nitro (Lovable design), so there's no client
  // output to attach a SW to. The SW is generated in the Cloudflare/sandbox build where Nitro
  // runs. Skip gracefully so a plain local `bun run build` doesn't fail here.
  console.warn(
    "[build-sw] No client output found (Nitro didn't run — expected for a local non-sandbox " +
      "build). Skipping service-worker generation; it runs in the Cloudflare/sandbox build.",
  );
  process.exit(0);
}

// Offline shell is the hand-authored static public/offline.html (copied into the client
// output by Vite). Offline open is a required safety property, so fail loudly if missing.
const navigateFallback = "/offline.html";
if (!existsSync(`${OUT}/offline.html`)) {
  console.error(`[build-sw] ${OUT}/offline.html not found — is public/offline.html present?`);
  process.exit(1);
}

const { count, size, warnings } = await generateSW({
  globDirectory: OUT,
  globPatterns: ["**/*.{js,css,html,svg,png,ico,webmanifest,woff2}"],
  swDest: `${OUT}/sw.js`,
  navigateFallback,
  navigateFallbackDenylist: [/^\/api\//],
  cleanupOutdatedCaches: true,
  clientsClaim: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      // NEVER cache Supabase or any data API — survivor data must not persist on device.
      urlPattern: ({ url }) => /\.supabase\.(co|in)$/.test(url.hostname),
      handler: "NetworkOnly",
    },
    {
      // Static images/fonts may be cached.
      urlPattern: ({ request }) =>
        request.destination === "image" || request.destination === "font",
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-assets",
        expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
  ],
});

for (const w of warnings) console.warn("[build-sw]", w);
console.log(
  `[build-sw] precached ${count} files (${(size / 1024).toFixed(0)} KiB) → ${OUT}/sw.js; ` +
    `navigateFallback=${navigateFallback}`,
);
