// Public, no-auth page for hackathon judges (and anyone evaluating the project).
// Presents the safety-first design, the privacy/encryption model, the
// trauma-informed method, and the research + SME grounding — in the app's own
// calm voice. Deliberately credible, not flashy.

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  DoorOpen,
  ShieldCheck,
  Lock,
  Heart,
  Scale,
  NotebookPen,
  MonitorPlay,
  FlaskConical,
  type LucideIcon,
} from "lucide-react";
import { ReviewerFooter } from "@/components/ReviewerFooter";
import { pageTitle, PRODUCT_NAME } from "@/lib/product";
import { isDemoToolsEnabled, setDemoToolsEnabled } from "@/lib/data/demoTools";

export const Route = createFileRoute("/judges")({
  head: () => ({ meta: [{ title: pageTitle("For judges") }] }),
  component: JudgesScreen,
});

interface Pillar {
  icon: LucideIcon;
  heading: string;
  lead: string;
  points: string[];
}

const PILLARS: Pillar[] = [
  {
    icon: ShieldCheck,
    heading: "Safety is the first feature, not the last",
    lead: "The threat model includes the room the survivor is sitting in.",
    points: [
      "“Leave now” sits on every screen and instantly redirects the browser off-site — for the moment someone unsafe walks in or reaches for the phone. “I need a break” is always one tap away.",
      "No account, no identity: survivors sign in anonymously. We never ask for a name, email, or phone — only an optional nickname.",
      "A person who arrives with no advocate first gets an in-app tech-safety check — is this your own device? could someone see your screen? — before anything is created or saved.",
      "Motion is gentle by default and can be turned fully off; the device’s own reduce-motion setting is always honored. Sudden movement can dysregulate a trauma survivor.",
    ],
  },
  {
    icon: Lock,
    heading: "Their words never leave in the clear",
    lead: "A stolen database or backup reveals ciphertext — not who said what.",
    points: [
      "Everything a survivor writes — their account, their timeline, their document notes — is encrypted at rest with a key held in a separate vault, never in the database itself.",
      "Uploaded files are encrypted in the browser before they ever reach storage; even the filename is encrypted.",
      "The person decides what is private and what is “okay to share,” and can end a professional’s access at any time.",
      "A professional only ever sees what was explicitly shared, decrypted only for them, only for the categories the survivor granted — enforced server-side, per consent.",
    ],
  },
  {
    icon: Heart,
    heading: "It never coaches testimony",
    lead: "Only the person, in their own words, tells what happened.",
    points: [
      "The AI Coach and the cross-examination practice explain the process and help someone steady themselves — they never tell a survivor what to say, and never script or rehearse answers.",
      "Plain language (about a 6th-grade reading level), calm, and unhurried — no urgency words anywhere.",
      "A care plan (one safe person, one calming thing) and a stop word are always present; practice hands control back to the Coach the instant someone says stop.",
      "Hard rules sit under every AI and cannot be stripped by any prompt: never legal or clinical advice, always defer to the person’s own advocate or lawyer, and stop and surface real help at any sign of danger.",
    ],
  },
  {
    icon: Scale,
    heading: "Grounded in law, guidance, and expertise",
    lead: "Every claim traces back to a primary or reputable source.",
    points: [
      "Built on verified law and court rules, official agency guidance, and peer-reviewed trauma-informed research — each distinguished from the others.",
      "Designed for subject-matter-expert sign-off: the survivor-facing prompts and safety wording are structured so attorneys, victim advocates, and trauma-informed clinicians can review and approve them before any survivor uses them.",
      "The “process, not scripts” approach is drawn directly from that research, so the app can help without ever shaping testimony.",
    ],
  },
  {
    icon: NotebookPen,
    heading: "What a survivor can actually do",
    lead: "Practical, dignifying, and theirs to control.",
    points: [
      "Organize their own words, build a timeline of events, gather evidence, and export a draft written the way lawyers write — always framed as “a draft for your lawyer,” never a legal document.",
      "Practice being questioned in a safe space, with a stop word and a Coach who closes the session with them.",
      "Read short, plain-language guide “notebooks” — on pleas, having their own lawyer, memory, courtroom supports, and more.",
      "Reach verified national help lines at any time, without giving their name.",
    ],
  },
];

function JudgesScreen() {
  // Per-device only — flips a localStorage flag, never touches survivor data.
  // Reflect an already-on flag (build-time demo build, or a previous visit
  // that flipped it) so the button doesn't claim "off" when it's already on.
  const [demoEnabled, setDemoEnabled] = useState(false);
  useEffect(() => {
    setDemoEnabled(isDemoToolsEnabled());
  }, []);
  const enableDemoTools = () => {
    setDemoToolsEnabled(true);
    setDemoEnabled(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground [&_p]:max-w-[60ch]">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6 py-10">
        <header className="space-y-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            <DoorOpen className="h-4 w-4" strokeWidth={2} aria-hidden />
            For the judges
          </div>
          <h1 className="text-2xl font-normal tracking-tight">Project {PRODUCT_NAME}</h1>
          <p className="text-base leading-relaxed text-foreground">
            A trauma-informed, voice-first companion that helps adult survivors of human trafficking
            prepare — emotionally and practically — for criminal court.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            It is educational only: it is not legal advice, it never coaches or scripts testimony,
            and the person is always in control of what they say, what they keep private, and when
            they stop. What follows is how those promises are built into the product — not bolted
            on.
          </p>
        </header>

        <Link
          to="/tour"
          className="paper-shadow mt-8 flex items-center gap-3 rounded-lg bg-card p-4 text-foreground hover:bg-card/70"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[oklch(0.92_0.05_150)] text-[oklch(0.36_0.07_150)]">
            <MonitorPlay className="h-4 w-4" strokeWidth={2} aria-hidden />
          </span>
          <span className="flex-1">
            <span className="block text-sm">Take the interactive tour</span>
            <span className="block text-sm text-muted-foreground">
              A two-minute guided replay of the real survivor journey — and the safety behind it.
            </span>
          </span>
          <span aria-hidden className="text-muted-foreground">
            →
          </span>
        </Link>

        <section className="mt-4 rounded-lg border border-border bg-card p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[oklch(0.92_0.05_150)] text-[oklch(0.36_0.07_150)]">
              <FlaskConical className="h-4 w-4" strokeWidth={2} aria-hidden />
            </span>
            <div className="space-y-1">
              <h2 className="text-base font-normal text-foreground">Reviewer tools</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Sample data can be loaded on this device only — turning it on here never touches a
                real survivor’s account. Once it’s on, Home offers “Load an example (demo)” to fill
                the space with a fictional case.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4" aria-live="polite">
            <button
              type="button"
              onClick={enableDemoTools}
              disabled={demoEnabled}
              className="rounded-md border border-border px-4 py-2.5 text-sm text-foreground hover:bg-background disabled:cursor-default disabled:text-muted-foreground disabled:hover:bg-transparent"
            >
              {demoEnabled
                ? "Enabled — open the app, Home → “Load an example (demo)”"
                : "Enable sample data on this device"}
            </button>
            <Link
              to="/"
              className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Open the live app
            </Link>
          </div>
        </section>

        <div className="mt-10 space-y-5">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <section key={p.heading} className="paper-shadow rounded-lg bg-card p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[oklch(0.92_0.05_150)] text-[oklch(0.36_0.07_150)]">
                    <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                  </span>
                  <div className="space-y-1">
                    <h2 className="text-base font-normal text-foreground">{p.heading}</h2>
                    <p className="text-sm italic leading-relaxed text-muted-foreground">{p.lead}</p>
                  </div>
                </div>
                <ul className="mt-3 space-y-2">
                  {p.points.map((point, i) => (
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
              </section>
            );
          })}
        </div>

        <section className="mt-10 space-y-3">
          <h2 className="text-lg font-normal">See the receipts</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            The sources behind every claim, and the experts who reviewed the work, are public.
          </p>
          <Link
            to="/sources"
            className="inline-block text-sm text-foreground underline underline-offset-2 hover:text-muted-foreground"
          >
            Sources &amp; acknowledgements →
          </Link>
        </section>

        <p className="mt-10 text-xs leading-relaxed text-muted-foreground">
          Built for the UN Human Rights &amp; IBM Call for Code initiative. {PRODUCT_NAME} exists to
          protect the dignity, safety, and voice of people who have survived trafficking as they
          face one of the hardest things they may ever be asked to do.
        </p>

        <ReviewerFooter />
      </div>
    </div>
  );
}
