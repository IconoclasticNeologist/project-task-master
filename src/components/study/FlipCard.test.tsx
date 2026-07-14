// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { FlipCard } from "./FlipCard";

describe("FlipCard", () => {
  it("shows the saying first, the meaning only after a tap, and flips back", () => {
    render(<FlipCard text="A calm saying." meaning="What it can mean." />);
    const card = screen.getByRole("button");
    expect(screen.getByText(/A calm saying./)).toBeInTheDocument();
    expect(screen.queryByText("What it can mean.")).not.toBeInTheDocument();
    expect(card).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(card);
    expect(screen.getByText("What it can mean.")).toBeInTheDocument();
    expect(card).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(card);
    expect(screen.queryByText("What it can mean.")).not.toBeInTheDocument();
    expect(card).toHaveAttribute("aria-expanded", "false");
  });
});
