import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { requireSurvivor } from "@/lib/auth/guard";
import { useRequireSurvivor } from "@/lib/auth/useRequireSurvivor";
import { useSurvivor } from "@/lib/auth/useSurvivor";
import { updateProfile } from "@/lib/auth/session";
import { Shell } from "@/components/Shell";
import { NoSpacePanel } from "@/components/NoSpacePanel";
import { RecoveryWordsCard } from "@/components/RecoveryWordsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmButton } from "@/components/ConfirmButton";
import { copy } from "@/lib/copy";
import { useSurvivorSettings } from "@/lib/data/useSurvivorSettings";
import type { SurvivorSettings } from "@/lib/data/settings";
import { downloadMySpace, deleteMySpace } from "@/lib/data/accountLifecycle";
import { getMotionPref, setMotionPref } from "@/lib/motion";
import { setLangPref } from "@/lib/lang";
import { isLockEnabled, setPin, disableLock, lock } from "@/lib/appLock";
import { pageTitle } from "@/lib/product";

export const Route = createFileRoute("/settings")({
  beforeLoad: requireSurvivor,
  head: () => ({ meta: [{ title: pageTitle("Settings") }] }),
  component: SettingsScreen,
});

function SettingsScreen() {
  const { status } = useRequireSurvivor();
  const { query, save } = useSurvivorSettings();
  const survivor = useSurvivor();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<SurvivorSettings>({
    language: "en",
    defaultVisibility: "private",
    calmingAnchor: "",
    supportPerson: "",
  });
  const [saved, setSaved] = useState(false);
  // Motion is a per-device preference (localStorage), not server-saved settings,
  // so it applies before sign-in and for self-serve users too.
  const [motionOn, setMotionOn] = useState(true);

  // The name field lives on the survivor row itself (not survivor_settings), so it
  // has its own prefill effect, its own save action, and its own success line —
  // it saves independently of the care-plan/language/sharing "Save" button below.
  const [nameForm, setNameForm] = useState("");
  const [nameSaved, setNameSaved] = useState(false);

  useEffect(() => {
    if (query.data) setForm(query.data);
  }, [query.data]);

  useEffect(() => {
    if (survivor.data) setNameForm(survivor.data.first_name ?? "");
  }, [survivor.data]);

  const saveName = useMutation({
    mutationFn: (input: { survivorId: string; firstName: string | null; language: "en" | "es" }) =>
      updateProfile(input.survivorId, {
        preferred_language: input.language,
        first_name: input.firstName,
      }),
    onSuccess: async () => {
      setNameSaved(true);
      await queryClient.invalidateQueries({ queryKey: ["survivor"] });
    },
    onError: () => toast(copy.settings.dataError),
  });

  const onSaveName = () => {
    if (!survivor.data) return;
    setNameSaved(false);
    saveName.mutate({
      survivorId: survivor.data.id,
      firstName: nameForm.trim() || null,
      language: form.language,
    });
  };

  useEffect(() => {
    setMotionOn(getMotionPref() === "on");
  }, []);

  const navigate = useNavigate();
  const [dataBusy, setDataBusy] = useState<false | "export" | "delete">(false);

  // Optional app lock (device-local). Read the current state after mount (localStorage).
  const [lockOn, setLockOn] = useState(false);
  const [settingPin, setSettingPin] = useState(false);
  const [pin1, setPin1] = useState("");
  const [pin2, setPin2] = useState("");
  const [lockErr, setLockErr] = useState<string | null>(null);
  useEffect(() => {
    setLockOn(isLockEnabled());
  }, []);

  const onSavePin = async () => {
    if (pin1.length < 4) {
      setLockErr(copy.lock.tooShort);
      return;
    }
    if (pin1 !== pin2) {
      setLockErr(copy.lock.mismatch);
      return;
    }
    try {
      await setPin(pin1);
      setLockOn(true);
      setSettingPin(false);
      setPin1("");
      setPin2("");
      setLockErr(null);
    } catch {
      setLockErr(copy.settings.dataError);
    }
  };

  const onDisableLock = () => {
    disableLock();
    setLockOn(false);
    setSettingPin(false);
    setPin1("");
    setPin2("");
    setLockErr(null);
  };

  const onSave = () => {
    setSaved(false);
    save.mutate(form, {
      onSuccess: () => {
        setSaved(true);
        // Mirror the language locally so <html lang> is right on the next load too.
        setLangPref(form.language === "es" ? "es" : "en");
      },
    });
  };

  const onExport = async () => {
    setDataBusy("export");
    try {
      await downloadMySpace();
    } catch {
      toast(copy.settings.dataError);
    } finally {
      setDataBusy(false);
    }
  };

  const onDelete = async () => {
    setDataBusy("delete");
    try {
      await deleteMySpace();
      void navigate({ to: "/" });
    } catch {
      toast(copy.settings.dataError);
      setDataBusy(false);
    }
  };

  return (
    <Shell>
      {status !== "ok" ? (
        <NoSpacePanel />
      ) : (
        <div className="space-y-6">
          <h1 className="text-2xl font-normal tracking-tight">{copy.settings.title}</h1>

          {query.isLoading ? (
            <div className="space-y-3" aria-busy="true">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
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
                    {copy.settings.nameSection}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="settings-name">{copy.settings.nameLabel}</Label>
                    <Input
                      id="settings-name"
                      value={nameForm}
                      autoComplete="off"
                      onChange={(e) => setNameForm(e.target.value)}
                    />
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {copy.settings.nameNote}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onSaveName}
                    disabled={saveName.isPending || !survivor.data}
                    className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40"
                  >
                    {copy.settings.nameSave}
                  </button>
                  {nameSaved && (
                    <p aria-live="polite" className="text-xs text-muted-foreground">
                      {copy.settings.nameSaved}
                    </p>
                  )}
                </CardContent>
              </Card>

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
                    {copy.settings.motionSection}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <Label htmlFor="motion" className="text-sm font-normal">
                      {copy.settings.motionLabel}
                    </Label>
                    <Switch
                      id="motion"
                      checked={motionOn}
                      onCheckedChange={(v) => {
                        setMotionOn(v);
                        setMotionPref(v ? "on" : "off");
                      }}
                    />
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {copy.settings.motionNote}
                  </p>
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
              <p className="text-xs text-muted-foreground">{copy.settings.saveScopeNote}</p>
              {saved && <p className="text-center text-xs text-muted-foreground">Saved.</p>}

              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-normal">{copy.lock.section}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {copy.lock.explain}
                  </p>
                  {!lockOn && !settingPin && (
                    <button
                      type="button"
                      onClick={() => setSettingPin(true)}
                      className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                      {copy.lock.setCta}
                    </button>
                  )}
                  {settingPin && (
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <Label htmlFor="pin1">{copy.lock.newLabel}</Label>
                        <Input
                          id="pin1"
                          type="password"
                          inputMode="numeric"
                          autoComplete="off"
                          value={pin1}
                          onChange={(e) => setPin1(e.target.value.replace(/\D/g, "").slice(0, 8))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="pin2">{copy.lock.confirmLabel}</Label>
                        <Input
                          id="pin2"
                          type="password"
                          inputMode="numeric"
                          autoComplete="off"
                          value={pin2}
                          onChange={(e) => setPin2(e.target.value.replace(/\D/g, "").slice(0, 8))}
                        />
                      </div>
                      {lockErr && <p className="text-sm text-destructive">{lockErr}</p>}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void onSavePin()}
                          className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
                        >
                          {copy.lock.saveCta}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSettingPin(false);
                            setPin1("");
                            setPin2("");
                            setLockErr(null);
                          }}
                          className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground"
                        >
                          {copy.lock.cancel}
                        </button>
                      </div>
                    </div>
                  )}
                  {lockOn && !settingPin && (
                    <div className="space-y-3">
                      <p className="text-sm text-foreground">{copy.lock.onNote}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <button
                          type="button"
                          onClick={() => lock()}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {copy.lock.lockNow}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSettingPin(true)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {copy.lock.setCta}
                        </button>
                        <ConfirmButton
                          onConfirm={onDisableLock}
                          trigger={copy.lock.disableCta}
                          confirmLabel={copy.lock.disableCta}
                          cancelLabel={copy.lock.cancel}
                          className="text-muted-foreground hover:text-destructive"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <RecoveryWordsCard />

              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-normal">
                    {copy.settings.dataSection}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => void onExport()}
                      disabled={dataBusy !== false}
                      className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40"
                    >
                      {dataBusy === "export"
                        ? copy.settings.dataExportBusy
                        : copy.settings.dataExport}
                    </button>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {copy.settings.dataExportNote}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <ConfirmButton
                      disabled={dataBusy !== false}
                      onConfirm={() => void onDelete()}
                      trigger={
                        dataBusy === "delete"
                          ? copy.settings.dataDeleteBusy
                          : copy.settings.dataDelete
                      }
                      confirmLabel={copy.settings.dataDeleteConfirm}
                      cancelLabel={copy.settings.dataDeleteCancel}
                      className="text-sm text-muted-foreground hover:text-destructive disabled:opacity-40"
                    />
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {copy.settings.dataDeleteNote}
                    </p>
                  </div>
                  <Link
                    to="/privacy"
                    className="block text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
                  >
                    {copy.settings.privacyLink}
                  </Link>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </Shell>
  );
}
