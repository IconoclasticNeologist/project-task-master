// Public, no-auth interactive tour for hackathon judges: a guided, chaptered
// replay of the real survivor journey inside a phone frame, from FROZEN sample
// data (no account, no reads, nothing created). Adapted from the
// interactive-product-demo pattern with one deliberate change for THIS product:
// the app's rule is "nothing moves on its own," so the walkthrough is PAUSED by
// default and plays only when the judge presses Play — motion stays their choice,
// which also mirrors the product's "you set the pace." Every screen depicts only
// what the shipped app actually does (faithfulness over polish). Honors the app's
// reduce-motion / Stillness handling. The person shown is fictional.

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useReducer, useRef, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  LogOut,
  Square,
  ShieldCheck,
  Lock,
  Heart,
  Scale,
} from "lucide-react";
import { pageTitle, PRODUCT_NAME } from "@/lib/product";

export const Route = createFileRoute("/tour")({
  head: () => ({ meta: [{ title: pageTitle("Interactive tour") }] }),
  component: TourScreen,
});

// Fictional sample data — the same case the in-app demo seed uses.
const STATEMENT =
  "I wasn’t allowed to keep my own papers. He held my passport and told me I’d be in trouble with the police if I didn’t have it.";
const CIPHER =
  "wcBMA0f2b3c9x1lkAQ/+Ln7Ke2r8Ym4Vt1pQ0sZ9Jc3Rd8hFb2gKpWm5oXaTq0nP4vH1sLd7yQf0aB9cE6iR3kZ2xM8wN5tU7bV4oG1pS6rC3jD0eH8fA9lK2mB7q";

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
    desc: "No account, no email, no legal name — an anonymous sign-in, minimal by design. A stolen database reveals ciphertext, not a person.",
    dur: 9000,
    pointer: [{ p: 0.78, x: 0.5, y: 0.84, click: true }],
  },
  {
    n: "03",
    label: "A voice that steadies",
    title: "It explains court. It never tells her what to say.",
    desc: "Talk or type — every word the coach speaks now appears as text. Say “stop” and everything halts in code, before the model can answer.",
    dur: 12500,
    pointer: [],
  },
  {
    n: "04",
    label: "Her words, her locks",
    title: "Encrypted before they are ever stored.",
    desc: "She marks each thing private or shareable. Documents are locked on her own device first — even the filename is encrypted.",
    dur: 10500,
    pointer: [{ p: 0.42, x: 0.42, y: 0.45, click: true }],
  },
  {
    n: "05",
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
    n: "06",
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

/** The phone screen contents for one chapter, driven by 0→1 progress. */
function Stage({ index, p }: { index: number; p: number }) {
  switch (index) {
    case 0:
      return (
        <>
          <h1 className="tour-h1">{PRODUCT_NAME}.</h1>
          <p className="tour-p">A quiet place. You set the pace. You can stop at any time.</p>
          <div className={"tour-card " + revealed(p, 0.15)}>
            <div className="tour-stack">
              <span>You can talk or type.</span>
              <span>You choose what to save.</span>
              <span>Your words belong to you.</span>
            </div>
          </div>
          <div className="tour-btns">
            <button type="button" className={"tour-btn " + revealed(p, 0.4)} tabIndex={-1}>
              Begin
            </button>
            <button type="button" className={"tour-btn ghost " + revealed(p, 0.5)} tabIndex={-1}>
              I have a code from someone helping me
            </button>
          </div>
        </>
      );
    case 1:
      return (
        <>
          <h2 className="tour-h2">Before we start.</h2>
          <p className="tour-p sm">A few small things to help keep you safe.</p>
          <div className="tour-card">
            <ul className="tour-list">
              <li className={revealed(p, 0.1)}>
                <span className="dot">•</span>
                <span>Try to use a device that is yours — one other people don’t check.</span>
              </li>
              <li className={revealed(p, 0.26)}>
                <span className="dot">•</span>
                <span>
                  If someone might see your screen, “Leave now” at the top leaves this page fast.
                </span>
              </li>
              <li className={revealed(p, 0.42)}>
                <span className="dot">•</span>
                <span>
                  You can use this without giving your name. Only what you choose to keep is saved —
                  nothing else.
                </span>
              </li>
            </ul>
          </div>
          <button type="button" className={"tour-btn " + revealed(p, 0.68)} tabIndex={-1}>
            I understand — begin
          </button>
        </>
      );
    case 2: {
      const full =
        "A courtroom has a judge’s bench, a witness stand, and tables for each side. People speak one at a time — you answer only what you’re asked.";
      const t = clamp((p - 0.08) / 0.54, 0, 1);
      const shown = full.slice(0, Math.ceil(full.length * t));
      const halted = p >= 0.72;
      return (
        <div className="tour-session">
          <div className={"tour-orb" + (halted ? " small" : "")} />
          <div className="tour-coachrow">Your Coach is with you.</div>
          <div className="tour-caption">
            {halted ? "" : shown}
            {!halted && t < 1 ? <span className="tour-cursor" /> : null}
          </div>
          {halted ? (
            <div className="tour-halt-inline">
              <div className="tour-h2" style={{ margin: "0 0 6px" }}>
                Everything is stopped.
              </div>
              <p className="tour-p sm" style={{ margin: "0 0 4px" }}>
                The practice voice is gone. Your Coach is here.
              </p>
              <p className="tour-mut">Take a breath. There is no rush.</p>
            </div>
          ) : null}
        </div>
      );
    }
    case 3:
      return (
        <>
          <h2 className="tour-h2">Your space</h2>
          <p className="tour-mut sp">You decide what is private and what is okay to share.</p>
          <div className="tour-card">
            <div className="tour-statement">{STATEMENT}</div>
            <div className="tour-pills">
              <span className="tour-pill priv">Private</span>
              <span className={"tour-pill " + revealed(p, 0.42)}>Okay to share</span>
            </div>
          </div>
          <div className={"tour-enc " + revealed(p, 0.6)}>
            <div className="tour-tile plain">
              <div className="tour-tile-lbl">What she wrote</div>
              {STATEMENT.slice(0, 54)}…
            </div>
            <div className="tour-tile cipher">
              <div className="tour-tile-lbl">What the database stores</div>
              {CIPHER}
            </div>
          </div>
        </>
      );
    case 4: {
      const revoked = p >= 0.9;
      return (
        <>
          <h2 className="tour-h2">Your team</h2>
          <div className="tour-card">
            <div className="tour-statement">A legal advocate is asking to join your team.</div>
            <div className="tour-mut lbl">They want to see</div>
            <div className="tour-pills">
              <span className="tour-pill">Court logistics</span>
              <span className="tour-pill">Shared statements</span>
            </div>
            <div className="tour-btns row">
              <button type="button" className={"tour-btn sm " + revealed(p, 0.22)} tabIndex={-1}>
                Accept
              </button>
              <button type="button" className="tour-btn ghost sm" tabIndex={-1}>
                Not now
              </button>
            </div>
          </div>
          <div className={"tour-card " + revealed(p, 0.55)}>
            <div className="tour-statement sm">
              <b>Active:</b> Jordan can see your court-plan checklist and shared statements.
            </div>
            <button
              type="button"
              className={"tour-btn ghost sm danger " + revealed(p, 0.82)}
              tabIndex={-1}
            >
              {revoked ? "Access ended ✓" : "End this access"}
            </button>
          </div>
        </>
      );
    }
    case 5:
      return (
        <>
          <h2 className="tour-h2">Support</h2>
          <div className={"tour-card " + revealed(p, 0.08)}>
            <div className="tour-hot-name">National Human Trafficking Hotline</div>
            <div className="tour-hot-num">1-888-373-7888</div>
            <div className="tour-mut">
              Every day, all day · 200+ languages · free &amp; confidential
            </div>
          </div>
          <div className={"tour-card " + revealed(p, 0.24)}>
            <div className="tour-statement sm">
              988 Suicide &amp; Crisis Lifeline · RAINN 1-800-656-4673
            </div>
          </div>
          <div className={"tour-receipts " + revealed(p, 0.5)}>
            <div className="tour-mut lbl">The receipts</div>
            <span>Crime Victims’ Rights Act — 18 U.S.C. § 3771</span>
            <span>Federal Rule of Evidence 412 (rape-shield)</span>
            <span>AG Guidelines for Victim &amp; Witness Assistance (DOJ / OVC)</span>
          </div>
        </>
      );
    default:
      return null;
  }
}

function TourScreen() {
  const elapsedRef = useRef(0);
  const stopAtRef = useRef<number | null>(null);
  const [, force] = useReducer((x: number) => x + 1, 0);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [tryMode, setTryMode] = useState<null | "leave" | "stop">(null);
  const tryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phoneRef = useRef<HTMLDivElement>(null);

  // Client-only: reduce-motion / Stillness. Read after mount to avoid an SSR mismatch.
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const off = document.documentElement.getAttribute("data-motion") === "off";
    setReduced(m.matches || off);
  }, []);

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
      force();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

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

  const runTry = (mode: "leave" | "stop") => {
    setPlaying(false);
    setTryMode(mode);
    if (tryTimer.current) clearTimeout(tryTimer.current);
    tryTimer.current = setTimeout(() => setTryMode(null), 3800);
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

  return (
    <div className="tour-root">
      <style>{TOUR_CSS}</style>

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
            play, or step through it yourself.
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
                holds on its final frame.
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
                    <span className="leave">Leave now</span>
                    <span>I need a break</span>
                  </span>
                </div>
                <div className="tour-body">
                  <Stage index={active} p={shown} />
                </div>

                {tryMode === "stop" ? (
                  <div className="tour-overlay">
                    <div className="tour-h1" style={{ margin: "0 0 8px" }}>
                      Everything is stopped.
                    </div>
                    <p className="tour-p sm">The practice voice is gone. Your Coach is here.</p>
                    <p className="tour-mut">Take a breath. There is no rush.</p>
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

            <div className="tour-tryit" aria-label="Try the safety features yourself">
              <button type="button" onClick={() => runTry("leave")}>
                <LogOut className="h-3.5 w-3.5" strokeWidth={2} /> Try “Leave now”
              </button>
              <button type="button" onClick={() => runTry("stop")}>
                <Square className="h-3.5 w-3.5" strokeWidth={2} /> Try saying “stop”
              </button>
            </div>
            <p className="tour-replay-note" aria-live="polite">
              {tryMode === "leave"
                ? "That’s the quick exit — one tap and the app is gone. On a real phone, the Back button lands on a neutral page too."
                : tryMode === "stop"
                  ? "A stop word halts everything in code — locally, before any model can respond. Sessions always route back to the calm Coach, never the practice voice."
                  : "A guided replay with fictional sample data. It never creates anything, sends anything, or touches an account — and the person shown is not real."}
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
            live application.
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
  padding: 10px 12px 10px 15px; border-radius: 11px; color: var(--muted-foreground); font: inherit; font-size: 13.5px;
  display: flex; gap: 10px; align-items: baseline; position: relative; }
.tour-rail button .n { font-size: 11.5px; opacity: 0.7; width: 16px; flex: none; font-variant-numeric: tabular-nums; }
.tour-rail button .lab { flex: 1; }
.tour-rail button:hover { color: var(--foreground); background: oklch(0.62 0.04 150 / 0.09); }
.tour-rail li.active button { color: var(--foreground); background: oklch(0.62 0.04 150 / 0.13); }
.tour-rail li.active button::before { content: ""; position: absolute; left: 5px; top: 11px; bottom: 11px; width: 3px; border-radius: 3px; background: var(--primary); }
.tour-rail .bar { display: block; height: 2px; margin-top: 7px; background: oklch(0.62 0.04 150 / 0.2); border-radius: 2px; overflow: hidden; }
.tour-rail .bar i { display: block; height: 100%; background: var(--primary); }

.tour-controls { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
.tour-controls button { border: 1px solid var(--border); background: var(--card); color: var(--foreground);
  border-radius: 999px; cursor: pointer; font: inherit; font-size: 12.5px; display: inline-flex; align-items: center; gap: 6px; padding: 9px 15px; }
.tour-controls button:hover { border-color: var(--primary); }
.tour-controls .primary { background: oklch(0.58 0.045 150); color: oklch(0.985 0.008 85); border-color: oklch(0.58 0.045 150); font-weight: 600; }
.tour-controls .primary:hover { background: oklch(0.53 0.045 150); border-color: oklch(0.53 0.045 150); }
.tour-controls-meta { display: flex; align-items: center; gap: 9px; margin-left: auto; }
.tour-controls .pct { font-size: 12px; color: var(--muted-foreground); font-variant-numeric: tabular-nums; }
.tour-rm { font-size: 12.5px; color: var(--muted-foreground); margin: 13px 0 0; max-width: 42ch; }

.tour-phonewrap { display: flex; flex-direction: column; align-items: center; }
.tour-phone { width: 340px; max-width: 100%; aspect-ratio: 340 / 710; position: relative; border-radius: 42px; background: #17140f; padding: 11px; box-shadow: 0 2px 6px rgba(60,45,30,0.06), 0 24px 56px rgba(60,45,30,0.16), 0 48px 110px rgba(60,45,30,0.12); }
.tour-screen { position: absolute; inset: 11px; border-radius: 32px; overflow: hidden; background: var(--background); color: var(--foreground); display: flex; flex-direction: column; }
.tour-appbar { display: flex; align-items: center; justify-content: space-between; padding: 15px 16px 11px; flex: none; }
.tour-home { width: 30px; height: 30px; border-radius: 9px; display: grid; place-items: center; background: oklch(0.92 0.05 150); color: oklch(0.36 0.07 150); }
.tour-safety { display: flex; gap: 14px; font-size: 12.5px; color: var(--muted-foreground); }
.tour-body { flex: 1; overflow: hidden; padding: 4px 18px 18px; position: relative; }

.tour-h1 { font-size: 24px; font-weight: 400; letter-spacing: -0.01em; margin: 10px 0 13px; }
.tour-h2 { font-size: 18px; font-weight: 400; margin: 6px 0 10px; }
.tour-p { font-size: 14px; color: var(--foreground); margin: 0 0 13px; line-height: 1.55; }
.tour-p.sm { font-size: 13px; color: var(--muted-foreground); }
.tour-mut { font-size: 12px; color: var(--muted-foreground); }
.tour-mut.sp { margin: -2px 0 12px; }
.tour-mut.lbl { text-transform: uppercase; letter-spacing: 0.08em; font-size: 10px; margin: 10px 0 6px; }
.tour-card { background: var(--card); border-radius: 15px; padding: 15px; box-shadow: 0 1px 3px rgba(60,45,30,0.05), 0 10px 22px -16px rgba(60,45,30,0.4); }
.tour-card + .tour-card, .tour-enc, .tour-btns { margin-top: 11px; }
.tour-stack { display: flex; flex-direction: column; gap: 8px; font-size: 13.5px; color: var(--foreground); }
.tour-btns { display: flex; flex-direction: column; gap: 9px; }
.tour-btns.row { flex-direction: row; margin-top: 12px; }
.tour-btn { display: block; width: 100%; text-align: center; border: none; border-radius: 11px; padding: 12px; font: inherit; font-size: 14px; background: var(--primary); color: var(--primary-foreground); font-weight: 500; cursor: default; }
.tour-btn.sm { padding: 10px; }
.tour-btn.ghost { background: transparent; color: var(--muted-foreground); border: 1px solid var(--border); }
.tour-btn.ghost.danger { color: oklch(0.5 0.09 30); border-color: oklch(0.8 0.06 30); }
.tour-list { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 12px; }
.tour-list li { display: flex; gap: 9px; font-size: 13px; color: var(--foreground); line-height: 1.5; }
.tour-list li .dot { color: oklch(0.72 0.03 80); }
.tour-statement { font-size: 13.5px; color: var(--foreground); line-height: 1.5; }
.tour-statement.sm { font-size: 12.5px; }
.tour-pills { display: flex; gap: 7px; flex-wrap: wrap; margin-top: 11px; }
.tour-pill { display: inline-block; font-size: 10.5px; letter-spacing: 0.08em; text-transform: uppercase; color: oklch(0.36 0.07 150); background: oklch(0.93 0.04 150); border-radius: 999px; padding: 4px 9px; }
.tour-pill.priv { color: oklch(0.46 0.02 70); background: oklch(0.92 0.02 80); }
.tour-enc { display: grid; gap: 8px; }
.tour-tile { border-radius: 11px; padding: 11px 12px; font-size: 12px; }
.tour-tile.plain { background: var(--card); color: var(--foreground); box-shadow: inset 0 0 0 1px var(--border); }
.tour-tile.cipher { background: #24201a; color: #93b998; font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 10.5px; line-height: 1.5; word-break: break-all; }
.tour-tile-lbl { text-transform: uppercase; letter-spacing: 0.1em; font-size: 9px; color: var(--muted-foreground); margin-bottom: 5px; }
.tour-tile.cipher .tour-tile-lbl { color: #6d7a68; }
.tour-hot-name { font-size: 13.5px; font-weight: 600; }
.tour-hot-num { font-size: 18px; color: oklch(0.4 0.06 150); margin: 3px 0; }
.tour-receipts { margin-top: 13px; display: flex; flex-direction: column; gap: 6px; font-size: 11.5px; color: var(--muted-foreground); }

.tour-session { display: flex; flex-direction: column; align-items: center; }
.tour-orb { width: 116px; height: 116px; border-radius: 50%; margin: 24px auto 14px; background: radial-gradient(circle at 38% 34%, oklch(0.78 0.05 150), oklch(0.6 0.05 150) 72%); box-shadow: 0 16px 38px -20px oklch(0.55 0.06 150 / 0.9); transition: transform 500ms ease; }
.tour-orb.small { transform: scale(0.84); }
.tour-coachrow { text-align: center; font-size: 12.5px; color: var(--muted-foreground); }
.tour-caption { text-align: center; font-size: 14px; color: var(--foreground); line-height: 1.5; min-height: 68px; padding: 16px 4px 0; max-width: none; }
.tour-cursor { display: inline-block; width: 2px; height: 15px; background: var(--primary); margin-left: 1px; vertical-align: -2px; animation: tourblink 1s steps(1) infinite; }
@keyframes tourblink { 50% { opacity: 0; } }
.tour-halt-inline { margin-top: 18px; text-align: center; }

.tour-overlay, .tour-weather { position: absolute; inset: 0; }
.tour-overlay { background: var(--background); display: flex; flex-direction: column; justify-content: center; padding: 26px 22px; }
.tour-weather { background: #f4f6f8; color: #14315e; display: flex; flex-direction: column; font-family: Arial, sans-serif; }
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

.tour-tryit { display: flex; gap: 9px; margin-top: 18px; flex-wrap: wrap; justify-content: center; }
.tour-tryit button { border: 1px solid var(--border); background: var(--card); color: var(--foreground); border-radius: 999px; padding: 8px 15px; min-height: 44px; font: inherit; font-size: 12.5px; cursor: pointer; display: inline-flex; align-items: center; gap: 7px; }
.tour-tryit button:hover { border-color: var(--primary); }
.tour-replay-note { font-size: 11.5px; color: var(--muted-foreground); max-width: 44ch; margin: 12px auto 0; text-align: center; line-height: 1.5; min-height: 34px; }

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
.tour-cta { display: inline-block; background: oklch(0.58 0.045 150); color: oklch(0.985 0.008 85); border-radius: 999px; padding: 11px 22px; font-size: 13.5px; font-weight: 600; text-decoration: none; }
.tour-cta:hover { background: oklch(0.53 0.045 150); }
.tour-cta.ghost { background: transparent; color: var(--foreground); border: 1px solid var(--border); font-weight: 500; }
.tour-cta.ghost:hover { border-color: var(--primary); background: transparent; }
.tour-foot { text-align: center; font-size: 12px; color: var(--muted-foreground); margin: 22px auto 0; max-width: 60ch; }
`;
