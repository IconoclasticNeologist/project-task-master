import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { Card, CardContent } from "@/components/ui/card";
import { pageTitle } from "@/lib/product";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: pageTitle("Your privacy") }] }),
  component: PrivacyScreen,
});

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-normal text-foreground">{heading}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function PrivacyScreen() {
  return (
    <Shell>
      <div className="space-y-6 py-2">
        <header className="space-y-2">
          <h1 className="text-2xl font-normal tracking-tight">How your information is handled</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            In plain language. A lawyer is still reviewing this page; if anything here is unclear,
            that is our fault, not yours.
          </p>
        </header>

        <Card>
          <CardContent className="space-y-6 py-5">
            <Section heading="What is saved">
              <p>
                Only what you choose to add: the things you write (your statements, your timeline,
                your notes), any documents you upload, and your settings. If you do not add
                something, it is not stored.
              </p>
            </Section>

            <Section heading="How it is protected">
              <p>
                What you write is encrypted where it is stored, so a stolen copy of the database is
                unreadable. Documents are locked on your own device before they are uploaded, so the
                file itself is never stored in the clear.
              </p>
            </Section>

            <Section heading="The AI helpers">
              <p>
                When you ask for a draft, search your own words, or talk with the Coach, what you
                send is processed by an AI service to create the reply. It is used to answer you in
                the moment. We do not sell your information.
              </p>
              <p>
                The Coach conversation is spoken in the moment and is not saved as a recording by
                this app.
              </p>
            </Section>

            <Section heading="Who can see it">
              <p>
                By default, only you. An advocate or organization can never see your space unless
                you accept their request, and you can end that access at any time from{" "}
                <Link to="/team" className="underline underline-offset-2 hover:text-foreground">
                  Your team
                </Link>
                .
              </p>
            </Section>

            <Section heading="You are in control">
              <p>
                You can download a copy of everything, or delete all of it for good, from{" "}
                <Link to="/settings" className="underline underline-offset-2 hover:text-foreground">
                  Settings
                </Link>
                . Deleting cannot be undone.
              </p>
            </Section>

            <Section heading="If you are in danger">
              <p>
                This app is not an emergency service. If you are in immediate danger, the{" "}
                <Link
                  to="/resources"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  Support page
                </Link>{" "}
                has hotlines you can reach any time.
              </p>
            </Section>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
