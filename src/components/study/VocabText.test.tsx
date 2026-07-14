// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { VocabText } from "./VocabText";

const vocab = [{ term: "plea", meaning: "An answer to the charges." }];

describe("VocabText", () => {
  it("turns [[term]] marks into tappable words with definitions", () => {
    render(<VocabText text="Enter a [[plea]] here." vocab={vocab} />);
    const word = screen.getByRole("button", { name: "plea" });
    expect(word).toBeInTheDocument();
    fireEvent.click(word);
    expect(screen.getByText(/An answer to the charges./)).toBeInTheDocument();
  });

  it("renders plain text untouched, and unknown marks as plain words", () => {
    render(<VocabText text="No marks here. An [[oath]] is unknown." vocab={vocab} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("oath")).toBeInTheDocument();
    expect(screen.getByText(/No marks here/)).toBeInTheDocument();
  });
});
