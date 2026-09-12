import ThemeProvider from "@/components/theme/ThemeProvider";

// The Phase 3/4 admin UI was built with fixed navy/offwhite/gold classes and
// no dark: variants. Phase 5's theme toggle sets a `dark` class on <html>
// globally, so without this, a dark-mode choice made on the public site
// would carry over into /admin and make it unreadable. Nesting a forced
// ThemeProvider here (a supported next-themes pattern) pins this subtree to
// light and restores whatever theme was active once you navigate away.
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider attribute="class" forcedTheme="light">
      {children}
    </ThemeProvider>
  );
}
