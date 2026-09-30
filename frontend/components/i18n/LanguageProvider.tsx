"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DICT } from "@/lib/i18n/dictionary";
import { DEFAULT_LANG, LANG_STORAGE_KEY, isLang, type Lang } from "@/lib/i18n/languages";

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  // `fallback` is the English source text. It is what gets rendered for
  // English, and for any id that has no entry for the active language yet —
  // so a missing translation degrades to English, never to a blank or a key.
  t: (id: string, fallback: string) => string;
};

const LanguageContext = createContext<LanguageContextValue>({
  lang: DEFAULT_LANG,
  setLang: () => {},
  t: (_id, fallback) => fallback,
});

// Client-side translation on purpose. Server-rendering per language would
// need the language in the URL or a cookie read in every page, which makes
// the property/area/blog pages dynamic and changes their SEO. Instead the
// server (and search engines) always get the English text, and a visitor's
// saved choice is applied right after hydration — same localStorage pattern
// as useSavedListings. Trade-off: a returning Tagalog/Cebuano visitor sees a
// brief flash of English on first paint.
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
      if (isLang(saved)) setLangState(saved);
    } catch {
      /* storage blocked — stay on English */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (id: string, fallback: string) => {
      if (lang === "en") return fallback;
      return DICT[id]?.[lang] ?? fallback;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}

// For attributes (placeholder, aria-label) where a <T> element can't go.
export function useT() {
  return useContext(LanguageContext).t;
}
