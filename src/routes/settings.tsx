import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { requireSurvivor } from "@/lib/auth/guard";
import { Shell } from "@/components/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { copy } from "@/lib/copy";
import { useSurvivorSettings } from "@/lib/data/useSurvivorSettings";
import type { SurvivorSettings } from "@/lib/data/settings";
import { pageTitle } from "@/lib/product";

export const Route = createFileRoute("/settings")({
  beforeLoad: requireSurvivor,
  head: () => ({ meta: [{ title: pageTitle("Settings") }] }),
  component: SettingsScreen,
});

function SettingsScreen() {
  const { query, save } = useSurvivorSettings();
  const [form, setForm] = useState<SurvivorSettings>({
    language: "en",
    defaultVisibility: "private",
    calmingAnchor: "",
    supportPerson: "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (query.data) setForm(query.data);
  }, [query.data]);

  const onSave = () => {
    setSaved(false);
    save.mutate(form, { onSuccess: () => setSaved(true) });
  };

  return (
    <Shell>
      <div className="space-y-6">
        <h1 className="text-2xl font-normal tracking-tight">{copy.settings.title}</h1>

        {query.isLoading ? (
          <p className="text-sm text-muted-foreground">…</p>
        ) : query.isError ? (
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-foreground">{copy.account.loadError}</p>
            <button
              type="button"
              onClick={() => void query.refetch()}
              className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              {copy.account.retry}
            </button>
          </div>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-normal">
                  {copy.settings.aftercareSection}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="s1">{copy.onboarding.aftercare.supportLabel}</Label>
                  <Input
                    id="s1"
                    value={form.supportPerson}
                    onChange={(e) => setForm((f) => ({ ...f, supportPerson: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="s2">{copy.onboarding.aftercare.calmLabel}</Label>
                  <Input
                    id="s2"
                    value={form.calmingAnchor}
                    onChange={(e) => setForm((f) => ({ ...f, calmingAnchor: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-normal">
                  {copy.settings.languageSection}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {copy.settings.languageNote}
                </p>
                <div className="flex gap-3">
                  {(["en", "es"] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, language: lang }))}
                      className={
                        form.language === lang
                          ? "rounded-md border border-primary bg-primary/10 px-4 py-2 text-sm"
                          : "rounded-md border border-border px-4 py-2 text-sm text-muted-foreground"
                      }
                    >
                      {lang === "en" ? copy.settings.languageEn : copy.settings.languageEs}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-normal">
                  {copy.settings.sharingSection}
                </CardTitle>
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
                      checked={form.defaultVisibility === val}
                      onChange={() => setForm((f) => ({ ...f, defaultVisibility: val }))}
                    />
                    {label}
                  </label>
                ))}
              </CardContent>
            </Card>

            <button
              type="button"
              onClick={onSave}
              disabled={save.isPending}
              className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
            >
              {copy.settings.save}
            </button>
            {saved && <p className="text-center text-xs text-muted-foreground">Saved.</p>}
          </>
        )}
      </div>
    </Shell>
  );
}
