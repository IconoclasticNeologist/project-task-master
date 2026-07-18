import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getLangPref, hasLangPref, setLangPref, type Lang } from "@/lib/lang";
import { serverLanguage, syncLanguageToServer } from "@/lib/lang-sync";
import { __setCurrentLang } from "@/lib/copy";
import { notebooks, type Notebook } from "@/lib/copy/notebooks";
import { notebooksEs } from "@/lib/copy/es/notebooks";
import { studyGuides, type StudyGuide } from "@/lib/copy/studyGuides";
import { studyGuidesEs } from "@/lib/copy/es/studyGuides";

// Client-side language state (spec: instant client swap). State starts "en"
// to match the server-rendered HTML — no hydration mismatch — then flips to
// the stored preference right after mount. Switching remounts the subtree
// (key={lang}) so every component re-reads the language-aware `copy` proxy.
const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "en",
  setLang: () => {},
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    if (hasLangPref()) {
      const saved = getLangPref();
      if (saved !== "en") {
        __setCurrentLang(saved);
        setLangState(saved);
      }
      return;
    }
    // No explicit choice on this device yet (fresh device, or re-entry after
    // recovery): adopt the language saved on the person's own row, so someone
    // who chose Spanish doesn't land back in English.
    let cancelled = false;
    void serverLanguage().then((remote) => {
      // Re-check: an explicit pick made while this was in flight always wins.
      if (cancelled || !remote || hasLangPref()) return;
      // Persist 'en' too — otherwise this lookup re-runs on every load forever.
      setLangPref(remote);
      if (remote !== "es") return;
      __setCurrentLang(remote);
      setLangState(remote);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setLang = (l: Lang) => {
    // Order matters: the proxy must resolve the new bundle before React
    // re-renders the remounted tree.
    __setCurrentLang(l);
    setLangPref(l);
    setLangState(l);
    // The server copy follows the device choice (fire-and-forget: switching
    // must work signed out and offline; the session mints read this row, so
    // the Coach and the practice person speak the language on screen).
    void syncLanguageToServer(l);
  };

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      <div key={lang} className="contents">
        {children}
      </div>
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}

/** The notebooks in the current language. */
export function useNotebooks(): readonly Notebook[] {
  return useLang().lang === "es" ? notebooksEs : notebooks;
}

/** The study guides in the current language. */
export function useStudyGuides(): readonly StudyGuide[] {
  return useLang().lang === "es" ? studyGuidesEs : studyGuides;
}
