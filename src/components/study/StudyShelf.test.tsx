// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { studyGuides } from "@/lib/copy/studyGuides";

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

describe("/study shelf", () => {
  it("shows one cover per guide with index and minutes", () => {
    render(<StudyShelf />);
    for (const g of studyGuides) {
      expect(screen.getByText(g.title)).toBeInTheDocument();
      expect(screen.getByText(g.index)).toBeInTheDocument();
    }
    expect(screen.getAllByText(/about \d+ minutes — no rush/)).toHaveLength(studyGuides.length);
  });
});
