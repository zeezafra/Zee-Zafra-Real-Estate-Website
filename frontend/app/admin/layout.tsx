import ForceLightMode from "./ForceLightMode";

// The Phase 5 attempt at this used a nested <ThemeProvider forcedTheme=
// "light">. That doesn't work: next-themes explicitly detects when it's
// already inside a ThemeProvider context and, in that case, ignores every
// prop (including forcedTheme) and just passes children through — see
// https://github.com/pacocoursey/next-themes/issues/254. So a dark-mode
// choice made on the public site (or the OS-level "system" preference on
// first visit) was silently carrying over into /admin the whole time.
//
// That's what was breaking the UI: globals.css sets `dark:bg-navy
// dark:text-offwhite` on <body>, but nothing in the admin pages themselves
// has dark: variants — they use flat "navy"/"offwhite" classes written
// assuming a light background. With the dark class active, <body> renders
// navy, and navy text/borders calibrated for that light background become
// the same color as the page behind them — invisible. Buttons with their
// own explicit background (the gold "Add Listing" pill, the red-toned
// Delete button) still showed up because their colors don't collide with
// navy; everything else effectively disappeared.
//
// Fixed two ways: force light mode by removing the `dark` class directly
// (ForceLightMode + the inline script below, since nested ThemeProvider
// can't do it), and give this subtree its own explicit light background/
// text pairing instead of depending on <body>'s conditional one — so
// admin can't go invisible like this again even if theming misfires.
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        // Covers a hard load/refresh of an /admin URL: runs before first
        // paint, same idea as next-themes' own no-flash script, just
        // scoped to this subtree instead of the whole site.
        dangerouslySetInnerHTML={{
          __html:
            "document.documentElement.classList.remove('dark');document.documentElement.style.colorScheme='light';",
        }}
      />
      <ForceLightMode />
      <div className="min-h-screen bg-offwhite text-navy">{children}</div>
    </>
  );
}
