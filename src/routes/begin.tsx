import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Shell } from "@/components/Shell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { copy } from "@/lib/copy";
import { createSelfServeSurvivor, updateProfile } from "@/lib/auth/session";
import { setLangPref } from "@/lib/lang";
import { pageTitle } from "@/lib/product";

// Self-serve entry for a person with no code and no advocate. A calm safety
// check (the in-app substitute for an advocate's tech-safety planning) precedes
// creating any identity; then the same minimal profile step as the coded flow.
export const Route = createFileRoute("/begin")({
  head: () => ({ meta: [{ title: pageTitle("Begin") }] }),
  component: BeginScreen,
});

const primaryButtonClass =
  "block w-full rounded-md bg-primary px-4 py-3 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40";

// Three soft pulsing dots — motion-safe CSS animation (the global Stillness /
// reduced-motion kill-switch in styles.css zeroes `animation-duration` on `*`,
// so this is honored automatically). No spinner icon on purpose.
function CreatingDots() {
  return (
    <span className="inline-flex items-center gap-0.5 align-middle" aria-hidden="true">
      <span className="h-1 w-1 animate-pulse rounded-full bg-current" />
      <span className="h-1 w-1 animate-pulse rounded-full bg-current [animation-delay:200ms]" />
      <span className="h-1 w-1 animate-pulse rounded-full bg-current [animation-delay:400ms]" />
    </span>
  );
}

function BeginScreen() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"safety" | "profile">("safety");
  const [survivorId, setSurvivorId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [language, setLanguage] = useState<"en" | "es">("en");
  const [name, setName] = useState("");
  // Second-stage reassurance: creation was measured at 5.4s with only a disabled-
  // label swap as feedback (audit P0-3). A timer keyed on `busy` — not a fixed
  // delay on click — so it only ever shows once the wait has actually run long.
  const [showStillWorking, setShowStillWorking] = useState(false);
  useEffect(() => {
    if (!busy) {
      setShowStillWorking(false);
      return;
    }
    const timer = setTimeout(() => setShowStillWorking(true), 2500);
    return () => clearTimeout(timer);
  }, [busy]);

  const beginOnOwn = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await createSelfServeSurvivor();
      if (!result.ok) {
        toast(copy.begin.failed);
        return;
      }
      setSurvivorId(result.survivorId);
      setPhase("profile");
    } catch {
      // A throw here (misconfig, unexpected client error) must never leave the
      // button silently dead — surface the same calm failure message.
      toast(copy.begin.failed);
    } finally {
      setBusy(false);
    }
  };

  const submitProfile = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (survivorId) {
        setLangPref(language);
        try {
          await updateProfile(survivorId, {
            preferred_language: language,
            first_name: name.trim() || null,
          });
        } catch {
          // Non-critical nicety (editable later in Settings); never block entry.
          toast(copy.enter.profileSaveFailed);
        }
      }
    } finally {
      setBusy(false);
    }
    void navigate({ to: "/onboarding" });
  };

  return (
    <Shell hideNav>
      <div className="flex flex-1 flex-col justify-between gap-8 py-6">
        {phase === "safety" ? (
          <>
            <div className="space-y-6 pt-10">
              <h1 className="text-2xl font-normal leading-snug tracking-tight">
                {copy.begin.safetyTitle}
              </h1>
              <p className="text-base leading-relaxed text-foreground">{copy.begin.safetyBody}</p>
              <Card>
                <CardContent className="py-5">
                  <ul className="space-y-3">
                    {copy.begin.safetyPoints.map((point, i) => (
                      <li
                        key={i}
                        className="flex gap-2 text-sm leading-relaxed text-muted-foreground"
                      >
                        <span aria-hidden className="select-none text-foreground/40">
                          •
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Link
                to="/resources"
                className="block text-center text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                {copy.begin.supportLink}
              </Link>
            </div>
            <div className="space-y-3">
              <button
                type="button"
                onClick={beginOnOwn}
                disabled={busy}
                aria-busy={busy}
                className={primaryButtonClass}
              >
                {busy ? (
                  <span className="inline-flex items-center gap-2">
                    {copy.begin.creating}
                    <CreatingDots />
                  </span>
                ) : (
                  copy.begin.safetyCta
                )}
              </button>
              {busy && showStillWorking && (
                <p aria-live="polite" className="text-sm text-muted-foreground">
                  {copy.begin.stillWorking}
                </p>
              )}
              <Link
                to="/"
                className="block w-full px-4 py-2 text-center text-sm text-muted-foreground hover:text-foreground"
              >
                {copy.begin.notNow}
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-6 pt-10">
              <h1 className="text-2xl font-normal leading-snug tracking-tight">
                {copy.enter.profileTitle}
              </h1>
              <p className="text-base leading-relaxed text-foreground">{copy.enter.profileBody}</p>
              <Card>
                <CardContent className="space-y-5 py-5">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                      {copy.enter.languageLabel}
                    </Label>
                    <div className="flex gap-3">
                      {(["en", "es"] as const).map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => setLanguage(lang)}
                          className={
                            language === lang
                              ? "rounded-md border border-primary bg-primary/10 px-4 py-2 text-sm"
                              : "rounded-md border border-border px-4 py-2 text-sm text-muted-foreground"
                          }
                        >
                          {lang === "en" ? copy.enter.languageEn : copy.enter.languageEs}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="name"
                      className="text-xs uppercase tracking-wide text-muted-foreground"
                    >
                      {copy.enter.nameLabel}
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      autoComplete="off"
                      onChange={(e) => setName(e.target.value)}
                      placeholder={copy.enter.namePlaceholder}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            <button
              type="button"
              onClick={submitProfile}
              disabled={busy}
              aria-busy={busy}
              className={primaryButtonClass}
            >
              {busy ? "…" : copy.enter.profileCta}
            </button>
          </>
        )}
      </div>
    </Shell>
  );
}
