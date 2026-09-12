// Single source of truth for the site's branding shell. Sidebar, TopNav, and
// the mobile drawer all read from here instead of duplicating literals.

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Properties", href: "/properties" },
  { label: "About Me", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Testimonials", href: "/testimonials" },
  { label: "Contact", href: "/contact" },
];

// href values are placeholders — swap in Zee's real profile URLs when he
// has them (same treatment as the hero's placeholder photos below).
export const SOCIAL_LINKS = [
  { label: "Facebook", href: "#", icon: "facebook" as const },
  { label: "Instagram", href: "#", icon: "instagram" as const },
  { label: "LinkedIn", href: "#", icon: "linkedin" as const },
  { label: "Email", href: "mailto:hello@zeezafraproperties.com", icon: "mail" as const },
];

export const AGENT = {
  name: "Zee Zafra",
  role: "Real Estate Salesperson",
  tagline: "Your property. Your future.",
};

// Homepage category strip (Phase 6). Static content per the roadmap — not
// backed by the database. `icon` is a key mapped to a lucide-react component
// in CategoryStrip.tsx, same pattern as SOCIAL_LINKS above.
//
// Note: these five labels come straight from the reference screenshot, but
// only three ("Houses & Lots", "Condos", "Commercial") line up 1:1 with a
// `PropertyType` enum value from Phase 2. "Preselling" and "Investment" are
// listing attributes/purposes, not property types, so there's no honest
// `?type=` filter link for them yet. Rather than guess a mapping now, every
// card links to `/properties` unfiltered; Phase 8 (Search & Filters) is the
// right place to decide whether "Preselling"/"Investment" become real filter
// values (e.g. a schema addition) or get dropped from the strip — flagging
// for Zee to weigh in rather than deciding silently.
export const CATEGORIES = [
  {
    label: "Houses & Lots",
    caption: "Single-detached homes with land, move-in ready",
    icon: "home" as const,
  },
  {
    label: "Condos",
    caption: "Unit living in the city's most connected addresses",
    icon: "building" as const,
  },
  {
    label: "Commercial",
    caption: "Retail, office, and mixed-use spaces for your business",
    icon: "store" as const,
  },
  {
    label: "Preselling",
    caption: "Lock in tomorrow's value at today's price",
    icon: "construction" as const,
  },
  {
    label: "Investment",
    caption: "Properties built to appreciate over time",
    icon: "trending-up" as const,
  },
];
