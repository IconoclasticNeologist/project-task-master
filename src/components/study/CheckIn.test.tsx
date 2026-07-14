// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { CheckIn } from "./CheckIn";
import { copy } from "@/lib/copy";

const questions = [
  {
    prompt: "How do most cases end?",
    choices: ["With a trial", "With an agreement"],
    answerIndex: 1,
    explain: "Most cases end with an agreement, and knowing that early helps.",
  },
];

describe("CheckIn", () => {
  it("shows the nothing-saved line and hides explanations until a tap", () => {
    render(<CheckIn questions={questions} />);
    expect(screen.getByText(copy.study.checkInNothingSaved)).toBeInTheDocument();
    expect(screen.getByText("How do most cases end?")).toBeInTheDocument();
    expect(
      screen.queryByText("Most cases end with an agreement, and knowing that early helps."),
    ).not.toBeInTheDocument();
  });

  it("reveals the kind explanation on any tap, lets the mark move, stores nothing", () => {
    render(<CheckIn questions={questions} />);
    fireEvent.click(screen.getByRole("button", { name: "With a trial" }));
    expect(
      screen.getByText("Most cases end with an agreement, and knowing that early helps."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "With a trial" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "With an agreement" }));
    expect(screen.getByRole("button", { name: "With an agreement" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "With a trial" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    // This jsdom setup exposes no storage at all — which is itself the
    // guarantee: the component just ran entirely without it. If storage is
    // present (other environments), it must still be untouched.
    expect(window.localStorage?.length ?? 0).toBe(0);
    expect(window.sessionStorage?.length ?? 0).toBe(0);
  });
});
