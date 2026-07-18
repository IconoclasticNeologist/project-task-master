// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { studyGuides } from "@/lib/copy/studyGuides";
import { notebooks } from "@/lib/copy/notebooks";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: object) => ({ ...opts }),
  Link: ({ children, ...p }: PropsWithChildren<{ to?: string }>) => (
    <a data-to={p.to}>{children}</a>
  ),
  Outlet: () => null,
  useRouterState: ({ select }: { select: (s: unknown) => unknown }) =>
    select({ location: { pathname: "/study" } }),
}));

vi.mock("@/components/Shell", () => ({
  Shell: ({ children }: PropsWithChildren) => <div>{children}</div>,
}));

import { StudyShelf } from "@/routes/study";

describe("/study shelf (the ONE shelf — study guides + short guides)", () => {
  it("shows every study-guide cover with minutes, and every notebook cover after them", () => {
    render(<StudyShelf />);
    for (const g of studyGuides) {
      expect(screen.getByText(g.title)).toBeInTheDocument();
    }
    for (const n of notebooks) {
      expect(screen.getByText(n.title)).toBeInTheDocument();
    }
    // Minutes only on the bigger guides; notebooks are short on purpose.
    expect(screen.getAllByText(/about \d+ minutes — no rush/)).toHaveLength(studyGuides.length);
    // Index badges: both sets number from 01, so counts double up.
    expect(screen.getAllByText(studyGuides[0].index).length).toBeGreaterThanOrEqual(1);
  });
});
