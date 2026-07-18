// Public, judge-facing sources + acknowledgements page. No auth. Cites the
// verified research the content is built on, and thanks the subject-matter
// experts (dev-curated, with photos). Deliberately calm and credible.

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase/client";
import { ReviewerFooter } from "@/components/ReviewerFooter";
import { pageTitle, PRODUCT_NAME } from "@/lib/product";

export const Route = createFileRoute("/sources")({
  head: () => ({ meta: [{ title: pageTitle("Sources & acknowledgements") }] }),
  component: SourcesScreen,
});

interface Ack {
  id: string;
  name: string;
  role: string | null;
  bio: string | null;
  image: string | null;
}

// Verified sources the content package is built on (from the research audit).
// Grouped by kind, in the plain-language spirit of the app.
const SOURCE_GROUPS: Array<{ heading: string; items: Array<{ name: string; url: string }> }> = [
  {
    heading: "Primary law & rules",
    items: [
      {
        name: "Crime Victims' Rights Act, 18 U.S.C. § 3771 (GovInfo)",
        url: "https://www.govinfo.gov/content/pkg/USCODE-2011-title18/pdf/USCODE-2011-title18-partII-chap237-sec3771.pdf",
      },
      {
        name: "Federal Rule of Evidence 412 (Cornell LII)",
        url: "https://www.law.cornell.edu/rules/fre/rule_412",
      },
      {
        name: "Fed. R. Crim. P. 15 — Depositions (Justia)",
        url: "https://www.justia.com/criminal/docs/frcrimp/rule15/",
      },
      {
        name: "Fed. R. Crim. P. 32 — Sentencing (Justia)",
        url: "https://www.justia.com/criminal/docs/frcrimp/rule32/",
      },
      {
        name: "Rights of Victims (U.S. Dept. of Justice, ENRD)",
        url: "https://www.justice.gov/enrd/environmental-crime-victim-assistance/rights-victims",
      },
    ],
  },
  {
    heading: "Official guidance",
    items: [
      {
        name: "Attorney General Guidelines for Victim & Witness Assistance, 2022 (OVC/DOJ)",
        url: "https://ovc.ojp.gov/library/publications/attorney-general-guidelines-victim-and-witness-assistance-2022-edition",
      },
      {
        name: "Crime Victims' Rights Primer (U.S. Sentencing Commission)",
        url: "https://www.ussc.gov/sites/default/files/pdf/training/primers/2023_Primer_Crime_Victims.pdf",
      },
      {
        name: "Grand Jury — glossary (U.S. Courts)",
        url: "https://www.uscourts.gov/glossary-legal-terms/grand-jury",
      },
      {
        name: "Effective Communication — ADA guidance (ADA.gov)",
        url: "https://www.ada.gov/resources/effective-communication/",
      },
      {
        name: "Human Trafficking — Training & Technical Assistance (OVC)",
        url: "https://www.ovc.ojp.gov/program/human-trafficking/training-and-technical-assistance",
      },
    ],
  },
  {
    heading: "Trauma-informed practice & research",
    items: [
      {
        name: "Achieving Excellence: Model Standards for Serving Victims & Survivors (OVC)",
        url: "https://ovc.ojp.gov/sites/g/files/xyckuh226/files/model-standards/6/ovcttac-model-standards-508.pdf",
      },
      {
        name: "Testifying in Court about Trauma (NCTSN)",
        url: "https://www.nctsn.org/resources/testifying-court-about-trauma-how-prepare",
      },
      {
        name: "The Neuroscience of Memory: Implications for the Courtroom (PMC)",
        url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4183265/",
      },
      {
        name: "Suppression and Memory for Childhood Traumatic Events (NIJ)",
        url: "https://nij.ojp.gov/library/publications/suppression-and-memory-childhood-traumatic-events-trauma-symptoms-and-non",
      },
      {
        name: "Responding to children and adolescents who have been sexually abused (WHO)",
        url: "https://www.who.int/publications/i/item/9789241550147",
      },
      {
        name: "Trauma-Informed Investigations Field Guide (Stanford Center for Human Rights)",
        url: "https://humanrights.stanford.edu/sites/humanrights/files/media/file/2104429-trauma-informed_investigations_field_guide_web_0_0.pdf",
      },
    ],
  },
  {
    heading: "Verified national resources",
    items: [
      {
        name: "National Human Trafficking Hotline (get help)",
        url: "https://humantraffickinghotline.org/en/get-help",
      },
      { name: "Office for Victims of Crime (OVC), U.S. DOJ", url: "https://ovc.ojp.gov" },
      {
        name: "OVC Training & Technical Assistance Center (OVC TTAC)",
        url: "https://www.ovcttac.gov",
      },
    ],
  },
  {
    heading: "Study-guide research",
    items: [
      {
        name: "Justice 101 — the federal criminal process in plain language (U.S. DOJ, USAO)",
        url: "https://www.justice.gov/usao/justice-101",
      },
      {
        name: "Criminal Cases — how a case moves (U.S. Courts)",
        url: "https://www.uscourts.gov/about-federal-courts/types-cases/criminal-cases",
      },
      {
        name: "Appeals — what an appeal is and is not (U.S. Courts)",
        url: "https://www.uscourts.gov/about-federal-courts/types-cases/appeals",
      },
      {
        name: "Glossary of Legal Terms (U.S. Courts)",
        url: "https://www.uscourts.gov/glossary",
      },
      {
        name: "Federal Rule of Evidence 611 — mode of examining witnesses (Cornell LII)",
        url: "https://www.law.cornell.edu/rules/fre/rule_611",
      },
      {
        name: "National Crime Victim Law Institute (NCVLI) — victims' rights resources",
        url: "https://law.lclark.edu/centers/national_crime_victim_law_institute/",
      },
    ],
  },
];

function SourcesScreen() {
  const acks = useQuery({
    queryKey: ["public-acknowledgements"],
    queryFn: async (): Promise<Ack[]> => {
      // `acknowledgements` isn't in the generated DB types until the migration
      // is applied + types regenerated; type this public read locally.
      const client = getSupabase() as unknown as {
        from(t: string): {
          select(c: string): {
            order(
              c: string,
              o: { ascending: boolean },
            ): {
              order(
                c: string,
                o: { ascending: boolean },
              ): Promise<{ data: Ack[] | null; error: { message: string } | null }>;
            };
          };
        };
      };
      const { data, error } = await client
        .from("acknowledgements")
        .select("id, name, role, bio, image")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6 py-10">
        <header className="space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-normal tracking-tight">Sources & acknowledgements</h1>
            <Link
              to="/"
              className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Home
            </Link>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {PRODUCT_NAME} is built on verified law, official guidance, and peer-reviewed
            trauma-informed research. It is not legal advice, and it never coaches testimony — never
            scripts or shapes what anyone says. Every claim in the app traces back to a primary or
            reputable source.
          </p>
        </header>

        <section className="mt-10 space-y-4">
          <h2 className="text-lg font-normal">Acknowledgements</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            With gratitude to the subject-matter experts who reviewed and shaped this work.
          </p>
          {acks.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading acknowledgements…</p>
          ) : acks.isError ? (
            <div className="space-y-3">
              <p className="text-sm leading-relaxed text-foreground">
                Couldn’t load acknowledgements just now.
              </p>
              <button
                type="button"
                onClick={() => void acks.refetch()}
                className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Try again
              </button>
            </div>
          ) : acks.data && acks.data.length > 0 ? (
            <div className="space-y-4">
              {acks.data.map((a) => (
                <div key={a.id} className="flex gap-4">
                  {a.image ? (
                    <img
                      src={a.image}
                      alt={a.name}
                      className="paper-shadow h-16 w-16 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="paper-shadow flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-secondary text-lg text-muted-foreground">
                      {a.name.slice(0, 1)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-base text-foreground">{a.name}</p>
                    {a.role && <p className="text-sm text-muted-foreground">{a.role}</p>}
                    {a.bio && (
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{a.bio}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Acknowledgements are being added.</p>
          )}
        </section>

        <section className="mt-10 space-y-6">
          <h2 className="text-lg font-normal">Sources</h2>
          {SOURCE_GROUPS.map((group) => (
            <div key={group.heading} className="space-y-2">
              <h3 className="text-xs uppercase tracking-wide text-muted-foreground">
                {group.heading}
              </h3>
              <ul className="space-y-1.5">
                {group.items.map((s) => (
                  <li key={s.url} className="text-sm leading-relaxed">
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block py-1.5 text-foreground underline underline-offset-2 hover:text-muted-foreground"
                    >
                      {s.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <p className="mt-10 text-xs leading-relaxed text-muted-foreground">
          Jurisdiction note: primary examples reflect U.S. federal criminal practice. State and
          local rules can add rights or change how they work; the app marks jurisdiction-dependent
          content and points people to their own advocate or lawyer.
        </p>

        <ReviewerFooter />
      </div>
    </div>
  );
}
