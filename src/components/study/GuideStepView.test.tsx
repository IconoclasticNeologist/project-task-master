// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { GuideStepView } from "./GuideStepView";
import type { StudyGuide } from "@/lib/copy/studyGuides";

const guide: StudyGuide = {
  slug: "t",
  index: "99",
  title: "T",
  cover: "c",
  tab: "t",
  color: "sand",
  minutes: 3,
  vocab: [{ term: "plea", meaning: "An answer to the charges." }],
  close: "A quiet close.",
  steps: [
    {
      id: "a",
      title: "First",
      blocks: [
        { kind: "summary", points: ["Point one.", "Point two."] },
        { kind: "card", title: "Card title", body: "Card body.", ask: "You could ask something." },
      ],
    },
  ],
};

describe("GuideStepView", () => {
  it("renders summary points, card, and ask note", () => {
    render(<GuideStepView guide={guide} step={guide.steps[0]} isLast={false} />);
    expect(screen.getByText("Point one.")).toBeInTheDocument();
    expect(screen.getByText("Card title")).toBeInTheDocument();
    expect(screen.getByText("You could ask something.")).toBeInTheDocument();
    expect(screen.queryByText("A quiet close.")).not.toBeInTheDocument();
  });

  it("appends close and vocab list on the last step", () => {
    render(<GuideStepView guide={guide} step={guide.steps[0]} isLast={true} />);
    expect(screen.getByText("A quiet close.")).toBeInTheDocument();
    expect(screen.getByText("Words from this guide")).toBeInTheDocument();
    expect(screen.getByText("plea")).toBeInTheDocument();
  });

  it("renders quote, story, and timeline blocks", () => {
    const rich: StudyGuide = {
      ...guide,
      steps: [
        {
          id: "b",
          title: "Rich",
          blocks: [
            { kind: "quote", text: "A saying.", meaning: "Its meaning." },
            { kind: "story", title: "One person's day", paragraphs: ["It began quietly."] },
            {
              kind: "timeline",
              steps: [
                { title: "First stop", body: "The beginning." },
                { title: "Second stop", body: "The middle." },
              ],
            },
          ],
        },
      ],
    };
    render(<GuideStepView guide={rich} step={rich.steps[0]} isLast={false} />);
    expect(screen.getByText(/A saying./)).toBeInTheDocument();
    expect(
      screen.getByText("A story, not a real person — to show what it can be like."),
    ).toBeInTheDocument();
    expect(screen.getByText("It began quietly.")).toBeInTheDocument();
    expect(screen.getByText("First stop")).toBeInTheDocument();
    expect(screen.getByText("Second stop")).toBeInTheDocument();
  });

  it("renders marked terms as tappable vocabulary words", () => {
    const marked: StudyGuide = {
      ...guide,
      steps: [
        {
          id: "c",
          title: "Marked",
          blocks: [{ kind: "card", title: "T", body: "Enter a [[plea]] here." }],
        },
      ],
    };
    render(<GuideStepView guide={marked} step={marked.steps[0]} isLast={false} />);
    expect(screen.getByRole("button", { name: "plea" })).toBeInTheDocument();
  });
});
