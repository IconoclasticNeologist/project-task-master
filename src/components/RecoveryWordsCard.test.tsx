// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { copy } from "@/lib/copy";

const setRecoveryWords = vi.fn(async (_phrase: string) => "2026-07-14T00:00:00Z");
const clearRecoveryWords = vi.fn(async () => undefined);
const getRecoveryStatus = vi.fn(async () => null as string | null);
vi.mock("@/lib/data/recovery", () => ({
  setRecoveryWords: (p: string) => setRecoveryWords(p),
  clearRecoveryWords: () => clearRecoveryWords(),
  getRecoveryStatus: () => getRecoveryStatus(),
}));

import { RecoveryWordsCard } from "./RecoveryWordsCard";

function renderCard() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <RecoveryWordsCard />
    </QueryClientProvider>,
  );
}

describe("RecoveryWordsCard", () => {
  it("creates words: shows six once, saves only after 'I wrote them down'", async () => {
    renderCard();
    await waitFor(() => expect(screen.getByText(copy.recovery.statusNotSet)).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: copy.recovery.createCta }));
    expect(setRecoveryWords).not.toHaveBeenCalled();

    const list = await screen.findAllByRole("listitem");
    expect(list.length).toBe(6);

    fireEvent.click(screen.getByRole("button", { name: copy.recovery.confirmWrote }));
    await waitFor(() => expect(setRecoveryWords).toHaveBeenCalledTimes(1));
    const phrase = setRecoveryWords.mock.calls[0][0] as string;
    expect(phrase.split(" ").length).toBe(6);
  });

  it("when set, offers replace and a gentle two-step remove", async () => {
    getRecoveryStatus.mockResolvedValueOnce("2026-07-14T00:00:00Z");
    renderCard();
    await waitFor(() => expect(screen.getByText(copy.recovery.statusSet)).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: copy.recovery.removeCta }));
    expect(clearRecoveryWords).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: copy.recovery.removeYes }));
    await waitFor(() => expect(clearRecoveryWords).toHaveBeenCalledTimes(1));
  });
});
