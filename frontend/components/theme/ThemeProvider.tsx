"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

// Same approach as the portfolio-nextjs site: attribute="class" toggles a
// `dark` class on <html>, defaultTheme="system" respects the OS preference
// on first visit, and next-themes persists the explicit choice to
// localStorage once the person picks one via ThemeToggle.
export default function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
