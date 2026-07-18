import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Check, Globe, Settings as SettingsIcon } from "lucide-react";
import { copy } from "@/lib/copy";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HomeButton } from "@/components/HomeButton";
import { useLang } from "@/lib/lang-context";
import { leaveQuickly } from "@/lib/leaveNow";

/**
 * Calm, mobile-first layout shell.
 * - Centered narrow column, generous whitespace.
 * - Top: persistent "Leave now" + "I need a break" affordances on every screen,
 *   plus the language menu.
 * - Bottom: text nav.
 * - No motion, paper-craft baseline.
 */

// Shown in their own language/script on purpose — a speaker finds theirs
// instantly. Deliberately identical in every UI language, so these live here
// rather than in the copy layer.
const COMING_SOON_LANGUAGES = ["中文", "Tagalog", "한국어", "Tiếng Việt", "Русский"] as const;

function LanguageMenu() {
  const { lang, setLang } = useLang();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/* Icon + current language code: a bare globe read as decoration, and
            the owner couldn't find the switch. "EN"/"ES" names the state and
            promises the action in one glance. */}
        <button
          type="button"
          aria-label="Language · Idioma"
          className="-mx-1.5 -my-3 flex items-center gap-1 px-1.5 py-3 text-sm text-muted-foreground hover:text-foreground"
        >
          <Globe className="h-4 w-4" strokeWidth={2} aria-hidden />
          <span className="text-xs uppercase tracking-wide">{lang}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuItem onSelect={() => setLang("en")}>
          <span className="flex-1">English</span>
          {lang === "en" && <Check className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setLang("es")}>
          <span className="flex-1">Español</span>
          {lang === "es" && <Check className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Coming soon · Próximamente
        </DropdownMenuLabel>
        {COMING_SOON_LANGUAGES.map((name) => (
          <DropdownMenuItem key={name} disabled>
            {name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Shell({
  children,
  hideNav = false,
  judgesLink = false,
}: {
  children: ReactNode;
  hideNav?: boolean;
  /** Landing only: a quiet reviewer door in the top bar. */
  judgesLink?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Built per render (NOT module level) so the labels re-resolve against the
  // language-aware copy proxy after a language switch.
  // Settings moved to the top bar (gear) — owner call; the bottom row stays
  // for the places a person goes on purpose, not configuration.
  const navItems = [
    { to: "/home", label: copy.nav.home },
    { to: "/session", label: copy.nav.session },
    { to: "/resources", label: copy.nav.resources },
    { to: "/account", label: copy.nav.account },
    { to: "/team", label: copy.nav.team },
    { to: "/plan", label: copy.nav.plan },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border">
          <HomeButton to="/home" />
          <div className="flex items-center gap-4">
            {judgesLink && (
              <Link
                to="/judges"
                className="-mx-1.5 -my-3 px-1.5 py-3 text-sm text-muted-foreground hover:text-foreground"
              >
                For the judges
              </Link>
            )}
            <LanguageMenu />
            <Link
              to="/settings"
              aria-label={copy.nav.settings}
              className="-mx-1.5 -my-3 px-1.5 py-3 text-muted-foreground hover:text-foreground"
            >
              <SettingsIcon className="h-4 w-4" strokeWidth={2} aria-hidden />
            </Link>
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
          </div>
        </header>

        <main className="flex flex-1 flex-col py-8">{children}</main>

        {!hideNav && (
          <footer
            // gap-y must be ≥ the links' enlarged hit boxes (py-3 each side = 24px)
            // or wrapped rows' tap targets overlap and taps land on the wrong item.
            className="flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-6 border-t border-border py-2"
          >
            {navItems.map((item) => {
              const isActive = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={
                    isActive
                      ? "-mx-1.5 -my-3 px-1.5 py-3 text-sm text-foreground"
                      : "-mx-1.5 -my-3 px-1.5 py-3 text-sm text-muted-foreground hover:text-foreground"
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
