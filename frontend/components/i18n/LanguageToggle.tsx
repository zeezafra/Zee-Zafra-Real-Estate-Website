"use client";

import { LANGS } from "@/lib/i18n/languages";
import { useLanguage } from "./LanguageProvider";

// EN | TL | CEB segmented control. "dark" sits on the navy sidebar, "light"
// on the mobile header (offwhite in light mode, navy in dark mode).
export default function LanguageToggle({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const { lang, setLang } = useLanguage();

  const wrap =
    variant === "dark"
      ? "border-offwhite/20 bg-white/5"
      : "border-navy/15 bg-white dark:border-offwhite/20 dark:bg-white/5";
  const idle =
    variant === "dark"
      ? "text-offwhite/60 hover:text-offwhite"
      : "text-navy/60 hover:text-navy dark:text-offwhite/60 dark:hover:text-offwhite";

  return (
    <div role="group" aria-label="Language" className={`inline-flex rounded-full border p-0.5 ${wrap}`}>
      {LANGS.map((l) => {
        const active = lang === l.code;
        return (
          <button
            key={l.code}
            type="button"
            onClick={() => setLang(l.code)}
            aria-pressed={active}
            title={l.label}
            lang={l.code}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide transition ${
              active ? "bg-gold text-navy" : idle
            }`}
          >
            {l.short}
          </button>
        );
      })}
    </div>
  );
}
