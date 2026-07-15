// The in-app guide chat — a quiet concierge for the app itself.
//
// Placement rules (see the design spec): route-allowlisted (never on flow or
// safety surfaces), bottom-LEFT so toasts (bottom-right) and the install
// prompt (bottom-center) keep their lanes, z-40 so the PIN LockGate (z-50)
// always covers it. Never auto-opens, never animates on its own.
//
// Privacy: the conversation lives in component memory and is wiped on close.
// Safety: the deterministic tripwire runs before any network call (see
// useHelperChat); navigation only happens when the person taps the offer.

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { HelpCircle, Send } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { HotlineLinks } from "@/components/CrisisCard";
import { copy } from "@/lib/copy";
import { getLangPref } from "@/lib/lang";
import { isLocked, subscribeLock } from "@/lib/appLock";
import { pageChips, widgetAllowedOn } from "@/lib/helper/appMap";
import { useHelperChat, type HelperTurn } from "@/lib/helper/useHelperChat";

function AssistantTurn({
  turn,
  onNavigate,
}: {
  turn: HelperTurn;
  onNavigate: (to: string) => void;
}) {
  if (turn.role !== "assistant") return null;
  if (turn.kind === "crisis") {
    return (
      <div className="space-y-2 rounded-md border border-border bg-card p-3">
        <p className="text-sm leading-relaxed text-foreground">{copy.helper.crisisIntro}</p>
        <HotlineLinks />
        <Link to="/resources" className="inline-block py-1 text-sm underline underline-offset-4">
          {copy.helper.crisisSupportCta}
        </Link>
      </div>
    );
  }
  if (turn.kind === "stop") {
    return <p className="text-sm leading-relaxed text-muted-foreground">{copy.helper.stopAck}</p>;
  }
  return (
    <div className="space-y-2">
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{turn.content}</p>
      {turn.navigate && (
        <button
          type="button"
          onClick={() => onNavigate(turn.navigate!.to)}
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
        >
          {copy.helper.navGo} → {turn.navigate.label}
        </button>
      )}
    </div>
  );
}

export function HelperWidget() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [locked, setLocked] = useState(false);
  const [draft, setDraft] = useState("");
  const openedOnceRef = useRef(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  const chat = useHelperChat({
    route: pathname,
    language: getLangPref() === "es" ? "es" : "en",
  });

  useEffect(() => {
    setLocked(isLocked());
    return subscribeLock(() => setLocked(isLocked()));
  }, []);

  // New messages keep the latest turn in view (no smooth scroll — Stillness).
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat.turns.length]);

  if (!widgetAllowedOn(pathname) || locked) return null;

  const submit = () => {
    const text = draft.trim();
    if (!text || chat.sendState === "sending") return;
    setDraft("");
    void chat.send(text);
  };

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next && !openedOnceRef.current) {
      openedOnceRef.current = true;
      chat.noteOpened();
    }
    if (!next) chat.closeAndWipe();
  };

  const noticeLine =
    chat.notice === "offline"
      ? copy.helper.offline
      : chat.notice === "resting"
        ? copy.helper.resting
        : chat.notice === "error"
          ? copy.helper.error
          : null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>
        <button
          type="button"
          aria-label={copy.helper.buttonSr}
          className="paper-shadow fixed bottom-20 left-4 z-40 flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2.5 text-sm text-foreground sm:bottom-6"
        >
          <HelpCircle className="h-4 w-4 text-muted-foreground" aria-hidden />
          {copy.helper.button}
        </button>
      </DrawerTrigger>
      <DrawerContent className="mx-auto max-h-[85dvh] w-full max-w-md">
        <DrawerHeader className="pb-2 text-left">
          <DrawerTitle className="text-base font-normal">{copy.helper.title}</DrawerTitle>
          <DrawerDescription className="text-sm leading-relaxed">
            {copy.helper.intro}
          </DrawerDescription>
        </DrawerHeader>

        <div
          ref={listRef}
          className="flex-1 space-y-4 overflow-y-auto px-4 pb-2"
          aria-live="polite"
        >
          {chat.turns.length === 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">{copy.helper.starterHeading}</p>
              <div className="flex flex-wrap gap-2">
                {pageChips(pathname).map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => void chat.send(chip)}
                    className="rounded-full border border-border px-3 py-2 text-sm text-foreground"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}
          {chat.turns.map((turn, i) =>
            turn.role === "user" ? (
              <p key={i} className="ml-6 rounded-md bg-secondary px-3 py-2 text-sm text-foreground">
                {turn.content}
              </p>
            ) : (
              <div key={i} className="mr-2">
                <AssistantTurn
                  turn={turn}
                  onNavigate={(to) => {
                    onOpenChange(false);
                    void navigate({ to });
                  }}
                />
                {turn.kind === undefined && turn.suggestions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {turn.suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => void chat.send(s)}
                        className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ),
          )}
          {chat.sendState === "sending" && (
            <p className="text-sm text-muted-foreground" role="status">
              {copy.helper.thinking}
            </p>
          )}
          {noticeLine && (
            <p className="text-sm text-muted-foreground" role="status">
              {noticeLine}
            </p>
          )}
        </div>

        <div className="space-y-2 border-t border-border p-4">
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder={copy.helper.inputPlaceholder}
              aria-label={copy.helper.inputPlaceholder}
              className="min-h-11 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              type="button"
              onClick={submit}
              aria-label={copy.helper.send}
              className="min-h-11 rounded-md bg-primary px-3 text-primary-foreground disabled:opacity-60"
              disabled={chat.sendState === "sending" || !draft.trim()}
            >
              <Send className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <p className="text-center text-xs text-muted-foreground">{copy.helper.notSaved}</p>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
