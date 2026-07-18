// "Your state's court protections" — a location-aware slice of the verified
// research dossier. Only fields that carried an "ok" verification status are
// shown (a null beat a guess at research time; the same honesty holds here).
// Content is English-first like the study narration; the chrome is bilingual
// and the advocate-confirm note always shows.

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { copy } from "@/lib/copy";
import { STATE_PROTECTIONS } from "@/lib/copy/stateProtections";

export function StateProtectionsSection() {
  const [postal, setPostal] = useState("");
  const picked = STATE_PROTECTIONS.find((s) => s.postal === postal) ?? null;
  const t = copy.resources.protections;

  return (
    <section className="space-y-3">
      <h2 className="text-xs uppercase tracking-wide text-muted-foreground">{t.label}</h2>
      <Card>
        <CardContent className="space-y-3 py-5">
          <p className="text-sm leading-relaxed text-muted-foreground">{t.intro}</p>
          <select
            value={postal}
            onChange={(e) => setPostal(e.target.value)}
            aria-label={t.pickerLabel}
            className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground"
          >
            <option value="">{t.pickerPlaceholder}</option>
            {STATE_PROTECTIONS.map((s) => (
              <option key={s.postal} value={s.postal}>
                {s.jurisdiction}
              </option>
            ))}
            <option value="__other">{t.somewhereElse}</option>
          </select>

          {postal === "__other" && (
            <p className="text-sm leading-relaxed text-muted-foreground">{t.otherNote}</p>
          )}

          {picked && (
            <div className="space-y-3">
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t.verifiedNote.replace("{n}", String(picked.cards.length))} ·{" "}
                {t.lastVerified.replace("{date}", picked.lastVerified)}
              </p>
              {picked.cards.map((card) => (
                <div key={card.key} className="rounded-md border border-border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-foreground">{card.value}</p>
                  {card.notes && (
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {card.notes}
                    </p>
                  )}
                  <p className="mt-1.5 text-[0.7rem] leading-relaxed text-muted-foreground">
                    {card.url ? (
                      <a
                        href={card.url}
                        target="_blank"
                        rel="noreferrer"
                        className="underline underline-offset-2 hover:text-foreground"
                      >
                        {card.citation}
                      </a>
                    ) : (
                      card.citation
                    )}
                  </p>
                </div>
              ))}
              <p className="text-xs leading-relaxed text-muted-foreground">{t.advocateNote}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
