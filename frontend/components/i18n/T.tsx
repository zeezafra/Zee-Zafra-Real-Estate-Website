"use client";

import { useLanguage } from "./LanguageProvider";

// <T id="hero.browse">Browse Properties</T>
// The English text lives in the component (so it is what the server renders
// and what search engines index); the Tagalog/Cebuano versions live in
// lib/i18n/dictionary.ts under the same id. Renders a bare fragment — no
// wrapper element — so it can drop into any existing JSX without changing
// layout or styling.
export default function T({ id, children }: { id: string; children: string }) {
  const { t } = useLanguage();
  return <>{t(id, children)}</>;
}
