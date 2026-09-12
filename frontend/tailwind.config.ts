import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Visual system tokens from SKILL.md — reused from Phase 5 onward
        // for the sidebar, hero, and CTA components. These are reasonable
        // starting hexes; swap them if Zee has exact brand values.
        navy: {
          DEFAULT: "#0B1F3A",
          light: "#12305C",
        },
        gold: {
          DEFAULT: "#D4AF37",
          light: "#E8CE7B",
        },
        offwhite: "#FAF9F6",
      },
    },
  },
  plugins: [],
};

export default config;
