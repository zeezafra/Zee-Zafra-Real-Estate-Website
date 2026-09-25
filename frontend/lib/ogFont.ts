import { readFileSync } from "fs";
import { join } from "path";

// Explicit font for next/og's ImageResponse. Passing this skips Next's
// bundled default-font fallback entirely, which has a broken Windows path
// handler (vercel/next.js#77164) that throws ERR_INVALID_URL in dev.
// Sourced from @fontsource/inter (SIL OFL). Only weight 700 is bundled —
// add Inter-Regular.woff too if a route ever needs a visibly lighter line.
export function getOgFont() {
  const data = readFileSync(join(process.cwd(), "public/fonts/Inter-Bold.woff"));
  return {
    name: "Inter",
    data,
    weight: 700 as const,
    style: "normal" as const,
  };
}