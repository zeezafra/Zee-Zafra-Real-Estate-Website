// Trust & polish — language toggle. English stays the source language and
// the default; Tagalog and Cebuano are opt-in per visitor.
export type Lang = "en" | "tl" | "ceb";

export const DEFAULT_LANG: Lang = "en";
export const LANG_STORAGE_KEY = "zz-lang";

// `code` doubles as the <html lang> value (BCP-47: "ceb" is Cebuano).
export const LANGS: { code: Lang; short: string; label: string }[] = [
  { code: "en", short: "EN", label: "English" },
  { code: "tl", short: "TL", label: "Tagalog" },
  { code: "ceb", short: "CEB", label: "Cebuano" },
];

export function isLang(value: unknown): value is Lang {
  return value === "en" || value === "tl" || value === "ceb";
}
