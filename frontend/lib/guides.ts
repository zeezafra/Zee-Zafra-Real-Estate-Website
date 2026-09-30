// Trust & polish. The downloadable guides (email-gated lead magnet).
// `slug` must match a key in backend/src/lib/guides.js — the API refuses
// unknown slugs. `file` is a static PDF in public/guides/, produced by
// tools/build-guides.py (edit the content there and re-run it to update).
export type Guide = {
  slug: string;
  title: string;
  blurb: string;
  file: string;
  pages: number;
};

export const GUIDES: Guide[] = [
  {
    slug: "buying-property-in-cebu",
    title: "Buying Property in Cebu — Checklist",
    blurb:
      "From budget and viewings to title checks, closing costs, and the transfer steps. Includes a section for OFW families buying from abroad.",
    file: "/guides/buying-property-in-cebu-checklist.pdf",
    pages: 4,
  },
  {
    slug: "selling-property-in-cebu",
    title: "Selling Your Property in Cebu — Checklist",
    blurb:
      "Documents to gather, how to price it, preparing and marketing the property, offers, taxes, and closing safely.",
    file: "/guides/selling-property-in-cebu-checklist.pdf",
    pages: 4,
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
