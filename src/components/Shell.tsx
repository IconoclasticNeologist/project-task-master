import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { copy } from "@/lib/copy";

/**
 * Calm, mobile-first layout shell.
 * - Centered narrow column, generous whitespace.
 * - Top: persistent "Leave now" + "I need a break" affordances on every screen.
 * - Bottom: text nav.
 * - No motion, paper-craft baseline.
 */

const navItems = [
  { to: "/home", label: copy.nav.home },
  { to: "/session", label: copy.nav.session },
  { to: "/resources", label: copy.nav.resources },
  { to: "/account", label: copy.nav.account },
  { to: "/team", label: copy.nav.team },
  { to: "/plan", label: copy.nav.plan },
  { to: "/settings", label: copy.nav.settings },
] as const;

export function Shell({ children, hideNav = false }: { children: ReactNode; hideNav?: boolean }) {
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
            {copy.shell.leaveNow}
          </button>
          <Link to="/home" className="text-sm text-muted-foreground hover:text-foreground">
            {copy.shell.iNeedABreak}
          </Link>
        </header>

        <main className="flex flex-1 flex-col py-8">{children}</main>

        {!hideNav && (
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
        )}
      </div>
    </div>
  );
}
