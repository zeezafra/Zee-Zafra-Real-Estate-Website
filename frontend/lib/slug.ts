// Phase 15: turns a Property's free-text `location` (e.g. "Mandalagan,
// Bacolod City") into a URL-safe slug (e.g. "mandalagan-bacolod-city") for
// /areas/[slug]. This is the one place that rule lives — every link to an
// area page and generateStaticParams() both call this instead of each
// re-deriving their own version, so they can't drift.
//
// There's no separate slug column/taxonomy backing this (the roadmap
// explicitly decided a full location taxonomy out of scope) — it's a pure
// function of whatever string is already in `location`. That means two
// distinct location strings that happen to slugify to the same value would
// collide onto one /areas/[slug] page; with today's seed data that doesn't
// happen, but it's worth knowing about if Zee's real listings ever produce
// two differently-punctuated locations that reduce to the same slug.
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
