import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";

/**
 * Calm, mobile-first layout shell.
 * - Centered narrow column, generous whitespace.
 * - Top: persistent "I need a break" affordance, always reachable.
 * - Bottom: primary text nav across the five main routes.
 * - No motion, no decoration, no icons.
 */

const navItems = [
  { to: "/home", label: "Home" },
  { to: "/session", label: "Session" },
  { to: "/resources", label: "Resources" },
  { to: "/account", label: "Account" },
  { to: "/settings", label: "Settings" },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border">
          <button
            type="button"
            onClick={() => {
              window.location.replace("https://www.weather.gov/");
            }}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Leave now
          </button>
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            I need a break
          </Link>
        </header>

        <main className="flex flex-1 flex-col py-8">{children}</main>

        <footer className="flex h-16 shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-border">
          {navItems.map((item) => {
            const isActive = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={
                  isActive
                    ? "text-sm text-foreground"
                    : "text-sm text-muted-foreground hover:text-foreground"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </footer>
      </div>
    </div>
  );
}
