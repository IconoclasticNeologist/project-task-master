import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { registerSW } from "../pwa/registerSW";
import { InstallPrompt } from "../components/InstallPrompt";
import { LockGate } from "@/components/LockGate";
import { Toaster } from "@/components/ui/sonner";
import { PRODUCT_NAME } from "@/lib/product";
import { MOTION_HEAD_SCRIPT } from "@/lib/motion";
import { LANG_HEAD_SCRIPT } from "@/lib/lang";
import { copy } from "@/lib/copy";
import { leaveQuickly } from "@/lib/leaveNow";

// A mistyped or stale URL is the one page load that can land ANYONE — including
// a survivor mid-session — outside the normal Shell. It still needs the same
// safety affordances as every other screen, so this header row mirrors Shell's
// header markup (same classes, same enlarged tap targets) without importing
// Shell itself, since Shell also brings bottom nav assumptions that don't apply
// here.
function NotFoundComponent() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6">
        <header className="flex h-16 shrink-0 items-center justify-end gap-4 border-b border-border">
          <button
            type="button"
            onClick={() => leaveQuickly()}
            className="-mx-1.5 -my-3 px-1.5 py-3 text-sm text-muted-foreground hover:text-foreground"
          >
            {copy.shell.leaveNow}
          </button>
          <Link
            to="/break"
            className="-mx-1.5 -my-3 px-1.5 py-3 text-sm text-muted-foreground hover:text-foreground"
          >
            {copy.shell.iNeedABreak}
          </Link>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center text-center">
          <h1 className="text-2xl font-normal tracking-tight">{copy.notFound.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{copy.notFound.body}</p>
          <div className="mt-6">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {copy.notFound.home}
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: PRODUCT_NAME },
      { name: "description", content: "A calm, private space — at your own pace." },
      { property: "og:title", content: PRODUCT_NAME },
      { property: "og:description", content: "A calm, private space — at your own pace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      // PWA / installability
      { name: "theme-color", content: "#FAF7EF" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: PRODUCT_NAME },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icons/apple-touch-icon-180.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        {/* Apply the Stillness preference before first paint (no flash). */}
        <script dangerouslySetInnerHTML={{ __html: MOTION_HEAD_SCRIPT }} />
        {/* Set <html lang> from the saved language before first paint (screen readers). */}
        <script dangerouslySetInnerHTML={{ __html: LANG_HEAD_SCRIPT }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    registerSW();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <InstallPrompt />
      <LockGate />
      <Toaster />
    </QueryClientProvider>
  );
}
