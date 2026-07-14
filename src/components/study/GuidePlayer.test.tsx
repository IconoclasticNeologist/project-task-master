// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { studyGuideBySlug } from "@/lib/copy/studyGuides";
import { copy } from "@/lib/copy";

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

import { GuideNotFound, GuidePlayerView } from "@/routes/study.$slug";

const guide01 = studyGuideBySlug("path-of-a-case")!;

describe("GuidePlayerView", () => {
  it("opens on a contents page listing every step", () => {
    render(<GuidePlayerView guide={guide01} />);
    expect(screen.getByText(copy.study.contentsTitle)).toBeInTheDocument();
    for (const s of guide01.steps) {
      expect(screen.getByRole("button", { name: new RegExp(s.title) })).toBeInTheDocument();
    }
  });

  it("jumps to a tapped step and pages with Next/Back", () => {
    render(<GuidePlayerView guide={guide01} />);
    fireEvent.click(screen.getByRole("button", { name: /How a case starts/ }));
    expect(screen.getByLabelText(`Step 2 of ${guide01.steps.length}`)).toBeInTheDocument();
    expect(screen.getByText("A report, then a decision")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: new RegExp(copy.study.nextLabel) }));
    expect(screen.getByLabelText(`Step 3 of ${guide01.steps.length}`)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: new RegExp(copy.study.prevLabel) }));
    expect(screen.getByLabelText(`Step 2 of ${guide01.steps.length}`)).toBeInTheDocument();
  });

  it("Begin starts at step 1; last step offers the way back to the shelf", () => {
    render(<GuidePlayerView guide={guide01} />);
    fireEvent.click(screen.getByRole("button", { name: copy.study.begin }));
    expect(screen.getByLabelText(`Step 1 of ${guide01.steps.length}`)).toBeInTheDocument();

    const last = guide01.steps[guide01.steps.length - 1];
    render(<GuidePlayerView guide={guide01} />);
    fireEvent.click(screen.getAllByRole("button", { name: new RegExp(last.title) })[0]);
    expect(screen.getByText(guide01.close)).toBeInTheDocument();
  });
});

describe("GuideNotFound", () => {
  it("shows the calm not-found message", () => {
    render(<GuideNotFound />);
    expect(screen.getByText(copy.study.notFound)).toBeInTheDocument();
  });
});

describe("narration", () => {
  it("shows the listen button only on steps with generated audio", () => {
    const fixture = {
      ...guide01,
      steps: [
        { ...guide01.steps[0], id: "s1", audio: true },
        { ...guide01.steps[1], id: "s2" },
      ],
    };
    render(<GuidePlayerView guide={fixture} />);
    fireEvent.click(screen.getByRole("button", { name: copy.study.begin }));
    expect(screen.getByRole("button", { name: copy.study.listen })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: new RegExp(copy.study.nextLabel) }));
    expect(screen.queryByRole("button", { name: copy.study.listen })).not.toBeInTheDocument();
  });
});
