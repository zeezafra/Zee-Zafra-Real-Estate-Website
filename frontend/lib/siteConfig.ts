// Single source of truth for the site's branding shell. Sidebar, TopNav, and
// the mobile drawer all read from here instead of duplicating literals.

// Absolute site URL — powers metadataBase, the generated OG image,
// sitemap.xml, and robots.txt (Phase 11). Set NEXT_PUBLIC_SITE_URL on
// Vercel once Zee has a domain; until then this falls back to Vercel's
// own auto-set VERCEL_URL, then to localhost for local dev.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

// Phase 20: Cloudflare Turnstile's public site key, used by
// TurnstileWidget on the three public lead forms. Read through this
// module (rather than process.env at each call site) so the "is CAPTCHA
// configured?" question has one answer everywhere. Optional by design:
// unset means the widget renders nothing and the backend skips
// verification, so the forms keep working before Zee creates the widget
// in Cloudflare. NEXT_PUBLIC_ because it's inlined into client bundles —
// that's correct here, a Turnstile SITE key is public by design; the
// SECRET key lives only in the backend's env.
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

// Phase 16: "Market Insights" added, linking to /blog — the reference
// screenshot update that added this alongside PopularAreas and a
// blog-style homepage section (both Phase 15/16, flagged rather than
// built early — see the Phase 14/15 README sections). Placed right after
// "Properties" since market insights content is most relevant to someone
// already browsing listings; unlike /sell and /saved (deliberately kept
// out of this list in earlier phases), the reference screenshot shows
// this one as a real nav item, not a secondary CTA.
export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Properties", href: "/properties" },
  { label: "Market Insights", href: "/blog" },
  { label: "About Me", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Testimonials", href: "/testimonials" },
  { label: "Contact", href: "/contact" },
];

// Instagram is still "#" — Zee hasn't supplied a profile URL for it yet.
export const SOCIAL_LINKS = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61594137604570",
    icon: "facebook" as const,
  },
  { label: "Instagram", href: "https://www.instagram.com/zeezafrarealestatelistings/", icon: "instagram" as const },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/zee-zafra-45274a345/",
    icon: "linkedin" as const,
  },
  { label: "Email", href: "mailto:zeezafraproperties@gmail.com", icon: "mail" as const },
];

// Phase 17: the floating click-to-chat button's two channels, deferred
// from Phase 10 ("Optional: WhatsApp/Messenger click-to-chat button
// alongside the [inquiry] form... additive, doesn't replace the
// DB-backed form" — see the roadmap). Same placeholder treatment as
// SOCIAL_LINKS above: "#" until Zee supplies the real values, since a
// malformed wa.me/m.me link is worse than an honest placeholder.
// wa.me needs digits only (country code first, e.g. 639171234567 for a
// PH mobile — no "+" and no leading "0"); m.me needs the Facebook Page's
// username, not a personal profile.
// messenger is still "#" — the Facebook link Zee gave
// (facebook.com/profile.php?id=...) is a personal profile, and m.me needs
// a Page *username* instead. Swap this in once he has a Facebook Page
// (or that profile gets a username) rather than pointing m.me at a
// numeric profile ID, which doesn't resolve.
export const CHAT_LINKS = {
  whatsapp: "https://wa.me/639918801873",
  messenger: "https://m.me/61594137604570", 
};

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
// Phase 9 content — About Me / Services / Testimonials / Contact. Unlike
// CATEGORIES above (safe to invent, since it's just a navigation aid), this
// is content a visitor reads as fact about Zee and his business. Anything
// that would be dishonest to guess — license/accreditation, years of
// experience, deal count, phone number, office hours — is left as an
// explicit "[Add ...]" placeholder rather than invented; swap these for the
// real values before launch. `email` reuses the same placeholder address as
// SOCIAL_LINKS above rather than guessing a different one.
//
// TESTIMONIALS gets the strongest flag of the four: the roadmap is explicit
// that this page needs Zee's own client content, not placeholder filler
// left in production. Treat the entries below as a shape to fill in with
// real quotes, not launch-ready copy — this is the one section on the site
// where shipping placeholder text would actually misrepresent something.
export const ABOUT_CONTENT = {
  intro:
    "I'm Zee Zafra, a real estate salesperson based in Cebu, helping clients buy, sell, and invest in properties that fit their lifestyle and goals.",
  bio: [
    "My journey into real estate started unexpectedly—with a sport called pickleball. During an Open Play session at GoZone in Dumlog, Talisay, I met Ma'am Merly, Sir Peter Jay, and Ma'am Moppet. What started as a simple conversation about the game, strategies, and tactics eventually turned into a conversation about work and career opportunities. As a fresh graduate looking to build my career while connecting with professionals, I learned that they were involved in real estate. Since I have always been interested in business, meeting them opened my eyes to an industry where I could combine my interest in business with my desire to build meaningful professional connections.",
    "Today, my focus is on helping clients explore real estate opportunities across Cebu, particularly in Cebu City and Talisay City. I aim to assist buyers, sellers, and investors in finding properties that fit their needs, goals, budget, and lifestyle. Whether it's a family home, an investment property, or an opportunity to explore the Cebu real estate market, my goal is to make the process easier to understand and more approachable.",
    "My working style is built around being approachable, responsive, and willing to listen. I believe real estate is not simply about presenting properties—it is about understanding what a client is actually looking for and helping them make informed decisions. I value clear communication, honest information, patience, and building relationships that go beyond a single transaction.",
  ],
  // These four are content-forward (title + description), not the numeric
  // stat shape ("5 years", "50 properties closed") this label/caption grid
  // was originally built for — Zee doesn't have those numbers yet. Renders
  // fine as 4 cards in the existing sm:grid-cols-3 layout (3 + 1), just
  // worth a layout pass in a later UI/UX phase now that it's not a stat row.
  highlights: [
    {
      label: "Cebu-Based Real Estate Services",
      caption: "Helping clients explore property opportunities across Cebu",
    },
    {
      label: "Primary Areas Served",
      caption: "Cebu City and Talisay City",
    },
    {
      label: "Property Opportunities",
      caption: "Residential, preselling, ready-for-occupancy, and investment properties",
    },
    {
      label: "Client-Focused Approach",
      caption: "Clear communication, responsive assistance, and personalized property recommendations",
    },
  ],
  // Left as placeholders — Zee doesn't have a PRC license / broker
  // affiliation yet. Don't fill these in until he has real ones.
  credentials: [
    "[Add your PRC real estate salesperson license / accreditation]",
    "[Add any broker or agency affiliation]",
    "[Add relevant certifications or training]",
  ],
};

// `href` is per-card so ServicesPage's CTA link doesn't have to guess which
// card is which. Buying and Investing still point at the general contact
// channels (Phase 9); Selling points at the dedicated /sell lead form
// (Phase 13) instead, since a seller lead needs fields (property type,
// location) the generic contact page never asks for.
export const SERVICES = [
  {
    title: "Buying",
    description:
      "Guidance from your first shortlist to closing day — house-and-lot, condo, or commercial, matched to your budget and goals.",
    bullets: [
      "Curated shortlist based on your must-haves",
      "Scheduled viewings and area walkthroughs",
      "Offer, negotiation, and paperwork support",
    ],
    icon: "search" as const,
    href: "/contact" as const,
  },
  {
    title: "Selling",
    description:
      "A clear plan to list, market, and sell your property at the right price, without the guesswork.",
    bullets: [
      "Market-based pricing guidance",
      "Professional listing photos and write-up",
      "Buyer screening and offer negotiation",
    ],
    icon: "tag" as const,
    href: "/sell" as const,
  },
  {
    title: "Investing",
    description:
      "Preselling and income-property opportunities selected for long-term appreciation and rental potential.",
    bullets: [
      "Preselling project vetting",
      "Rental yield and appreciation outlook",
      "Portfolio-minded, not one-off advice",
    ],
    icon: "trending-up" as const,
    href: "/contact" as const,
  },
];

// Trust & polish. Real client testimonials only — an empty array is the
// honest state until Zee has them, and the /testimonials page shows a
// composed empty state (with the review buttons below) rather than
// placeholder text. To add one, copy the template and fill in every field
// with what the client actually said and agreed to have published:
//
//   {
//     name: "Maria S.",                      // first name + initial is fine
//     location: "Talisay City",
//     quote: "…their own words, unedited except for typos…",
//     photo: "/images/testimonials/maria.jpg", // optional; file goes in frontend/public/images/testimonials/
//     source: "Facebook",                    // optional: "Google" | "Facebook" — where it was originally posted
//     sourceUrl: "https://www.facebook.com/…", // optional: link to the original review
//   },
//
// Get the client's OK before using their name or photo. Leave `photo` out
// and an initials avatar is drawn instead.
export type Testimonial = {
  name: string;
  location: string;
  quote: string;
  photo?: string;
  source?: "Google" | "Facebook";
  sourceUrl?: string;
};

//Where to get Testimonials
export const TESTIMONIALS: Testimonial[] = [
    { name: "Test Client", location: "Talisay City", quote: "Test quote for checking the layout." },
];

// Trust & polish. Public review destinations. Empty string = "not set up
// yet" and the matching button simply doesn't render (no dead "#" links).
//  - google:   the "write a review" link from Google Business Profile
//              (Get more reviews > Share review form), looks like
//              https://g.page/r/XXXXXXXX/review
//  - facebook: a Facebook *Page's* reviews tab, e.g.
//              https://www.facebook.com/<page-username>/reviews
//              (personal profiles can't collect reviews)
export const REVIEW_LINKS = {
  google: "",
  facebook: "https://www.facebook.com/profile.php?id=61594137604570",
};

// Trust & polish. The hero's "Watch Introduction" video. Paste a YouTube,
// Vimeo, or Facebook video/reel URL. Empty = no button is shown at all.
// (YouTube/Vimeo/Facebook play inside a pop-up; any other https link opens
// in a new tab.)
export const INTRO_VIDEO_URL = "https://www.youtube.com/watch?v=DJJos7u5qlk&list=RDMMnxMokRj0bl8&index=8";

// Trust & polish. Whether the Recently Sold / Rented cards show the closing
// price. Off by default: a sold price is the client's business, and the
// track record works without it. Flip to true if Zee and his clients are
// happy to publish figures.
export const SHOW_SOLD_PRICES = false;

export const CONTACT_INFO = {
  // Two numbers, display-only here — the /contact page's tel: link uses
  // only the first (see the primaryPhoneDigits note at that call site),
  // since a tel: href can't dial two numbers at once.
  phone: "0991 880 1873 / 0928 481 9716",
  email: "zeezafraproperties@gmail.com",
  serviceArea: "Cebu, Philippines",
  hours: "Always available — by appointment or online inquiry",
};

// UI/UX Phase 4: homepage "Why Work With Me?" section. Static, like
// CATEGORIES above — this is a pitch about working style, not a factual
// claim like ABOUT_CONTENT's credentials/highlights, so no "[Add ...]"
// placeholder treatment needed here.
export const WHY_WORK_WITH_ME = [
  {
    title: "Personalized Guidance",
    caption:
      "Every recommendation is matched to your budget, timeline, and goals — not a generic listing feed.",
    icon: "user-check" as const,
  },
  {
    title: "Local Market Knowledge",
    caption:
      "On-the-ground insight into Cebu's neighborhoods, pricing trends, and upcoming developments.",
    icon: "map-pinned" as const,
  },
  {
    title: "Property Assistance",
    caption:
      "Hands-on support through paperwork, negotiation, and closing — you're never figuring it out alone.",
    icon: "clipboard-check" as const,
  },
  {
    title: "Viewing Coordination",
    caption:
      "Viewings scheduled around you, with straight answers about every property you walk through.",
    icon: "calendar-check" as const,
  },
];

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
