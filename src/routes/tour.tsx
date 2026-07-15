// Public, no-auth interactive tour for hackathon judges: a guided, chaptered
// replay of the real survivor journey inside a phone frame, from FROZEN sample
// data (no account, no reads, nothing created). Adapted from the
// interactive-product-demo pattern with one deliberate change for THIS product:
// the app's rule is "nothing moves on its own," so the walkthrough is PAUSED by
// default and plays only when the judge presses Play — motion stays their choice,
// which also mirrors the product's "you set the pace." Every screen depicts only
// what the shipped app actually does (faithfulness over polish). Honors the app's
// reduce-motion / Stillness handling. The person shown is fictional.
//
// Sound follows the same rule as motion: clips (the Coach's line, a real guide
// narration, the practice person) play only while the judge has pressed Play,
// never under reduce-motion/Stillness, and pause the instant the tour does.
// The English⇄Español toggle mirrors the app's own header menu; it flips the
// PHONE — the survivor-facing surface, which is genuinely bilingual — while the
// judge-facing narration rail deliberately stays English, like /judges itself.

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useReducer, useRef, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  LogOut,
  Square,
  Wind,
  HelpCircle,
  ShieldCheck,
  Lock,
  Heart,
  Scale,
  Globe,
  Check,
} from "lucide-react";
import { pageTitle, PRODUCT_NAME } from "@/lib/product";
import { tourCopy, LEARN_AUDIO_SRC, type TourCopy } from "@/lib/tour/copy";

export const Route = createFileRoute("/tour")({
  head: () => ({ meta: [{ title: pageTitle("Interactive tour") }] }),
  component: TourScreen,
});

// Fictional sample cipher — what a stolen row actually looks like.
const CIPHER =
  "wcBMA0f2b3c9x1lkAQ/+Ln7Ke2r8Ym4Vt1pQ0sZ9Jc3Rd8hFb2gKpWm5oXaTq0nP4vH1sLd7yQf0aB9cE6iR3kZ2xM8wN5tU7bV4oG1pS6rC3jD0eH8fA9lK2mB7q";

// Shown in their own language/script on purpose — mirrors the app's menu.
const COMING_SOON_LANGUAGES = ["中文", "Tagalog", "한국어", "Tiếng Việt", "Русский"] as const;

interface Waypoint {
  p: number;
  x: number;
  y: number;
  click?: boolean;
}
interface Chapter {
  n: string;
  label: string;
  title: string;
  desc: string;
  dur: number;
  pointer: Waypoint[];
}

const CHAPTERS: Chapter[] = [
  {
    n: "01",
    label: "The way out",
    title: "A quiet place, with the exit first.",
    desc: "“Leave now” sits on every screen and leaves instantly. The threat model includes the room she is sitting in.",
    dur: 8500,
    pointer: [
      { p: 0.3, x: 0.86, y: 0.06, click: true },
      { p: 0.72, x: 0.5, y: 0.74, click: true },
    ],
  },
  {
    n: "02",
    label: "No name, no trace",
    title: "She never has to say who she is.",
    desc: "No account, no email, no legal name — an anonymous sign-in, minimal by design. And six optional words — “a way back in” — can reopen her space on a device she controls.",
    dur: 12500,
    pointer: [{ p: 0.4, x: 0.5, y: 0.68, click: true }],
  },
  {
    n: "03",
    label: "A voice that steadies",
    title: "It explains court. It never tells her what to say.",
    desc: "Talk or type — every word the Coach speaks appears as text, and here you can hear the calm register it holds. Say “stop” and everything halts in code, before the model can answer.",
    dur: 22500,
    pointer: [],
  },
  {
    n: "04",
    label: "Learn",
    title: "Court words, made small.",
    desc: "Ten hand-written guides, 66 steps, every one narrated — “Big words. Small meanings.” Tap any term. Nothing is scored; listening is a choice, like everything.",
    dur: 12000,
    pointer: [
      { p: 0.24, x: 0.5, y: 0.62, click: true },
      { p: 0.48, x: 0.32, y: 0.47, click: true },
      { p: 0.6, x: 0.5, y: 0.8, click: true },
    ],
  },
  {
    n: "05",
    label: "Her words, her locks",
    title: "Encrypted before they are ever stored.",
    desc: "Statements, a timeline where fuzzy dates are welcome, papers encrypted in her browser — filename included. A draft for her lawyer gathers only what she chose to share.",
    dur: 12500,
    pointer: [{ p: 0.24, x: 0.42, y: 0.4, click: true }],
  },
  {
    n: "06",
    label: "The Witness Stand",
    title: "Pressure, at an intensity she chooses.",
    desc: "Consent-gated every time. A practice person — honestly labeled a computer picture — asks only about what she marked shareable. “Stop” ends it in code, and her Coach has the last word.",
    dur: 24000,
    pointer: [{ p: 0.24, x: 0.5, y: 0.72, click: true }],
  },
  {
    n: "07",
    label: "She decides who sees",
    title: "Consent she can grant — and revoke.",
    desc: "A professional sees only the categories she shares, for only as long as she allows. The AI can draft for her lawyer; it never coaches testimony.",
    dur: 11000,
    pointer: [
      { p: 0.24, x: 0.29, y: 0.5, click: true },
      { p: 0.84, x: 0.5, y: 0.86, click: true },
    ],
  },
  {
    n: "08",
    label: "Grounded, never alone",
    title: "Real law, and a real human, one tap away.",
    desc: "Every legal claim traces to primary sources. The AI retrieves, explains, and routes — it never decides.",
    dur: 10000,
    pointer: [],
  },
];

const STARTS: number[] = [];
let TOTAL = 0;
for (const c of CHAPTERS) {
  STARTS.push(TOTAL);
  TOTAL += c.dur;
}

// Chapter indices the media rig cares about.
const CH_COACH = 2;
const CH_LEARN = 3;
const CH_WITNESS = 5;
// Beats (as chapter progress) where each clip begins.
const COACH_AT = 0.06;
const COACH_HALT_AT = 0.8;
const NARR_AT = 0.56;
const VIDEO_AT = 0.3;
const WITNESS_HALT_AT = 0.86;
// Where the timeline waits for the practice person's clip, and for how long
// at most (a broken network must never stall the replay forever).
const HOLD_ELAPSED = STARTS[CH_WITNESS] + CHAPTERS[CH_WITNESS].dur * (VIDEO_AT + 0.05);
const HOLD_CAP_MS = 12000;

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

const PILLARS = [
  {
    Icon: ShieldCheck,
    t: "Safety by default",
    d: "“Leave now” on every screen, an anonymous identity, calm-not-alarm design, and a quick exit that even neutralizes the browser Back button.",
  },
  {
    Icon: Lock,
    t: "Her words, encrypted",
    d: "Content is encrypted at rest with a key held in a separate vault; documents are AES-GCM encrypted in the browser — filename included — before upload.",
  },
  {
    Icon: Heart,
    t: "AI that never coaches",
    d: "A deterministic stop word halts sessions in code, practice can never end in the defense voice, and the model refuses to label whether she was trafficked.",
  },
  {
    Icon: Scale,
    t: "Grounded in real law",
    d: "Every court-process claim traces to primary sources — the CVRA, FRE 412, DOJ/OVC guidance — and verified hotlines. Sources over assertions.",
  },
];

const revealed = (p: number, threshold: number) => (p >= threshold ? "tour-rv tour-in" : "tour-rv");

/** Renders guide-step body text, turning [[term]] markers into the app's tap-a-word underline. */
function StepBody({ body }: { body: string }) {
  const parts = body.split(/\[\[(.*?)\]\]/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="tour-underline">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

/** m:ss for the practice timer, counting down from 8:00 across the live beat. */
function practiceClock(p: number): string {
  const liveSpan = (WITNESS_HALT_AT - VIDEO_AT - 0.06) * (CHAPTERS[CH_WITNESS].dur / 1000);
  const elapsed =
    clamp((p - VIDEO_AT - 0.06) / (WITNESS_HALT_AT - VIDEO_AT - 0.06), 0, 1) * liveSpan;
  const left = Math.max(0, Math.round(8 * 60 - elapsed));
  const m = Math.floor(left / 60);
  const s = String(left % 60).padStart(2, "0");
  return `${m}:${s}`;
}

/** The phone screen contents for one chapter, driven by 0→1 progress. */
function Stage({
  index,
  p,
  t,
  narrating,
  videoRef,
  avatarClipOk,
  videoReady,
  onVideoReady,
  onVideoError,
}: {
  index: number;
  p: number;
  t: TourCopy;
  narrating: boolean;
  videoRef: (el: HTMLVideoElement | null) => void;
  avatarClipOk: boolean;
  videoReady: boolean;
  onVideoReady: () => void;
  onVideoError: () => void;
}) {
  switch (index) {
    case 0:
      return (
        <>
          <h1 className="tour-h1">{PRODUCT_NAME}.</h1>
          <p className="tour-p">{t.ch1.tagline}</p>
          <div className={"tour-card " + revealed(p, 0.15)}>
            <div className="tour-stack">
              {t.ch1.stack.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </div>
          </div>
          <div className="tour-btns">
            <button type="button" className={"tour-btn " + revealed(p, 0.4)} tabIndex={-1}>
              {t.ch1.begin}
            </button>
            <button type="button" className={"tour-btn ghost " + revealed(p, 0.5)} tabIndex={-1}>
              {t.ch1.haveCode}
            </button>
          </div>
        </>
      );
    case 1:
      return (
        <>
          <h2 className="tour-h2">{t.ch2.title}</h2>
          <p className="tour-p sm">{t.ch2.lede}</p>
          <div className="tour-card">
            <ul className="tour-list">
              {t.ch2.points.map((point, i) => (
                <li key={point} className={revealed(p, 0.08 + i * 0.1)}>
                  <span className="dot">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
          <button type="button" className={"tour-btn " + revealed(p, 0.4)} tabIndex={-1}>
            {t.ch2.cta}
          </button>
          <div className={"tour-card " + revealed(p, 0.62)}>
            <div className="tour-mut lbl">{t.recovery.title}</div>
            <div className="tour-statement sm" style={{ marginBottom: 8 }}>
              {t.recovery.dialogTitle}
            </div>
            <div className="tour-words">
              {t.recovery.words.map((w) => (
                <span key={w}>{w}</span>
              ))}
            </div>
            <p className="tour-mut" style={{ marginTop: 8 }}>
              {t.recovery.note}
            </p>
          </div>
        </>
      );
    case 2: {
      const full = t.ch3.caption;
      const typing = clamp((p - COACH_AT) / 0.58, 0, 1);
      const shown = full.slice(0, Math.ceil(full.length * typing));
      const halted = p >= COACH_HALT_AT;
      return (
        <div className="tour-session">
          <div className={"tour-orb" + (halted ? " small" : "")} />
          <div className="tour-coachrow">{t.ch3.coachRow}</div>
          <div className="tour-caption">
            {halted ? "" : shown}
            {!halted && typing < 1 ? <span className="tour-cursor" /> : null}
          </div>
          {halted ? (
            <div className="tour-halt-inline">
              <div className="tour-h2" style={{ margin: "0 0 6px" }}>
                {t.halt.title}
              </div>
              <p className="tour-p sm" style={{ margin: "0 0 4px" }}>
                {t.halt.body}
              </p>
              <p className="tour-mut">{t.ch3.breath}</p>
            </div>
          ) : null}
        </div>
      );
    }
    case 3: {
      const opened = p >= 0.32;
      if (!opened) {
        return (
          <>
            <h2 className="tour-h2">{t.learn.heading}</h2>
            <p className="tour-mut sp">{t.learn.hint}</p>
            <div className="tour-shelf">
              {t.learn.covers.map((c, i) => (
                <div
                  key={c.title}
                  className={"tour-nb tour-nb-" + c.color + " " + revealed(p, 0.06 + i * 0.07)}
                >
                  <div className="tour-nb-title">{c.title}</div>
                  <div className="tour-nb-min">{t.learn.minutesLine(c.minutes)}</div>
                </div>
              ))}
            </div>
          </>
        );
      }
      return (
        <>
          <p className="tour-mut lbl" style={{ margin: "2px 0 6px" }}>
            {t.learn.guideTitle}
          </p>
          <h2 className="tour-h2" style={{ marginTop: 0 }}>
            {t.learn.step.title}
          </h2>
          <div className="tour-card">
            <div className="tour-tile-lbl" style={{ marginBottom: 6 }}>
              {t.learn.step.cardTitle}
            </div>
            <div className="tour-statement">
              <StepBody body={t.learn.step.body} />
            </div>
          </div>
          <div className={"tour-pop " + revealed(p, 0.48)}>
            <b>{t.learn.term.term}</b>
            <span>{t.learn.term.meaning}</span>
          </div>
          {t.learn.showListen ? (
            <div className={"tour-listen " + revealed(p, 0.58)}>
              <span className="tour-listen-btn" aria-hidden>
                <Play className="h-3 w-3" fill="currentColor" strokeWidth={0} />
              </span>
              <span>{t.learn.listen}</span>
              <span className={"tour-eq" + (narrating ? " on" : "")} aria-hidden>
                <i />
                <i />
                <i />
              </span>
            </div>
          ) : (
            <p className={"tour-mut " + revealed(p, 0.58)} style={{ marginTop: 10 }}>
              {t.learn.narrationNote}
            </p>
          )}
        </>
      );
    }
    case 4: {
      return (
        <>
          <h2 className="tour-h2">{t.ch5.title}</h2>
          <div className="tour-tabs">
            <span className="on">{t.ch5.tabs.statements}</span>
            <span>{t.ch5.tabs.timeline}</span>
            <span>{t.ch5.tabs.documents}</span>
          </div>
          <div className="tour-card">
            <div className="tour-statement sm">{t.ch5.statement}</div>
            <div className="tour-pills">
              <span className="tour-pill priv">{t.ch5.privatePill}</span>
              <span className={"tour-pill " + revealed(p, 0.24)}>{t.ch5.sharePill}</span>
            </div>
          </div>
          <div className={"tour-row " + revealed(p, 0.36)}>
            <span className="tour-row-when">{t.ch5.timelineWhen}</span>
            <span className="tour-row-what">{t.ch5.timelineWhat}</span>
            <span className="tour-row-note">{t.ch5.timelineNote}</span>
          </div>
          <div className={"tour-row " + revealed(p, 0.48)}>
            <span className="tour-row-when mono">
              <Lock className="h-3 w-3" strokeWidth={2} aria-hidden /> {t.ch5.paperName}
            </span>
            <span className="tour-row-note">{t.ch5.paperNote}</span>
          </div>
          <div className={"tour-enc " + revealed(p, 0.62)}>
            <div className="tour-tile plain">
              <div className="tour-tile-lbl">{t.ch5.plainLabel}</div>
              {t.ch5.statement.slice(0, 54)}…
            </div>
            <div className="tour-tile cipher">
              <div className="tour-tile-lbl">{t.ch5.cipherLabel}</div>
              {CIPHER.slice(0, 64)}
            </div>
          </div>
          <div className={"tour-draft " + revealed(p, 0.82)}>
            <span className="tour-draft-h">{t.ch5.draftHeading}</span>
            <span className="tour-mut">{t.ch5.draftSub}</span>
          </div>
        </>
      );
    }
    case 5: {
      if (p < 0.28) {
        return (
          <>
            <h2 className="tour-h2">{t.witness.consentTitle}</h2>
            <p className="tour-p sm" style={{ marginBottom: 10 }}>
              {t.witness.consentBody}
            </p>
            <ul className="tour-list tight">
              {t.witness.consentPoints.map((point, i) => (
                <li key={point} className={revealed(p, 0.06 + i * 0.05)}>
                  <span className="dot">—</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <div className="tour-btns" style={{ marginTop: 12 }}>
              <button type="button" className={"tour-btn " + revealed(p, 0.18)} tabIndex={-1}>
                {t.witness.begin}
              </button>
              <button type="button" className="tour-btn ghost" tabIndex={-1}>
                {t.witness.notNow}
              </button>
            </div>
          </>
        );
      }
      if (p >= WITNESS_HALT_AT) {
        return (
          <div className="tour-session" style={{ justifyContent: "center", paddingTop: 40 }}>
            <div className="tour-h1" style={{ margin: "0 0 8px" }}>
              {t.halt.title}
            </div>
            <p className="tour-p sm" style={{ margin: "0 0 4px" }}>
              {t.halt.body}
            </p>
            <p className="tour-mut">{t.ch3.breath}</p>
          </div>
        );
      }
      // "Ready" needs the beat AND decodable frames — until both, the room is
      // honestly still getting ready (exactly what the live app shows), so a
      // slow first fetch can never leave a silent blank box on screen.
      const ready = p >= VIDEO_AT + 0.06 && (videoReady || !avatarClipOk);
      const saidStop = p >= 0.78;
      return (
        <div className="tour-witness">
          <div className="tour-coachrow" style={{ marginBottom: 8 }}>
            {t.witness.persona}
          </div>
          <div className="tour-videowrap">
            {avatarClipOk ? (
              <video
                ref={videoRef}
                className="tour-video"
                src="/tour/practice-person.mp4"
                playsInline
                preload="auto"
                onLoadedData={onVideoReady}
                onError={onVideoError}
                style={videoReady ? undefined : { visibility: "hidden" }}
              />
            ) : null}
            {!avatarClipOk || !videoReady ? (
              <div className="tour-video tour-avatarfall" aria-hidden>
                <span className="tour-avatarfall-head" />
                <span className="tour-avatarfall-body" />
              </div>
            ) : null}
          </div>
          <p className="tour-avnote">{t.witness.avatarNote}</p>
          <div className="tour-caption sm">{ready ? t.witness.question : ""}</div>
          <div className="tour-timerchip">
            {ready ? t.witness.upTo(practiceClock(p)) : t.witness.gettingReady}
          </div>
          {saidStop ? (
            <div className="tour-stopchip">{t.witness.youSay}</div>
          ) : (
            <div className="tour-ptt">
              <button type="button" className="tour-btn sm" tabIndex={-1}>
                {t.witness.answer}
              </button>
              <p className="tour-mut" style={{ marginTop: 6 }}>
                {t.witness.answerHint}
              </p>
            </div>
          )}
        </div>
      );
    }
    case 6: {
      const revoked = p >= 0.9;
      return (
        <>
          <h2 className="tour-h2">{t.ch7.title}</h2>
          <div className="tour-card">
            <div className="tour-statement">{t.ch7.request}</div>
            <div className="tour-mut lbl">{t.ch7.wantToSee}</div>
            <div className="tour-pills">
              {t.ch7.scopes.map((s) => (
                <span key={s} className="tour-pill">
                  {s}
                </span>
              ))}
            </div>
            <div className="tour-btns row">
              <button type="button" className={"tour-btn sm " + revealed(p, 0.22)} tabIndex={-1}>
                {t.ch7.accept}
              </button>
              <button type="button" className="tour-btn ghost sm" tabIndex={-1}>
                {t.ch7.notNow}
              </button>
            </div>
          </div>
          <div className={"tour-card " + revealed(p, 0.55)}>
            <div className="tour-statement sm">{t.ch7.active}</div>
            <button
              type="button"
              className={"tour-btn ghost sm danger " + revealed(p, 0.82)}
              tabIndex={-1}
            >
              {revoked ? t.ch7.ended : t.ch7.endAccess}
            </button>
          </div>
        </>
      );
    }
    case 7:
      return (
        <>
          <h2 className="tour-h2">{t.ch8.title}</h2>
          <div className={"tour-card " + revealed(p, 0.08)}>
            <div className="tour-hot-name">{t.ch8.hotline.name}</div>
            <div className="tour-hot-num">{t.ch8.hotline.number}</div>
            <div className="tour-mut">{t.ch8.hotline.hours}</div>
          </div>
          <div className={"tour-card " + revealed(p, 0.24)}>
            <div className="tour-statement sm">{t.ch8.moreLines}</div>
          </div>
          <div className={"tour-receipts " + revealed(p, 0.5)}>
            <div className="tour-mut lbl">{t.ch8.receiptsLabel}</div>
            {t.ch8.receipts.map((r) => (
              <span key={r}>{r}</span>
            ))}
          </div>
        </>
      );
    default:
      return null;
  }
}

type TryMode = "leave" | "stop" | "breather" | "helper";
const TRY_DURATION: Record<TryMode, number> = {
  leave: 3800,
  stop: 3800,
  breather: 6500,
  helper: 7000,
};

function TourScreen() {
  const elapsedRef = useRef(0);
  const stopAtRef = useRef<number | null>(null);
  const [, force] = useReducer((x: number) => x + 1, 0);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [es, setEs] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [tryMode, setTryMode] = useState<null | TryMode>(null);
  const [coachClipOk, setCoachClipOk] = useState(true);
  const [avatarClipOk, setAvatarClipOk] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const tryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const coachRef = useRef<HTMLAudioElement | null>(null);
  const narrRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const t = tourCopy(es);

  // Client-only: reduce-motion / Stillness. Read after mount to avoid an SSR mismatch.
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const off = document.documentElement.getAttribute("data-motion") === "off";
    setReduced(m.matches || off);
  }, []);

  // Warm the practice-person clip while the visitor reads the hero, so the
  // chapter never waits on the network — the deployed site's first fetch of
  // the file can be slow enough to hold frames back for seconds otherwise.
  useEffect(() => {
    fetch("/tour/practice-person.mp4").catch(() => {});
  }, []);

  // ---- Media rig -----------------------------------------------------------
  // One driver keeps every clip aligned with the timeline: playing → the clip
  // for the active beat plays from the beat-relative offset; anything else →
  // paused. Never under reduce-motion/Stillness; sound starts only after the
  // judge's own Play press (which is also what satisfies autoplay policy).
  const syncMedia = (activeIdx: number, prog: number, isPlaying: boolean) => {
    const durOf = (i: number) => CHAPTERS[i].dur / 1000;
    const drive = (el: HTMLMediaElement | null, on: boolean, offset: number) => {
      if (!el) return;
      if (!on) {
        if (!el.paused) el.pause();
        return;
      }
      if (Math.abs(el.currentTime - offset) > 0.45) el.currentTime = Math.max(0, offset);
      if (el.paused) void el.play().catch(() => {});
    };
    const ok = isPlaying && !reduced && tryMode === null;
    drive(
      coachRef.current,
      ok && coachClipOk && activeIdx === CH_COACH && prog >= COACH_AT && prog < COACH_HALT_AT,
      (prog - COACH_AT) * durOf(CH_COACH),
    );
    drive(
      narrRef.current,
      ok && !es && activeIdx === CH_LEARN && prog >= NARR_AT,
      (prog - NARR_AT) * durOf(CH_LEARN),
    );
    drive(
      videoRef.current,
      ok && avatarClipOk && activeIdx === CH_WITNESS && prog >= VIDEO_AT && prog < WITNESS_HALT_AT,
      // Clock anchored to the hold-release beat, so after a buffering wait
      // the clip still starts from her first words.
      (prog - (VIDEO_AT + 0.05)) * durOf(CH_WITNESS),
    );
  };
  const syncRef = useRef(syncMedia);
  syncRef.current = syncMedia;

  // The witness chapter must not march past the practice person while her
  // clip is still buffering (a slow first fetch otherwise leaves seconds of
  // silhouette and a rushed reveal). Mirror the readiness flags into refs and
  // let the rAF loop HOLD at the "Getting the practice room ready…" beat
  // until frames are decodable — the same wait the live app shows — capped
  // so a broken network can never stall the replay forever.
  const videoReadyRef = useRef(false);
  const avatarClipOkRef = useRef(true);
  videoReadyRef.current = videoReady;
  avatarClipOkRef.current = avatarClipOk;
  const holdStartRef = useRef<number | null>(null);

  // The single rAF loop — runs only while playing (never on its own).
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last: number | null = null;
    const loop = (ts: number) => {
      if (last == null) last = ts;
      const dt = ts - last;
      last = ts;
      let ne = elapsedRef.current + dt;
      if (
        avatarClipOkRef.current &&
        !videoReadyRef.current &&
        ne >= HOLD_ELAPSED &&
        elapsedRef.current <= HOLD_ELAPSED
      ) {
        if (holdStartRef.current == null) holdStartRef.current = ts;
        if (ts - holdStartRef.current < HOLD_CAP_MS) ne = HOLD_ELAPSED;
      } else if (videoReadyRef.current || ne < HOLD_ELAPSED) {
        holdStartRef.current = null;
      }
      if (stopAtRef.current != null && ne >= stopAtRef.current) {
        ne = stopAtRef.current;
        stopAtRef.current = null;
        elapsedRef.current = ne;
        force();
        setPlaying(false);
        return;
      }
      if (ne >= TOTAL) {
        elapsedRef.current = TOTAL;
        force();
        setPlaying(false);
        return;
      }
      elapsedRef.current = ne;
      let idx = 0;
      for (let i = 0; i < CHAPTERS.length; i++) if (ne >= STARTS[i]) idx = i;
      syncRef.current(idx, clamp((ne - STARTS[idx]) / CHAPTERS[idx].dur, 0, 1), true);
      force();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  // Whatever else happens (pause, try-it, language flip, chapter jump), a
  // non-playing tour is a silent tour.
  useEffect(() => {
    if (!playing || tryMode !== null) syncRef.current(0, 0, false);
  }, [playing, tryMode, es]);

  useEffect(
    () => () => {
      if (tryTimer.current) clearTimeout(tryTimer.current);
    },
    [],
  );

  const elapsed = elapsedRef.current;
  let active = 0;
  for (let i = 0; i < CHAPTERS.length; i++) if (elapsed >= STARTS[i]) active = i;
  const liveProgress = clamp((elapsed - STARTS[active]) / CHAPTERS[active].dur, 0, 1);
  // A paused frame is always a COMPLETE frame — never a half-typed caption.
  const shown = playing ? liveProgress : 1;
  const ch = CHAPTERS[active];
  const narrating =
    playing &&
    !reduced &&
    !es &&
    active === CH_LEARN &&
    liveProgress >= NARR_AT &&
    tryMode === null;

  const play = () => {
    if (elapsedRef.current >= TOTAL) {
      elapsedRef.current = 0;
    }
    stopAtRef.current = null;
    setPlaying(true);
    // Stacked mobile layout puts Play above the phone frame — bring the demo
    // screen into view so pressing it doesn't animate off-screen. Never on
    // its own: only in direct response to this tap.
    const phone = phoneRef.current;
    if (phone) {
      const rect = phone.getBoundingClientRect();
      const offscreen = rect.top < 0 || rect.bottom > window.innerHeight;
      if (offscreen) {
        const motionOK =
          document.documentElement.dataset.motion !== "off" &&
          !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        phone.scrollIntoView({ behavior: motionOK ? "smooth" : "auto", block: "center" });
      }
    }
  };
  const pause = () => setPlaying(false);
  const restart = () => {
    elapsedRef.current = 0;
    stopAtRef.current = null;
    force();
    setPlaying(!reduced);
    if (reduced) setPlaying(false);
  };
  const jumpTo = (i: number) => {
    elapsedRef.current = STARTS[i] + 1;
    if (reduced) {
      stopAtRef.current = null;
      setPlaying(false);
      force();
    } else {
      stopAtRef.current = STARTS[i] + CHAPTERS[i].dur;
      setPlaying(true);
      force();
    }
  };

  const runTry = (mode: TryMode) => {
    setPlaying(false);
    setTryMode(mode);
    if (tryTimer.current) clearTimeout(tryTimer.current);
    tryTimer.current = setTimeout(() => setTryMode(null), TRY_DURATION[mode]);
  };

  const setLang = (next: boolean) => {
    setEs(next);
    setLangOpen(false);
  };

  // Pointer position (fractions of the phone screen), only while playing with motion.
  let ptr: { x: number; y: number; click: boolean; show: boolean } = {
    x: 0,
    y: 0,
    click: false,
    show: false,
  };
  if (playing && !reduced && ch.pointer.length) {
    let wp = ch.pointer[0];
    for (const w of ch.pointer) if (liveProgress >= w.p - 0.28) wp = w;
    ptr = {
      x: wp.x,
      y: wp.y,
      click: !!wp.click && Math.abs(liveProgress - wp.p) < 0.06,
      show: true,
    };
  }

  const pct = Math.round((elapsed / TOTAL) * 100);
  const note = tryMode ? t.tryIt.notes[tryMode] : t.tryIt.notes.idle;

  return (
    <div className="tour-root">
      <style>{TOUR_CSS}</style>

      {/* Hidden audio clips — driven exclusively by the media rig above. */}
      <audio
        ref={coachRef}
        src={`/tour/coach-${es ? "es" : "en"}.m4a`}
        preload="auto"
        onError={() => setCoachClipOk(false)}
      />
      <audio ref={narrRef} src={LEARN_AUDIO_SRC} preload="auto" />

      <div className="tour-wrap">
        <header className="tour-top">
          <div className="tour-brand">
            <span className="tour-mark" aria-hidden>
              <ShieldCheck className="h-4 w-4" strokeWidth={2} />
            </span>
            <b>{PRODUCT_NAME}</b>
            <span className="tour-eyebrow-inline">· guided tour</span>
          </div>
          <Link to="/judges" className="tour-backlink">
            The full write-up →
          </Link>
        </header>

        <section className="tour-hero">
          <p className="tour-eyebrow">For the judges · a guided replay</p>
          <h1 className="tour-hero-h">Safety is the first feature, not the last.</h1>
          <p className="tour-hero-p">
            {PRODUCT_NAME} helps an adult survivor of trafficking prepare for court — emotionally
            and practically — without ever being coached, recorded, or asked to disclose. Press
            play, or step through it yourself. The phone is fully bilingual — try the globe.
          </p>
        </section>

        <section className="tour-grid" aria-label="Product walkthrough">
          <div className="tour-narr">
            <p className="tour-now-label">Now happening</p>
            <h2 className="tour-now-title" aria-live="polite">
              {ch.title}
            </h2>
            <p className="tour-now-desc" aria-live="polite">
              {ch.desc}
            </p>

            <ol className="tour-rail">
              {CHAPTERS.map((c, i) => {
                const barW = i < active ? 100 : i > active ? 0 : Math.round(shown * 100);
                return (
                  <li key={c.n} className={i === active ? "active" : ""}>
                    <button type="button" onClick={() => jumpTo(i)}>
                      <span className="n">{c.n}</span>
                      <span className="lab">
                        {c.label}
                        <span className="bar">
                          <i style={{ width: barW + "%" }} />
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>

            <div className="tour-controls">
              {playing ? (
                <button type="button" className="primary" onClick={pause}>
                  <Pause className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} /> Pause
                </button>
              ) : (
                <button type="button" className="primary" onClick={play}>
                  <Play className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} />
                  {elapsed >= TOTAL ? "Replay" : elapsed > 0 ? "Resume" : "Play the walkthrough"}
                </button>
              )}
              <span className="tour-controls-meta">
                <button type="button" onClick={restart} aria-label="Restart">
                  <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} /> Restart
                </button>
                <span className="pct">{pct}%</span>
              </span>
            </div>
            {reduced ? (
              <p className="tour-rm">
                Motion is off, honoring your setting. Step through with the chapters above — each
                holds on its final frame, and clips stay silent.
              </p>
            ) : null}
          </div>

          <div className="tour-phonewrap">
            <div className="tour-phone" ref={phoneRef}>
              <div className="tour-screen">
                <div className="tour-appbar">
                  <span className="tour-home" aria-hidden>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 10.5 12 4l9 6.5" />
                      <path d="M5 9.5V20h14V9.5" />
                    </svg>
                  </span>
                  <span className="tour-safety">
                    <button
                      type="button"
                      className="tour-lang"
                      aria-label="Language · Idioma"
                      aria-expanded={langOpen}
                      onClick={() => setLangOpen((o) => !o)}
                    >
                      <Globe className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                    </button>
                    <span className="leave">{t.phone.leaveNow}</span>
                    <span>{t.phone.iNeedABreak}</span>
                  </span>
                </div>

                {langOpen ? (
                  <div className="tour-langmenu" role="menu">
                    <button type="button" role="menuitem" onClick={() => setLang(false)}>
                      <span>English</span>
                      {!es && <Check className="h-3 w-3" strokeWidth={2} aria-hidden />}
                    </button>
                    <button type="button" role="menuitem" onClick={() => setLang(true)}>
                      <span>Español</span>
                      {es && <Check className="h-3 w-3" strokeWidth={2} aria-hidden />}
                    </button>
                    <div className="tour-langmenu-label">Coming soon · Próximamente</div>
                    {COMING_SOON_LANGUAGES.map((name) => (
                      <button key={name} type="button" disabled>
                        <span>{name}</span>
                      </button>
                    ))}
                  </div>
                ) : null}

                <div className="tour-body">
                  <Stage
                    index={active}
                    p={shown}
                    t={t}
                    narrating={narrating}
                    videoRef={(el) => (videoRef.current = el)}
                    avatarClipOk={avatarClipOk}
                    videoReady={videoReady}
                    onVideoReady={() => setVideoReady(true)}
                    onVideoError={() => setAvatarClipOk(false)}
                  />
                </div>

                {tryMode === "stop" ? (
                  <div className="tour-overlay">
                    <div className="tour-h1" style={{ margin: "0 0 8px" }}>
                      {t.halt.title}
                    </div>
                    <p className="tour-p sm">{t.halt.body}</p>
                    <p className="tour-mut">{t.ch3.breath}</p>
                  </div>
                ) : null}

                {tryMode === "breather" ? (
                  <div className="tour-overlay">
                    <div className="tour-h2" style={{ margin: "0 0 4px" }}>
                      {t.breakScreen.title}
                    </div>
                    <p className="tour-p sm" style={{ marginBottom: 14 }}>
                      {t.breakScreen.body}
                    </p>
                    <div className="tour-breathwrap" aria-hidden>
                      <span className={"tour-breath" + (reduced ? "" : " anim")} />
                    </div>
                    <p className="tour-mut" style={{ textAlign: "center", margin: "12px 0 14px" }}>
                      {t.breakScreen.breath}
                    </p>
                    <div className="tour-card">
                      <div className="tour-mut lbl" style={{ marginTop: 0 }}>
                        {t.breakScreen.carePlanTitle}
                      </div>
                      <div className="tour-stack" style={{ fontSize: 12.5 }}>
                        <span>{t.breakScreen.person}</span>
                        <span>{t.breakScreen.calming}</span>
                      </div>
                    </div>
                  </div>
                ) : null}

                {tryMode === "helper" ? (
                  <div className="tour-helper">
                    <div className="tour-helper-sheet">
                      <div className="tour-helper-head">
                        <span className="tour-helper-ic" aria-hidden>
                          <HelpCircle className="h-3.5 w-3.5" strokeWidth={2} />
                        </span>
                        {t.helper.title}
                      </div>
                      <p className="tour-mut" style={{ margin: "0 0 10px" }}>
                        {t.helper.intro}
                      </p>
                      <div className="tour-helper-q">{t.helper.q}</div>
                      <div className="tour-helper-a">
                        <p>{t.helper.a}</p>
                        <button type="button" className="tour-btn sm" tabIndex={-1}>
                          {t.helper.navGo} → {t.helper.navLabel}
                        </button>
                      </div>
                      <p className="tour-helper-foot">{t.helper.notSaved}</p>
                    </div>
                  </div>
                ) : null}

                {tryMode === "leave" ? (
                  <div className="tour-weather">
                    <div className="wtop">
                      <span>National Weather Service</span>
                      <span>weather.gov</span>
                    </div>
                    <div className="wbody">
                      <div className="wsub">Arlington, VA · Now</div>
                      <div className="wtemp">54°F</div>
                      <div className="wsub" style={{ marginBottom: 12 }}>
                        Partly Cloudy
                      </div>
                      <div className="wrow">
                        <span>Humidity</span>
                        <span>61%</span>
                      </div>
                      <div className="wrow">
                        <span>Wind</span>
                        <span>7 mph NW</span>
                      </div>
                      <div className="wrow">
                        <span>Tonight</span>
                        <span>48°F · Clear</span>
                      </div>
                    </div>
                  </div>
                ) : null}

                {ptr.show ? (
                  <span
                    className={"tour-pointer" + (ptr.click ? " click" : "")}
                    style={{ left: ptr.x * 100 + "%", top: ptr.y * 100 + "%" }}
                    aria-hidden
                  >
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="#fff"
                      stroke="#12100d"
                      strokeWidth="1.4"
                      strokeLinejoin="round"
                    >
                      <path d="M5 3l6 15 2.2-6.2L19 9.5z" />
                    </svg>
                  </span>
                ) : null}
              </div>
            </div>

            <div className="tour-tryit" aria-label={t.tryIt.rowLabel}>
              <button type="button" onClick={() => runTry("leave")}>
                <LogOut className="h-3.5 w-3.5" strokeWidth={2} /> {t.tryIt.leave}
              </button>
              <button type="button" onClick={() => runTry("stop")}>
                <Square className="h-3.5 w-3.5" strokeWidth={2} /> {t.tryIt.stop}
              </button>
              <button type="button" onClick={() => runTry("breather")}>
                <Wind className="h-3.5 w-3.5" strokeWidth={2} /> {t.tryIt.breather}
              </button>
              <button type="button" onClick={() => runTry("helper")}>
                <HelpCircle className="h-3.5 w-3.5" strokeWidth={2} /> {t.tryIt.helper}
              </button>
            </div>
            <p className="tour-replay-note" aria-live="polite">
              {note}
            </p>
          </div>
        </section>

        <section className="tour-pillars">
          <h2 className="tour-pillars-h">Four promises, built in — not bolted on.</h2>
          <p className="tour-pillars-lede">
            Everything above is real behavior in the shipped app. Here is what each moment is
            standing on.
          </p>
          <div className="tour-pgrid">
            {PILLARS.map((p) => (
              <div key={p.t} className="tour-pcard paper-shadow">
                <span className="tour-pic" aria-hidden>
                  <p.Icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <h3>{p.t}</h3>
                <p>{p.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="tour-close">
          <div className="tour-closecard paper-shadow">
            <p className="tour-eyebrow">{PRODUCT_NAME}</p>
            <blockquote>
              The right information, easier to find — while control stays with the survivor.
            </blockquote>
            <div className="tour-close-actions">
              <Link to="/" className="tour-cta">
                Open the live app →
              </Link>
              <Link to="/judges" className="tour-cta ghost">
                Read the full write-up
              </Link>
            </div>
          </div>
          <p className="tour-foot">
            Built for the UN Human Rights &amp; IBM Call for Code review. A guided replay — not the
            live application. Voices and clips are replays of the product’s own media, playing only
            while you press Play.
          </p>
        </section>
      </div>
    </div>
  );
}

// Bespoke visuals for this one showcase route. Scoped by the `tour-` prefix and
// wired to the app's own tokens (--background, --primary, --card, …) so the
// mockups stay faithful. Kept out of the global stylesheet on purpose.
const TOUR_CSS = `
.tour-root { min-height: 100vh; background: var(--background); }
.tour-wrap { max-width: 1120px; margin: 0 auto; padding: 0 20px; }
.tour-root p { max-width: none; }

.tour-top { display: flex; align-items: center; justify-content: space-between; padding: 20px 0; }
.tour-brand { display: flex; align-items: center; gap: 9px; font-size: 15px; }
.tour-brand b { font-weight: 600; }
.tour-mark { width: 30px; height: 30px; border-radius: 9px; display: grid; place-items: center;
  background: oklch(0.92 0.05 150); color: oklch(0.36 0.07 150); }
.tour-eyebrow-inline { color: var(--muted-foreground); font-size: 13px; }
.tour-backlink { font-size: 13px; color: var(--muted-foreground); text-decoration: none; }
.tour-backlink:hover { color: var(--foreground); }

.tour-hero { padding: 22px 0 26px; max-width: 720px; }
.tour-eyebrow { text-transform: uppercase; letter-spacing: 0.16em; font-size: 11.5px;
  color: oklch(0.5 0.06 150); font-weight: 600; margin: 0 0 14px; }
.tour-hero-h { font-size: clamp(28px, 5vw, 46px); line-height: 1.1; margin: 0 0 16px;
  letter-spacing: -0.01em; text-wrap: balance; }
.tour-hero-p { font-size: clamp(15px, 1.9vw, 17.5px); color: var(--muted-foreground); max-width: 60ch; margin: 0; line-height: 1.6; }

.tour-grid { display: grid; grid-template-columns: minmax(0, 310px) minmax(0, 1fr); gap: clamp(22px, 4vw, 52px); align-items: start; padding: 6px 0 34px; }
@media (max-width: 840px) { .tour-grid { grid-template-columns: 1fr; } }

.tour-now-label { text-transform: uppercase; letter-spacing: 0.15em; font-size: 11px; color: var(--muted-foreground); margin: 0 0 9px; }
.tour-now-title { font-size: clamp(20px, 3vw, 25px); line-height: 1.2; margin: 0 0 9px; text-wrap: balance; }
.tour-now-desc { color: var(--muted-foreground); font-size: 14.5px; margin: 0 0 20px; min-height: 68px; line-height: 1.55; max-width: 42ch; }

.tour-rail { list-style: none; margin: 0 0 20px; padding: 0; display: flex; flex-direction: column; gap: 2px; }
.tour-rail button { width: 100%; text-align: left; border: none; background: transparent; cursor: pointer;
  padding: 8px 12px 8px 15px; border-radius: 11px; color: var(--muted-foreground); font: inherit; font-size: 13.5px;
  display: flex; gap: 10px; align-items: baseline; position: relative; }
.tour-rail button .n { font-size: 11.5px; width: 16px; flex: none; font-variant-numeric: tabular-nums; }
.tour-rail button .lab { flex: 1; }
.tour-rail button:hover { color: var(--foreground); background: oklch(0.62 0.04 150 / 0.09); }
.tour-rail li.active button { color: var(--foreground); background: oklch(0.62 0.04 150 / 0.13); }
.tour-rail li.active button::before { content: ""; position: absolute; left: 5px; top: 11px; bottom: 11px; width: 3px; border-radius: 3px; background: var(--primary); }
.tour-rail .bar { display: block; height: 2px; margin-top: 6px; background: oklch(0.62 0.04 150 / 0.2); border-radius: 2px; overflow: hidden; }
.tour-rail .bar i { display: block; height: 100%; background: var(--primary); }

.tour-controls { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
.tour-controls button { border: 1px solid var(--border); background: var(--card); color: var(--foreground);
  border-radius: 999px; cursor: pointer; font: inherit; font-size: 12.5px; display: inline-flex; align-items: center; gap: 6px; padding: 9px 15px; }
.tour-controls button:hover { border-color: var(--primary); }
.tour-controls .primary { background: var(--primary); color: var(--primary-foreground); border-color: var(--primary); font-weight: 600; }
.tour-controls .primary:hover { background: oklch(0.45 0.055 150); border-color: oklch(0.45 0.055 150); }
.tour-controls-meta { display: flex; align-items: center; gap: 9px; margin-left: auto; }
.tour-controls .pct { font-size: 12px; color: var(--muted-foreground); font-variant-numeric: tabular-nums; }
.tour-rm { font-size: 12.5px; color: var(--muted-foreground); margin: 13px 0 0; max-width: 42ch; }

.tour-phonewrap { display: flex; flex-direction: column; align-items: center; }
.tour-phone { width: 340px; max-width: 100%; aspect-ratio: 340 / 710; position: relative; border-radius: 42px; background: #17140f; padding: 11px; box-shadow: 0 2px 6px rgba(60,45,30,0.06), 0 24px 56px rgba(60,45,30,0.16), 0 48px 110px rgba(60,45,30,0.12); }
.tour-screen { position: absolute; inset: 11px; border-radius: 32px; overflow: hidden; background: var(--background); color: var(--foreground); display: flex; flex-direction: column; }
.tour-appbar { display: flex; align-items: center; justify-content: space-between; padding: 15px 16px 11px; flex: none; }
.tour-home { width: 30px; height: 30px; border-radius: 9px; display: grid; place-items: center; background: oklch(0.92 0.05 150); color: oklch(0.36 0.07 150); }
.tour-safety { display: flex; align-items: center; gap: 12px; font-size: 12.5px; color: var(--muted-foreground); }
.tour-lang { border: none; background: transparent; color: var(--muted-foreground); cursor: pointer; padding: 4px; margin: -4px; display: inline-flex; }
.tour-lang:hover { color: var(--foreground); }
.tour-langmenu { position: absolute; top: 46px; right: 12px; z-index: 8; min-width: 168px; background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 6px; box-shadow: 0 14px 34px -18px rgba(60,45,30,0.5); }
.tour-langmenu button { display: flex; align-items: center; justify-content: space-between; width: 100%; border: none; background: transparent; font: inherit; font-size: 12.5px; color: var(--foreground); padding: 8px 9px; border-radius: 8px; cursor: pointer; text-align: left; }
.tour-langmenu button:hover:not(:disabled) { background: oklch(0.62 0.04 150 / 0.12); }
.tour-langmenu button:disabled { color: var(--muted-foreground); cursor: default; }
.tour-langmenu-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted-foreground); padding: 8px 9px 4px; border-top: 1px solid var(--border); margin-top: 4px; }
.tour-body { flex: 1; overflow: hidden; padding: 4px 18px 18px; position: relative; }

.tour-h1 { font-size: 24px; font-weight: 400; letter-spacing: -0.01em; margin: 10px 0 13px; }
.tour-h2 { font-size: 18px; font-weight: 400; margin: 6px 0 10px; }
.tour-p { font-size: 14px; color: var(--foreground); margin: 0 0 13px; line-height: 1.55; }
.tour-p.sm { font-size: 13px; color: var(--muted-foreground); }
.tour-mut { font-size: 12px; color: var(--muted-foreground); }
.tour-mut.sp { margin: -2px 0 12px; }
.tour-mut.lbl { text-transform: uppercase; letter-spacing: 0.08em; font-size: 10px; margin: 10px 0 6px; }
.tour-card { background: var(--card); border-radius: 15px; padding: 13px 15px; box-shadow: 0 1px 3px rgba(60,45,30,0.05), 0 10px 22px -16px rgba(60,45,30,0.4); }
.tour-card + .tour-card, .tour-enc, .tour-btns { margin-top: 10px; }
.tour-stack { display: flex; flex-direction: column; gap: 8px; font-size: 13.5px; color: var(--foreground); }
.tour-btns { display: flex; flex-direction: column; gap: 9px; }
.tour-btns.row { flex-direction: row; margin-top: 12px; }
.tour-btn { display: block; width: 100%; text-align: center; border: none; border-radius: 11px; padding: 12px; font: inherit; font-size: 14px; background: var(--primary); color: var(--primary-foreground); font-weight: 500; cursor: default; }
.tour-btn.sm { padding: 10px; font-size: 13px; }
.tour-btn.ghost { background: transparent; color: var(--muted-foreground); border: 1px solid var(--border); }
.tour-btn.ghost.danger { color: oklch(0.5 0.09 30); border-color: oklch(0.8 0.06 30); }
.tour-list { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 12px; }
.tour-list.tight { gap: 8px; }
.tour-list li { display: flex; gap: 9px; font-size: 13px; color: var(--foreground); line-height: 1.5; }
.tour-list.tight li { font-size: 12px; color: var(--muted-foreground); }
.tour-list li .dot { color: oklch(0.72 0.03 80); }
.tour-statement { font-size: 13.5px; color: var(--foreground); line-height: 1.5; }
.tour-statement.sm { font-size: 12.5px; }
.tour-pills { display: flex; gap: 7px; flex-wrap: wrap; margin-top: 11px; }
.tour-pill { display: inline-block; font-size: 10.5px; letter-spacing: 0.08em; text-transform: uppercase; color: oklch(0.36 0.07 150); background: oklch(0.93 0.04 150); border-radius: 999px; padding: 4px 9px; }
.tour-pill.priv { color: oklch(0.46 0.02 70); background: oklch(0.92 0.02 80); }
.tour-enc { display: grid; gap: 6px; margin-top: 8px; }
.tour-tile { border-radius: 11px; padding: 8px 12px; font-size: 12px; }
.tour-tile.plain { background: var(--card); color: var(--foreground); box-shadow: inset 0 0 0 1px var(--border); }
.tour-tile.cipher { background: #24201a; color: #93b998; font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 10px; line-height: 1.5; word-break: break-all; }
.tour-tile-lbl { text-transform: uppercase; letter-spacing: 0.1em; font-size: 9px; color: var(--muted-foreground); margin-bottom: 5px; }
.tour-tile.cipher .tour-tile-lbl { color: #6d7a68; }
.tour-hot-name { font-size: 13.5px; font-weight: 600; }
.tour-hot-num { font-size: 18px; color: oklch(0.4 0.06 150); margin: 3px 0; }
.tour-receipts { margin-top: 13px; display: flex; flex-direction: column; gap: 6px; font-size: 11.5px; color: var(--muted-foreground); }

.tour-words { display: flex; flex-wrap: wrap; gap: 6px; }
.tour-words span { font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 11.5px; background: oklch(0.93 0.04 150); color: oklch(0.36 0.07 150); border-radius: 7px; padding: 3px 8px; }

.tour-session { display: flex; flex-direction: column; align-items: center; }
.tour-orb { width: 116px; height: 116px; border-radius: 50%; margin: 24px auto 14px; background: radial-gradient(circle at 38% 34%, oklch(0.78 0.05 150), oklch(0.6 0.05 150) 72%); box-shadow: 0 16px 38px -20px oklch(0.55 0.06 150 / 0.9); transition: transform 500ms ease; }
.tour-orb.small { transform: scale(0.84); }
.tour-coachrow { text-align: center; font-size: 12.5px; color: var(--muted-foreground); }
.tour-caption { text-align: center; font-size: 14px; color: var(--foreground); line-height: 1.5; min-height: 68px; padding: 16px 4px 0; max-width: none; }
.tour-caption.sm { font-size: 12.5px; min-height: 42px; padding-top: 8px; }
.tour-cursor { display: inline-block; width: 2px; height: 15px; background: var(--primary); margin-left: 1px; vertical-align: -2px; animation: tourblink 1s steps(1) infinite; }
@keyframes tourblink { 50% { opacity: 0; } }
.tour-halt-inline { margin-top: 18px; text-align: center; }

.tour-tabs { display: flex; gap: 4px; margin: 0 0 8px; border: 1px solid var(--border); border-radius: 10px; padding: 3px; font-size: 11px; color: var(--muted-foreground); }
.tour-tabs span { flex: 1; text-align: center; padding: 5px 2px; border-radius: 8px; }
.tour-tabs span.on { background: oklch(0.62 0.04 150 / 0.16); color: var(--foreground); }
.tour-row { margin-top: 8px; background: var(--card); border-radius: 12px; padding: 8px 12px; display: flex; flex-direction: column; gap: 3px; box-shadow: 0 1px 3px rgba(60,45,30,0.05); }
.tour-row-when { font-size: 11px; color: oklch(0.5 0.06 150); font-style: italic; display: inline-flex; align-items: center; gap: 5px; }
.tour-row-when.mono { font-family: ui-monospace, "SF Mono", Menlo, monospace; font-style: normal; color: var(--foreground); font-size: 11.5px; }
.tour-row-what { font-size: 12.5px; color: var(--foreground); }
.tour-row-note { font-size: 10.5px; color: var(--muted-foreground); }
.tour-draft { margin-top: 8px; display: flex; flex-direction: column; gap: 3px; border-left: 3px solid var(--primary); padding: 2px 0 2px 10px; }
.tour-draft-h { font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 10.5px; letter-spacing: 0.06em; color: var(--foreground); }

.tour-shelf { display: flex; flex-direction: column; gap: 9px; }
.tour-nb { border-radius: 12px; padding: 12px 14px 12px 20px; position: relative; box-shadow: 0 1px 3px rgba(60,45,30,0.08), 0 8px 18px -14px rgba(60,45,30,0.5); }
.tour-nb::before { content: ""; position: absolute; left: 8px; top: 8px; bottom: 8px; width: 2px; border-radius: 2px; background: rgba(0,0,0,0.12); }
.tour-nb-title { font-size: 13.5px; color: #2e2a24; }
.tour-nb-min { font-size: 10.5px; color: rgba(46,42,36,0.65); margin-top: 3px; }
.tour-nb-sage { background: oklch(0.88 0.05 150); }
.tour-nb-sand { background: oklch(0.90 0.045 82); }
.tour-nb-sky { background: oklch(0.88 0.045 230); }
.tour-nb-clay { background: oklch(0.86 0.055 45); }
.tour-nb-ochre { background: oklch(0.89 0.06 90); }
.tour-nb-lav { background: oklch(0.88 0.045 300); }
.tour-nb-moss { background: oklch(0.87 0.055 135); }
.tour-nb-stone { background: oklch(0.89 0.02 70); }
.tour-nb-rose { background: oklch(0.88 0.045 15); }
.tour-underline { text-decoration: underline; text-decoration-style: dotted; text-underline-offset: 3px; text-decoration-color: oklch(0.55 0.06 150); }
.tour-pop { margin-top: 10px; background: oklch(0.93 0.04 150); border-radius: 12px; padding: 10px 12px; font-size: 12px; color: oklch(0.3 0.05 150); display: flex; flex-direction: column; gap: 3px; }
.tour-pop b { font-weight: 600; }
.tour-listen { margin-top: 10px; display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: var(--foreground); background: var(--card); border-radius: 999px; padding: 8px 13px; box-shadow: 0 1px 3px rgba(60,45,30,0.07); }
.tour-listen-btn { width: 22px; height: 22px; border-radius: 50%; background: var(--primary); color: var(--primary-foreground); display: grid; place-items: center; flex: none; }
.tour-eq { display: inline-flex; gap: 2px; align-items: flex-end; height: 12px; margin-left: auto; }
.tour-eq i { width: 3px; height: 4px; background: oklch(0.55 0.06 150); border-radius: 2px; }
.tour-eq.on i { animation: toureq 900ms ease-in-out infinite; }
.tour-eq.on i:nth-child(2) { animation-delay: 150ms; }
.tour-eq.on i:nth-child(3) { animation-delay: 320ms; }
@keyframes toureq { 0%, 100% { height: 4px; } 50% { height: 12px; } }
@media (prefers-reduced-motion: reduce) { .tour-eq.on i { animation: none; } }

.tour-witness { display: flex; flex-direction: column; align-items: center; }
.tour-videowrap { position: relative; width: 168px; aspect-ratio: 3 / 4; }
.tour-videowrap .tour-video { position: absolute; inset: 0; width: 100%; height: 100%; }
.tour-video { width: 168px; aspect-ratio: 3 / 4; border-radius: 14px; background: #d8d2c6; object-fit: cover; box-shadow: 0 2px 5px rgba(60,45,30,0.12), 0 14px 30px -18px rgba(60,45,30,0.55); }
.tour-avatarfall { position: relative; overflow: hidden; background: linear-gradient(180deg, #ded8cc, #cfc7b8); display: block; }
.tour-avatarfall-head { position: absolute; left: 50%; top: 26%; width: 56px; height: 56px; border-radius: 50%; transform: translateX(-50%); background: oklch(0.62 0.03 70); }
.tour-avatarfall-body { position: absolute; left: 50%; bottom: -12px; width: 116px; height: 78px; border-radius: 58px 58px 0 0; transform: translateX(-50%); background: oklch(0.5 0.04 150); }
.tour-avnote { font-size: 10.5px; color: var(--muted-foreground); margin: 8px 0 0; text-align: center; max-width: 30ch; line-height: 1.45; }
.tour-timerchip { margin-top: 8px; font-size: 11px; color: var(--muted-foreground); border: 1px solid var(--border); border-radius: 999px; padding: 4px 11px; font-variant-numeric: tabular-nums; }
.tour-ptt { width: 100%; max-width: 220px; margin-top: 10px; text-align: center; }
.tour-stopchip { margin-top: 12px; font-size: 12.5px; color: var(--foreground); background: oklch(0.93 0.04 150); border-radius: 999px; padding: 6px 14px; }

.tour-overlay, .tour-weather, .tour-helper { position: absolute; inset: 0; }
.tour-overlay { background: var(--background); display: flex; flex-direction: column; justify-content: center; padding: 26px 22px; z-index: 7; }
.tour-breathwrap { display: flex; justify-content: center; }
.tour-breath { width: 92px; height: 92px; border-radius: 50%; background: oklch(0.58 0.045 150 / 0.25); display: block; }
.tour-breath.anim { animation: tourbreath 10s ease-in-out infinite; }
@keyframes tourbreath { 0%, 100% { transform: scale(1); } 40% { transform: scale(1.18); } 55% { transform: scale(1.18); } }
@media (prefers-reduced-motion: reduce) { .tour-breath.anim { animation: none; } }

.tour-helper { background: rgba(24, 20, 15, 0.28); z-index: 7; display: flex; flex-direction: column; justify-content: flex-end; }
.tour-helper-sheet { background: var(--background); border-radius: 18px 18px 0 0; padding: 14px 16px 44px; box-shadow: 0 -12px 30px -18px rgba(60,45,30,0.55); }
.tour-helper-head { display: flex; align-items: center; gap: 7px; font-size: 13.5px; color: var(--foreground); margin-bottom: 6px; }
.tour-helper-ic { width: 24px; height: 24px; border-radius: 8px; display: grid; place-items: center; background: oklch(0.92 0.05 150); color: oklch(0.36 0.07 150); }
.tour-helper-q { align-self: flex-end; margin-left: auto; width: fit-content; max-width: 85%; background: oklch(0.62 0.04 150 / 0.16); color: var(--foreground); border-radius: 12px 12px 3px 12px; padding: 8px 11px; font-size: 12.5px; margin-bottom: 8px; }
.tour-helper-a { background: var(--card); border-radius: 12px 12px 12px 3px; padding: 10px 12px; font-size: 12.5px; color: var(--foreground); line-height: 1.5; box-shadow: 0 1px 3px rgba(60,45,30,0.06); }
.tour-helper-a p { margin: 0 0 9px; }
.tour-helper-a .tour-btn { width: auto; display: inline-block; padding: 8px 12px; font-size: 12px; }
.tour-helper-foot { font-size: 10.5px; color: var(--muted-foreground); margin: 9px 0 0; }

.tour-weather { background: #f4f6f8; color: #14315e; display: flex; flex-direction: column; font-family: Arial, sans-serif; z-index: 7; }
.tour-weather .wtop { background: #0b3d75; color: #fff; padding: 12px 16px; font-size: 13px; display: flex; justify-content: space-between; }
.tour-weather .wbody { padding: 20px 16px; }
.tour-weather .wsub { font-size: 13px; color: #33506f; }
.tour-weather .wtemp { font-size: 44px; font-weight: 700; color: #14315e; }
.tour-weather .wrow { display: flex; justify-content: space-between; font-size: 12.5px; color: #33506f; padding: 7px 0; border-bottom: 1px solid #dbe4ee; }

.tour-pointer { position: absolute; z-index: 6; pointer-events: none; margin: -2px 0 0 -2px; transition: left 700ms cubic-bezier(0.4,0.1,0.2,1), top 700ms cubic-bezier(0.4,0.1,0.2,1), opacity 300ms; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.35)); }
.tour-pointer.click::after { content: ""; position: absolute; inset: -6px; border-radius: 50%; border: 2px solid var(--primary); animation: tourtap 0.55s ease-out; }
@keyframes tourtap { from { transform: scale(0.3); opacity: 0.8; } to { transform: scale(1.6); opacity: 0; } }

.tour-rv { opacity: 0; transform: translateY(8px); transition: opacity 500ms ease, transform 500ms ease; }
.tour-rv.tour-in { opacity: 1; transform: none; }

.tour-tryit { display: flex; gap: 8px; margin-top: 18px; flex-wrap: wrap; justify-content: center; max-width: 400px; }
.tour-tryit button { border: 1px solid var(--border); background: var(--card); color: var(--foreground); border-radius: 999px; padding: 8px 13px; min-height: 44px; font: inherit; font-size: 12px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
.tour-tryit button:hover { border-color: var(--primary); }
.tour-replay-note { font-size: 11.5px; color: var(--muted-foreground); max-width: 46ch; margin: 12px auto 0; text-align: center; line-height: 1.5; min-height: 50px; }

.tour-pillars { padding: 42px 0 18px; border-top: 1px solid var(--border); margin-top: 18px; }
.tour-pillars-h { font-size: clamp(21px, 3vw, 28px); margin: 0 0 6px; letter-spacing: -0.01em; text-wrap: balance; }
.tour-pillars-lede { color: var(--muted-foreground); margin: 0 0 28px; max-width: 60ch; }
.tour-pgrid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
@media (max-width: 840px) { .tour-pgrid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 460px) { .tour-pgrid { grid-template-columns: 1fr; } }
.tour-pcard { background: var(--card); border-radius: 16px; padding: 18px 16px; }
.tour-pic { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; background: oklch(0.92 0.05 150); color: oklch(0.36 0.07 150); margin-bottom: 12px; }
.tour-pcard h3 { font-size: 15px; margin: 0 0 6px; font-weight: 600; }
.tour-pcard p { font-size: 12.5px; color: var(--muted-foreground); margin: 0; line-height: 1.5; max-width: none; }

.tour-close { padding: 38px 0 54px; }
.tour-closecard { background: var(--card); border-radius: 22px; padding: clamp(26px, 5vw, 42px); text-align: center; }
.tour-closecard blockquote { font-size: clamp(18px, 2.7vw, 25px); line-height: 1.32; margin: 12px auto 0; max-width: 30ch; text-wrap: balance; }
.tour-close-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-top: 22px; }
.tour-cta { display: inline-block; background: var(--primary); color: var(--primary-foreground); border-radius: 999px; padding: 11px 22px; font-size: 13.5px; font-weight: 600; text-decoration: none; }
.tour-cta:hover { background: oklch(0.45 0.055 150); }
.tour-cta.ghost { background: transparent; color: var(--foreground); border: 1px solid var(--border); font-weight: 500; }
.tour-cta.ghost:hover { border-color: var(--primary); background: transparent; }
.tour-foot { text-align: center; font-size: 12px; color: var(--muted-foreground); margin: 22px auto 0; max-width: 60ch; }
`;
