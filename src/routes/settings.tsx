import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { requireSurvivor } from "@/lib/auth/guard";
import { Shell } from "@/components/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { copy } from "@/lib/copy";
import {
  loadAftercare,
  saveAftercare,
  loadSettings,
  saveSettings,
  type UserSettings,
} from "@/lib/data/local-store";

export const Route = createFileRoute("/settings")({
  beforeLoad: requireSurvivor,
  head: () => ({ meta: [{ title: "Settings — The Advocate" }] }),
  component: SettingsScreen,
});

function SettingsScreen() {
  const [support, setSupport] = useState("");
  const [calm, setCalm] = useState("");
  const [settings, setSettings] = useState<UserSettings>({ language: "en", defaultVisibility: "private" });
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    const a = loadAftercare();
    if (a) {
      setSupport(a.supportPerson);
      setCalm(a.calmingThing);
    }
    setSettings(loadSettings());
  }, []);

  const onSave = () => {
    saveAftercare({ supportPerson: support, calmingThing: calm });
    saveSettings(settings);
    setSavedAt(Date.now());
  };

  return (
    <Shell>
      <div className="space-y-6">
        <h1 className="text-2xl font-normal tracking-tight">{copy.settings.title}</h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-normal">{copy.settings.aftercareSection}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="s1">{copy.onboarding.aftercare.supportLabel}</Label>
              <Input id="s1" value={support} onChange={(e) => setSupport(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s2">{copy.onboarding.aftercare.calmLabel}</Label>
              <Input id="s2" value={calm} onChange={(e) => setCalm(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-normal">{copy.settings.languageSection}</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-3">
            {(["en", "es"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setSettings((s) => ({ ...s, language: lang }))}
                className={
                  settings.language === lang
                    ? "rounded-md border border-primary bg-primary/10 px-4 py-2 text-sm"
                    : "rounded-md border border-border px-4 py-2 text-sm text-muted-foreground"
                }
              >
                {lang === "en" ? copy.settings.languageEn : copy.settings.languageEs}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-normal">{copy.settings.sharingSection}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {(
              [
                ["private", copy.settings.defaultPrivate],
                ["shareable", copy.settings.defaultShare],
              ] as const
            ).map(([val, label]) => (
              <label key={val} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="dv"
                  checked={settings.defaultVisibility === val}
                  onChange={() => setSettings((s) => ({ ...s, defaultVisibility: val }))}
                />
                {label}
              </label>
            ))}
          </CardContent>
        </Card>

        <button
          type="button"
          onClick={onSave}
          className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {copy.settings.save}
        </button>
        {savedAt && <p className="text-center text-xs text-muted-foreground">Saved.</p>}
      </div>
    </Shell>
  );
}
