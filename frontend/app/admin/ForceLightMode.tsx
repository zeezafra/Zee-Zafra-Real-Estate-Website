"use client";

import { useLayoutEffect } from "react";

// next-themes intentionally ignores nested <ThemeProvider> components (see
// layout.tsx for why the Phase 5 attempt at this didn't work), so admin
// can't force light mode through the theme library. This does it directly:
// strip the `dark` class from <html> while any /admin page is mounted, and
// hand it back on the way out so the public site keeps whatever theme the
// visitor picked.
//
// useLayoutEffect (not useEffect) so this runs synchronously before the
// browser paints — needed for the client-side-navigation case (clicking a
// Link into /admin), where the inline script in layout.tsx never executes
// because React doesn't run scripts it inserts itself.
export default function ForceLightMode() {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains("dark");

    root.classList.remove("dark");
    root.style.colorScheme = "light";

    return () => {
      if (wasDark) {
        root.classList.add("dark");
        root.style.colorScheme = "dark";
      } else {
        root.style.colorScheme = "light";
      }
    };
  }, []);

  return null;
}
