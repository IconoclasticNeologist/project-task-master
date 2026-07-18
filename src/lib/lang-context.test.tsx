// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

// The provider write-through must never make tests (or the tour) need a live
// server — mock the sync module and assert the calls instead.
const syncMock = vi.fn().mockResolvedValue(undefined);
const serverLanguageMock = vi.fn().mockResolvedValue(null);
vi.mock("./lang-sync", () => ({
  syncLanguageToServer: (...args: unknown[]) => syncMock(...args),
  serverLanguage: (...args: unknown[]) => serverLanguageMock(...args),
}));

import { LangProvider, useLang, useNotebooks, useStudyGuides } from "./lang-context";
import { __getCurrentLang, __setCurrentLang, copy } from "@/lib/copy";
import { copy as copyEn } from "@/lib/copy/en";

function Probe() {
  const { lang, setLang } = useLang();
  const notebooks = useNotebooks();
  const guides = useStudyGuides();
  return (
    <div>
      <span data-testid="lang">{lang}</span>
      <span data-testid="nav-home">{copy.nav.home}</span>
      <span data-testid="counts">
        {notebooks.length}/{guides.length}
      </span>
      <button type="button" onClick={() => setLang("es")}>
        switch
      </button>
    </div>
  );
}

afterEach(() => {
  // Never leak a language into other test files.
  __setCurrentLang("en");
});

describe("LangProvider + language-aware copy proxy", () => {
  it("starts in English (matching SSR) and swaps everything on setLang", () => {
    render(
      <LangProvider>
        <Probe />
      </LangProvider>,
    );
    expect(screen.getByTestId("lang")).toHaveTextContent("en");
    expect(screen.getByTestId("nav-home")).toHaveTextContent(copyEn.nav.home);
    expect(__getCurrentLang()).toBe("en");

    fireEvent.click(screen.getByRole("button", { name: "switch" }));
    expect(screen.getByTestId("lang")).toHaveTextContent("es");
    expect(__getCurrentLang()).toBe("es");
    expect(document.documentElement.lang).toBe("es");
    // Data hooks resolve the es bundles (same shape; content parity is the
    // translation suite's job).
    expect(screen.getByTestId("counts")).toHaveTextContent("9/10");
    // The server row follows the device choice, so the voice/avatar session
    // (minted from that row) speaks the language on screen.
    expect(syncMock).toHaveBeenCalledWith("es");
  });

  it("outside a provider, defaults to English", () => {
    render(<Probe />);
    expect(screen.getByTestId("lang")).toHaveTextContent("en");
    expect(screen.getByTestId("counts")).toHaveTextContent("9/10");
  });
});
