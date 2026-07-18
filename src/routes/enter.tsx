import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Shell } from "@/components/Shell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { copy } from "@/lib/copy";
import { redeemCode, updateProfile } from "@/lib/auth/session";
import { useLang } from "@/lib/lang-context";
import { pageTitle } from "@/lib/product";

export const Route = createFileRoute("/enter")({
  head: () => ({ meta: [{ title: pageTitle("Enter") }] }),
  component: EnterScreen,
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

function EnterScreen() {
  const navigate = useNavigate();
  const { setLang } = useLang();
  const [phase, setPhase] = useState<"code" | "profile">("code");
  const [code, setCode] = useState("");
  const [survivorId, setSurvivorId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<"invalid" | "network" | null>(null);
  const [language, setLanguage] = useState<"en" | "es">("en");
  const [name, setName] = useState("");
  // Second-stage reassurance: mirrors begin.tsx's create flow (audit P0-3) for the
  // coded-entry redeem, which performs the equivalent "setting up your space" work.
  const [showStillWorking, setShowStillWorking] = useState(false);
  useEffect(() => {
    if (!busy) {
      setShowStillWorking(false);
      return;
    }
    const timer = setTimeout(() => setShowStillWorking(true), 2500);
    return () => clearTimeout(timer);
  }, [busy]);

  const submitCode = async () => {
    if (busy) return;
    setBusy(true);
    setFailure(null);
    try {
      const result = await redeemCode(code.trim());
      if (!result.ok) {
        setFailure(result.reason);
        return;
      }
      setSurvivorId(result.survivorId);
      setPhase("profile");
    } finally {
      setBusy(false);
    }
  };

  const submitProfile = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (survivorId) {
        try {
          await updateProfile(survivorId, {
            preferred_language: language,
            first_name: name.trim() || null,
          });
        } catch {
          // Profile is a non-critical nicety (editable later in Settings). A save failure
          // must not crash the calm flow or block entry — continue regardless.
          toast(copy.enter.profileSaveFailed);
        }
      }
    } finally {
      setBusy(false);
    }
    // Context setLang, not the bare localStorage mirror — the next screen must
    // already speak the language they just chose. Called right before navigate
    // so the remount (key={lang}) and the route change land in one render.
    setLang(language);
    void navigate({ to: "/onboarding" });
  };

  return (
    <Shell hideNav>
      <div className="flex flex-1 flex-col justify-between gap-8 py-6">
        {phase === "code" ? (
          <>
            <div className="space-y-6 pt-10">
              <h1 className="text-2xl font-normal leading-snug tracking-tight">
                {copy.enter.codeTitle}
              </h1>
              <p className="text-base leading-relaxed text-foreground">{copy.enter.codeBody}</p>
              <Card>
                <CardContent className="space-y-2 py-5">
                  <Label
                    htmlFor="code"
                    className="text-xs uppercase tracking-wide text-muted-foreground"
                  >
                    {copy.enter.codeLabel}
                  </Label>
                  <Input
                    id="code"
                    value={code}
                    autoComplete="off"
                    autoCapitalize="characters"
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={copy.enter.codePlaceholder}
                  />
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {copy.enter.codeHint}
                  </p>
                  {failure && (
                    <p className="pt-1 text-sm leading-relaxed text-foreground">
                      {failure === "network" ? copy.enter.codeNetworkError : copy.enter.codeError}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
            <div className="space-y-3">
              <button
                type="button"
                onClick={submitCode}
                disabled={busy || code.trim().length === 0}
                aria-busy={busy}
                className={primaryButtonClass}
              >
                {busy ? (
                  <span className="inline-flex items-center gap-2">
                    {copy.begin.creating}
                    <CreatingDots />
                  </span>
                ) : (
                  copy.enter.codeCta
                )}
              </button>
              {busy && showStillWorking && (
                <p aria-live="polite" className="text-sm text-muted-foreground">
                  {copy.begin.stillWorking}
                </p>
              )}
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
                  <div className="space-y-2" role="group" aria-labelledby="language-label">
                    <Label
                      id="language-label"
                      className="text-xs uppercase tracking-wide text-muted-foreground"
                    >
                      {copy.enter.languageLabel}
                    </Label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        aria-pressed={language === "en"}
                        onClick={() => setLanguage("en")}
                        className={`flex-1 rounded-md border px-3 py-2 text-sm ${
                          language === "en"
                            ? "border-primary text-foreground"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        {copy.enter.languageEn}
                      </button>
                      <button
                        type="button"
                        aria-pressed={language === "es"}
                        onClick={() => setLanguage("es")}
                        className={`flex-1 rounded-md border px-3 py-2 text-sm ${
                          language === "es"
                            ? "border-primary text-foreground"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        {copy.enter.languageEs}
                      </button>
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
