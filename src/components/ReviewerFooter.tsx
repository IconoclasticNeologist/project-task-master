import { Link } from "@tanstack/react-router";

// Quiet reviewer / judge navigation for the PUBLIC showcase surfaces (welcome,
// judges, sources, tour). Deliberately kept off survivor in-session screens — a
// "for judges" link has no place on Home, a session, or Your space. `lead` lets
// the survivor-facing welcome frame it as clearly-for-reviewers so it never
// reads as something the survivor is meant to tap.
export function ReviewerFooter({ lead }: { lead?: string }) {
  return (
    <footer className="mt-8 border-t border-border pt-5">
      <p className="mx-auto max-w-none text-center text-xs leading-relaxed text-muted-foreground">
        {lead ? <span className="text-muted-foreground/80">{lead} </span> : null}
        <Link to="/tour" className="underline underline-offset-4 hover:text-foreground">
          Interactive tour
        </Link>
        <span aria-hidden> · </span>
        <Link to="/judges" className="underline underline-offset-4 hover:text-foreground">
          For judges
        </Link>
        <span aria-hidden> · </span>
        <Link to="/sources" className="underline underline-offset-4 hover:text-foreground">
          Sources
        </Link>
      </p>
    </footer>
  );
}
