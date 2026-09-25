# Zee Zafra Properties

Personal real estate brand site — two independently deployed apps:

- `backend/` — Node.js + Express + Prisma → PostgreSQL, deployed on Render
- `frontend/` — Next.js (App Router) + Tailwind CSS, deployed on Vercel

The frontend only ever talks to the backend through `NEXT_PUBLIC_API_URL`.
Never hardcode the Render URL into frontend code.

## Phase 1 — Foundation

Both apps exist, deploy successfully, and can talk to each other via one
`GET /api/health` route.

See `references/roadmap.md` in the skill (or ask Claude) for what Phase 2
onward adds.

## Phase 11 — Deploy Hardening, SEO & Polish

Code-level hardening delivered:

- CORS locked to an explicit `FRONTEND_ORIGIN` allow-list (comma-separate
  more than one domain) instead of a single implicit string match
- `next` pinned to `14.2.35` (patched) — this had drifted back to the
  vulnerable `14.2.5` in an uploaded zip; worth re-checking at the start of
  each phase, not just once
- `multer` bumped from `1.4.5-lts.1` to `^2.4.0` — the 1.x line has three
  known high-severity DoS CVEs (CVE-2025-47935, CVE-2025-47944,
  CVE-2025-7338) where a malformed multipart upload could crash the whole
  Node process, not just the request. No code changes needed — `.array()`
  and `memoryStorage()` are unchanged in 2.x.
- A single JSON error handler in `server.js` (404 for unmatched routes,
  plus a catch-all for anything a route didn't handle itself — a rejected
  multer upload, malformed JSON body, or an uncaught bug) so every response
  this API sends is JSON, never Express's default HTML error page
- `metadataBase`, site-wide Open Graph/Twitter defaults, a generated OG
  image (`app/opengraph-image.tsx`) and favicon (`app/icon.tsx`,
  `apple-icon.tsx`) — none of these existed before
- `app/sitemap.ts` (static pages + every `AVAILABLE` property) and
  `app/robots.ts` (disallows `/admin`, points at the sitemap)
- Baseline security headers (`X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy`) in `next.config.js` — a full CSP is deliberately
  deferred: `next-themes` injects an inline script to avoid a flash of the
  wrong theme, so a CSP here needs nonce wiring first or it silently breaks
  dark mode, and the roadmap doesn't require one
- A shared `useFocusTrap` hook, now used by both the inquiry modal and the
  mobile nav drawer, so Tab can't escape behind either overlay; both also
  return focus to whatever triggered them on close
- `npm install && next build` run clean against all of the above —
  TypeScript checks pass, every route (including the new
  `/sitemap.xml`, `/robots.txt`, `/opengraph-image`, `/icon`) generates

### Still needs a live deploy — can't be verified from a zip

- [ ] **Env var audit** — confirm on both dashboards: Render has
      `DATABASE_URL`, `FRONTEND_ORIGIN` (production domain, not localhost),
      `JWT_SECRET`, `ADMIN_EMAIL`/`ADMIN_PASSWORD`, the three `CLOUDINARY_*`
      vars; Vercel has `NEXT_PUBLIC_API_URL` (the Render URL) and
      `NEXT_PUBLIC_SITE_URL` (once a domain is assigned). Neither `.env`
      file is committed (both `.gitignore`s already cover this) — just
      confirm no secret ever got pasted into a commit message or a
      `render.yaml`/`vercel.json` value by mistake, and that
      `FRONTEND_ORIGIN` on Render is the real Vercel domain, not `*` or a
      leftover localhost value.
- [ ] **Mobile/tablet/desktop QA** — walk every page built in Phases 5–10
      at ~375px, ~768px, and ~1280px+. The `lg` (1024px) breakpoint is where
      the sidebar swaps for the mobile drawer — check right around there
      specifically, plus the property grid column count and the admin
      tables at small widths.
- [ ] **Accessibility pass** — tab through the homepage, the inquiry modal,
      and the mobile drawer keyboard-only (Tab/Shift+Tab/Escape); confirm
      focus never gets stuck, disappears, or escapes either overlay (this
      is what `useFocusTrap` fixes), and Escape closes both. Spot-check
      text/background contrast against the navy/gold/offwhite tokens in
      both light and dark mode.
- [ ] **Lighthouse** — run against the deployed homepage and one property
      detail page (Chrome DevTools → Lighthouse tab, or
      `npx lighthouse <url> --view`). Everything scriptable (image
      optimization, meta tags, security headers) is already in place;
      this catches anything that only shows up against a live network
      request (TTFB, actual image weight, etc.). Look for `<Image>` usage
      flagged — there shouldn't be any; only the admin upload previews use
      plain `<img>`, which is expected.

## Phase 12 — Listing Enhancements

- **Reference numbers** — every `Property` now has a `refNo` (a Postgres
  `SERIAL`, assigned automatically), formatted as `ZZ-0001` by
  `frontend/lib/format.ts` and shown on the property card, the detail
  page, and the admin table — for referencing a specific listing in a
  phone call or DM without reading out the full `id`.
- **Price Reduced badge** — a new optional `originalPrice` column on
  `Property`. The admin form has a "Price reduced from a higher original
  price" checkbox that reveals an Original Price field; whenever
  `originalPrice` is set and greater than the current `price`, the badge
  and a struck-through original price show automatically (card, detail
  page, admin table). This is admin-entered, not an automatic price-
  history table — a bigger feature than this phase needs.
- **Saved listings** — a heart toggle (`SaveButton`) on the property card
  and detail page, backed by `localStorage` (`frontend/lib/
  useSavedListings.ts`), no backend involved. A new `/saved` page reads
  the saved IDs and fetches each property. A heart+count icon
  (`SavedListingsLink`) in the Sidebar, TopNav, and mobile header links
  to it — deliberately not added to the six-item nav from the reference
  screenshot, since it's a utility link, not a marketing page.
- **Social share links** — `ShareButtons` on the detail page: Facebook, X,
  and WhatsApp share links, a copy-link button, and a native "Share"
  button on devices that support the Web Share API.

### Still needs a live deploy — can't be verified from a zip

- [ ] **Run the migration** — `npx prisma migrate deploy` (or `migrate
      dev` locally) against a database that already has the Phase 2 seed
      data, then confirm the two seeded listings with `originalPrice` set
      (the Talisay house and the studio condo) show the badge, and that
      every existing row got a sequential, non-null `refNo`.
- [ ] **Spot-check `/saved` with real localStorage** — save a couple of
      listings, reload the page, confirm they persist; open the site in a
      second browser/incognito window and confirm it starts empty (this
      is per-device by design, not synced to an account).
- [ ] **Share links on an actual phone** — the native Share button only
      renders where `navigator.share` exists; confirm it shows up on
      mobile Safari/Chrome and that the Facebook/X/WhatsApp links open
      correctly there and on desktop.

## Phase 13 — Seller Lead Capture

- **`Inquiry.type`** — a new `InquiryType` enum (`BUYER` / `SELLER`)
  column on `Inquiry`, defaulting to `BUYER` so every existing caller
  (nav "Inquire Now", CTA banner, per-property "Inquire Now") needs no
  change. Only the new seller form sends `SELLER` explicitly.
- **`/sell`** — a dedicated page (not a modal, unlike the buyer inquiry
  flow) with its own form: name, email/phone, property type, location,
  and optional details. Property type/location are folded into the
  existing `message` column as clearly labeled lines rather than new
  schema columns — the same "plain text until volume justifies real
  structure" call Phase 12 made for other one-off fields. Linked from
  the Services page's "Selling" card ("Get a property valuation →");
  deliberately not added to the six-item main nav, same reasoning as
  Phase 12's `/saved` link.
- **Admin inbox filtering** — `GET /api/admin/inquiries` now accepts
  `?type=BUYER|SELLER`; `/admin/inquiries` has All / Buyers / Sellers
  tabs (URL-driven, same query-string pattern as the Phase 8 properties
  filters) and a "Seller" badge on seller-type rows.

### Still needs a live deploy — can't be verified from a zip

- [ ] **Run the migration** — `npx prisma migrate deploy` against the
      same database as every earlier phase's migrations. Afterwards,
      confirm every existing `Inquiry` row now reads `type = BUYER` and
      that a fresh `/sell` submission shows up tagged `SELLER` in the
      admin inbox.
- [ ] **Submit a real seller lead end to end** — fill out `/sell` on the
      deployed site, confirm the email notification (Resend) arrives,
      and confirm the Sellers tab in `/admin/inquiries` shows it with
      the property type/location folded into the message as expected.
- [x] **Nav/CTA placement** — resolved: a quiet text link to `/sell`
      ("Thinking of selling instead? Get a free valuation →") now sits
      under the closing CTA banner's headline, alongside the existing
      Services page "Selling" card entry point. `/sell` is still
      deliberately excluded from the six-item main nav — only how people
      find it changed. See `frontend/components/site/CTABanner.tsx`.

## Phase 14 — Book a Viewing

- **`Inquiry.preferredDate` / `Inquiry.preferredTime`** — two new nullable
  `String` columns (not `DateTime`/`@db.Time`) holding the raw
  `"YYYY-MM-DD"` / `"HH:MM"` values straight from the browser's
  `<input type="date">`/`<input type="time">`, to sidestep UTC-vs-local
  off-by-one-day bugs for a feature that's a visitor's *preference*, not
  a confirmed calendar appointment. Both stay `null` for every inquiry
  except a viewing request.
- **`ViewingModal` / `BookViewingButton`** — a second, separate modal
  from `InquiryModal` (own provider, own trigger), since a viewing
  request asks for different fields (preferred date/time instead of a
  free-text message). Originally property-page-only; see "Global Book a
  Viewing entry points" below for the follow-up that added it to
  `TopNav`/`Hero`. The backend still rejects `preferredDate`/
  `preferredTime` sent without a `propertyId`.
- **Admin inbox** — no new filter tab. A viewing request is still
  `type: BUYER`; it's surfaced with a green "Viewing Requested" badge
  and a formatted "Requested viewing: `<date>` at `<time>`" line on the
  row instead (`formatPreferredDate`/`formatPreferredTime` in
  `frontend/lib/format.ts`).

### Still needs a live deploy — can't be verified from a zip

- [ ] **Run the migration** — `npx prisma migrate deploy` against the
      same database as every earlier phase's migrations. Afterwards,
      confirm existing `Inquiry` rows read `preferredDate`/
      `preferredTime` as `NULL` and a fresh viewing request stores both.
- [ ] **Book a real viewing end to end** — from a property detail page,
      click "Book a Viewing", submit a preferred date/time, and confirm
      it shows up in `/admin/inquiries` with the green badge and the
      formatted date/time line, including on the "Buyers" tab (it's
      still `type: BUYER`).
- [ ] **Sanity-check the date picker on mobile** — `<input type="date">`/
      `<input type="time">` render as native pickers that vary by OS/
      browser; confirm the flow feels right on an actual phone, not just
      desktop Chrome devtools' emulator.
- [ ] **This build session had no network access**, so `npm install` /
      `npx tsc --noEmit` / `npm run build` could **not** be run this time
      (unlike every earlier phase's session) — run them locally before
      deploying to catch anything a manual review missed.

### Fixed in a follow-up review

- **Server-side past-date validation** — `POST /api/inquiries` checked
  `preferredDate`/`preferredTime` format but never rejected a *past*
  date; a direct API call or devtools tampering could bypass the
  `<input type="date">`'s client-side `min`. Now rejected server-side
  against the current date in `Asia/Manila` (see
  `todayManilaISODate()` in `backend/src/routes/inquiries.js`).
- **The `/sell` CTA banner link was re-applied.** A prior session's
  status report claimed this link had already been added to
  `CTABanner.tsx` and documented here — it was not actually present in
  either place. It's implemented now (see the Phase 13 checklist above)
  and this file reflects the real state.

### Global "Book a Viewing" entry points (per updated reference screenshot)

Zee supplied an updated reference screenshot showing `TopNav` and `Hero`
with global "Book a Viewing" and "Sell Your Property" CTAs, not just a
per-property one. This is a real change from the phase's original design
("never appears in the nav" above), made deliberately once directed:

- **`ViewingContext` is now optional** (`propertyId?`/`propertyTitle?`,
  matching `InquiryContext`'s shape) and `BookViewingButton`'s props are
  optional too. Called with props (property detail page) it behaves as
  before. Called bare (`TopNav`, `Hero`) it opens `ViewingModal` with no
  property chosen yet.
- **`ViewingModal` gained an in-modal property search** when opened
  without a locked-in property — a debounced search box over the
  existing `GET /api/properties?q=` (Phase 8's endpoint, no backend
  change needed) lets the visitor pick one before the date/time fields.
  The backend's `propertyId`-required rule for viewing requests is
  unchanged; this just moves *when* it's satisfied, from before the
  modal opens to before the form submits.
- **`TopNav`**: the single "Inquire Now" CTA is replaced with "Book a
  Viewing" (gold pill) + "Sell Your Property" (outlined pill, links to
  `/sell`), matching the reference. General inquiry access isn't gone —
  it's still on every property detail page, the CTA banner ("Get in
  Touch"), and `/contact` — just no longer duplicated in the nav.
- **`Hero`**: "Watch Introduction" (a placeholder with no video to link
  to) is replaced with an outlined "Book a Viewing" button and a
  "Sell Your Property" text link, both matching the reference.
- **Deliberately out of scope**, visible in the same reference
  screenshot but not part of this change: a "Market Insights" nav item,
  a "Popular Areas" homepage section, and a blog-style "Tips, Trends &
  Guidance" section. Those overlap Phase 15 (Neighborhood Landing Pages)
  and Phase 16 (Blog) — flagging rather than building them silently.

## Phase 15 — Neighborhood Landing Pages

- **No schema change, no migration** — unlike Phases 12–14, this phase
  reads straight off the existing `Property.location` free-text column.
  Nothing to run against the database before testing this one.
- **`GET /api/properties/areas`** — new backend endpoint, distinct
  `location` values (scoped to `AVAILABLE`) with a listing count each.
  Declared before `GET /api/properties/:id` in the route file — Express
  would otherwise swallow `/areas` as an `:id` value.
- **`frontend/lib/slug.ts`** — the one place the location→slug rule lives
  (`slugify()`); every area link and `generateStaticParams()` call it
  instead of re-deriving their own version.
- **`/areas`** — directory page, every area as a card, alphabetical.
- **`/areas/[slug]`** — one page per distinct location, statically
  generated (`generateStaticParams`), reusing `PropertyCard` for its grid.
  The backend's `location` filter is `contains`, not exact-match, so the
  page adds a defensive exact-string filter client-side after fetching.
- **`PopularAreas`** homepage section — top 6 areas by listing count,
  between `FeaturedListings` and `CTABanner`. This was flagged (not
  silently built) in the Phase 14 README as visible in Zee's updated
  reference screenshot but out of scope for that phase — it belongs here.
- **Property detail page** — the location line now links to that
  listing's `/areas/[slug]` page. `PropertyCard` was deliberately left
  alone: its location text sits inside the card's whole-card `<Link>`,
  and a nested `<a>` would be invalid HTML (same constraint Phase 12's
  `SaveButton` worked around by sitting outside that `<Link>` instead).
- **`sitemap.ts`** — added `/areas` plus one entry per area slug.
- **Known limitation, by design** — there's no location taxonomy backing
  this (the roadmap explicitly decided a full multi-city taxonomy out of
  scope), so an area is just whatever string is already in `location`.
  Two differently-punctuated locations that happen to slugify to the same
  value would collide onto one page; not an issue with today's seed data,
  worth knowing about if real listing data ever produces it.

### Still needs a live deploy — can't be verified from a zip

- [ ] **Areas actually reflect real listings** — once deployed, confirm
      `/areas` and the homepage's Popular Areas section list every
      location currently in use, and that each count matches what
      `/properties?location=...` returns for the same area.
- [ ] **Static generation picks up new locations** — `generateStaticParams`
      runs at build time; adding a listing in a brand-new location won't
      get its own `/areas/[slug]` page until the next deploy (revisit if
      this becomes a real gap — an on-demand fallback is a small change).

## Phase 16 — Blog

- **New `Post` model** — `slug` (unique, chosen at creation, not
  re-derived from `title` on every save), `title`, `excerpt`, `content`,
  `coverImage` (nullable), `published` (default `true`). No separate
  `publishedAt` — `createdAt` doubles as the display/sort date, same
  "plain data until volume justifies more structure" call this codebase
  already made for `rentPeriod` and the Phase 13 seller fields. Migration
  included, **not yet run against the live database**.
- **`GET /api/posts`** (published only) and **`GET /api/posts/:slug`**
  (published only — a draft 404s here exactly like a nonexistent slug) —
  public read routes, new `backend/src/routes/posts.js`.
- **`GET/POST/PATCH/DELETE /api/admin/posts[/:id]`** — full admin CRUD
  behind `requireAdmin`, new `backend/src/routes/adminPosts.js`. The list
  endpoint here has no `published` filter, unlike the public one — same
  "admin sees drafts too" contract the Listings dashboard already has for
  sold/non-featured properties.
- **No new upload route** — the cover image reuses the existing
  `POST /api/admin/upload` (Phase 4), sending one file instead of the
  array a property's photos use.
- **`/blog`** — directory page, every published post as a card, newest
  first.
- **`/blog/[slug]`** — real, statically generated detail route
  (`generateStaticParams`), with per-post `<title>`/description/OG image
  for shareability, matching every property detail page's Phase 7
  contract. Content is plain text with blank-line paragraph breaks
  (`whitespace-pre-line`), not markdown — no renderer dependency added
  for a one-admin blog.
- **`LatestArticles`** homepage section — latest 3 posts, between
  `PopularAreas` and `CTABanner`. Flagged (not silently built) in the
  Phase 14/15 README sections as visible in Zee's updated reference
  screenshot but out of scope until this phase.
- **`NAV_LINKS`** — added "Market Insights" → `/blog`, right after
  "Properties". Same screenshot showed this as a real nav item (unlike
  `/sell`/`/saved`, which earlier phases deliberately kept out of this
  list) — it now appears in the sidebar, the top nav, and the mobile
  drawer automatically, since all three already read from this one list.
- **`sitemap.ts`** — added `/blog` plus one entry per published post.
- **Admin**: new `/admin/posts` dashboard (own route, same reasoning
  `/admin/inquiries` got one back in Phase 10), `/admin/posts/new`,
  `/admin/posts/[id]/edit`. The edit page looks the post up through the
  admin list endpoint rather than a new `GET /api/admin/posts/:id` route
  — the list is already small enough (one admin, one blog) that finding
  by id costs nothing extra. A "Blog Posts" link was added to the
  Listings dashboard header, and "Listings"/"Inquiries" links back from
  the new Blog Posts page, so all three admin sections cross-link.
- Build verification run this session: `node --check` clean on every
  backend file; `npm install && npx tsc --noEmit && npm run build` clean
  in `frontend/` — all 24 routes generate, including `/blog`,
  `/blog/[slug]`, `/admin/posts`, `/admin/posts/new`, and
  `/admin/posts/[id]/edit`.

### Still needs a live deploy — can't be verified from a zip

- [ ] **Run the Phase 16 migration** — `npx prisma migrate deploy` against
      Render's database (creates the `Post` table). No posts exist until
      the admin writes the first one.
- [ ] **Write and publish a real post**, then confirm it shows up on
      `/blog`, the homepage's "From the Blog" section, and gets its own
      working `/blog/[slug]` page after the next deploy
      (`generateStaticParams` runs at build time, same limitation Phase
      15 flagged for new areas).
- [ ] **Cover image upload** — confirm a real image uploads to Cloudinary
      and renders correctly on both the card and the detail page's OG
      image.

## Phase 17 — WhatsApp/Messenger Click-to-Chat

- **New `frontend/components/site/FloatingChatButton.tsx`** — fixed
  bottom-right, `z-30` (checked every existing `z-` class under
  `components/site/` first: sits below the mobile drawer's `z-40` and
  both modals' `z-50`, so an open drawer or modal always covers it, not
  the other way round). Click toggles two channel buttons reading from
  the new `CHAT_LINKS` config — WhatsApp (emerald, generic
  `MessageCircle` icon) and Messenger (blue, the same `Facebook` icon
  `SOCIAL_LINKS` already uses) — each opening in a new tab. No new
  route: this is a layout-level component, not a page.
- **`frontend/lib/siteConfig.ts`**: added `CHAT_LINKS` (`whatsapp`,
  `messenger`), same placeholder-href (`"#"`) treatment `SOCIAL_LINKS`
  already uses — swap in the real `wa.me`/`m.me` links before launch.
- **Mounted in `frontend/app/(public)/layout.tsx`** as a sibling to
  `SiteChrome`, alongside the Phase 10/14 modal providers — public-site
  only, same reasoning those two already live there instead of the root
  layout. No provider needed for this one: it's a single global element
  with its own local open/closed state, not something any other
  component ever needs to trigger.
- **This is exactly the "optional second channel" the roadmap's Phase 10
  line described** ("WhatsApp/Messenger click-to-chat button alongside
  the [inquiry] form... additive, doesn't replace the DB-backed form")
  — it doesn't touch `InquiryModal`, `ViewingModal`, or the `Inquiry`
  table at all. Both are still the only DB-backed lead-capture paths;
  this is a pure external hand-off.
- **No brand-logo icons exist in the installed `lucide-react`** —
  checked its exports directly (grepped for `whatsapp`/`messenger`/
  `chat`, nothing brand-specific came back). Generic icons in
  brand-associated colors are the deliberate substitute, not a
  placeholder to swap out later.
- Build verification run this session: `node --check` clean on every
  backend file (unchanged this phase); `npm install && npx tsc --noEmit
  && npm run build` clean in `frontend/` — all 24 routes generate (no
  new route — this is layout-level, not a page).

### Still needs a live deploy — can't be verified from a zip

- [ ] **Add Zee's real WhatsApp number and Facebook Page username** to
      `CHAT_LINKS` in `siteConfig.ts` — both are still the `"#"`
      placeholder. `wa.me` needs digits only (country code first, e.g.
      `63` + the number for a PH mobile, no `+` and no leading `0`);
      `m.me` needs the Page's username, not a personal profile.
- [ ] **Tap through both channels on a real phone** once real links are
      in — confirm `wa.me` opens the WhatsApp app (not just a browser
      tab) and `m.me` opens Messenger the same way, on both iOS and
      Android.
- [ ] **Confirm the button doesn't visually collide with anything** on
      narrow mobile widths, especially the property detail page's
      stacked CTA buttons near the bottom of the aside panel.

## Phase 20 — Security, Analytics & Optimization (UI/UX Phase 7)

The last item on the UI/UX Improvement track's high-priority list:
CAPTCHA/rate-limiting/validation hardening on the three public lead
forms, plus a reporting layer over the `Inquiry` table that existed but
had no way to look at in aggregate.

**Backend:**
- `InquirySource` enum (`NAV_CTA`, `PROPERTY_PAGE`, `CTA_BANNER`,
  `VIEWING_FORM`, `SELL_PAGE`, `DIRECT`) and `Inquiry.spam`/`.source`/
  `.closedAt` columns (migration
  `20260917160000_add_inquiry_source_spam`) — `spam` is a separate axis
  from `archived`/`status`, so un-flagging a false positive restores the
  lead with its real pipeline status intact.
- Cloudflare Turnstile server-side verification (`src/lib/turnstile.js`)
  — skipped entirely, not hard-failed, when `TURNSTILE_SECRET_KEY` is
  unset.
- Spam heuristics (`src/lib/spamFilter.js`): honeypot, keyword list,
  excessive-link detection, link-in-name, no-whitespace long strings.
  Never rejects outright — a flagged submission still gets a normal 2xx
  response (so a bot learns nothing) but is stored with `spam: true` and
  hidden from the default inbox.
- Duplicate detection: a second submission within 24h attaches to the
  original inquiry's note timeline instead of creating a second row, and
  still returns a normal success response.
- Tighter validation on `POST /api/inquiries` (digit-counted phone,
  lowercased email, minimum name/message length).
- Rate limiting: inquiry submission is now a 3/min burst + 5/15min
  sustained two-stage limiter; admin login gets a new 10-attempts/15min
  limiter (`src/middleware/authRateLimit.js`) that doesn't count Zee's
  own successful logins against it.
- `GET /api/admin/analytics?days=` — totals, status/type/source
  breakdowns, conversion + win rate, average days to close, top
  properties by inquiry count, and a 12-month trend. Every aggregate
  excludes spam and is a Prisma aggregate or one raw `date_trunc` query,
  never a full-table fetch reduced in JS.
- `GET /api/admin/inquiries` and its stats endpoint both gained a
  `?spam=true` opt-in view, same shape as the existing `?archived=true`.
  Both PATCH routes (single + bulk) can now set `spam` and maintain
  `closedAt` automatically as `status` moves into/out of a closed state.

**Frontend:**
- `TurnstileWidget.tsx` (renders nothing without a site key) and
  `HoneypotField.tsx`, both wired into `InquiryModal`, `ViewingModal`,
  and `SellerLeadForm` — all three now block submission client-side when
  Turnstile is configured but unsolved, and show a distinct "already got
  this one" message on a detected duplicate.
- `source` is now threaded explicitly through every live
  `InquireButton` call site (`CTABanner` → `CTA_BANNER`, the property
  detail page → `PROPERTY_PAGE`) instead of `InquiryModal` guessing from
  whether a `propertyId` was present. `ViewingModal`/`SellerLeadForm`
  already hardcoded their own sources (`VIEWING_FORM`/`SELL_PAGE`).
  `NAV_CTA` has no live call site right now — TopNav's old "Inquire Now"
  button was replaced by "Book a Viewing"/"Sell Your Property" in an
  earlier UI/UX-track session — but the value stays in `InquirySource`
  for if a nav CTA comes back.
- `/admin/inquiries` gained a three-way Active/Archived/Spam view
  selector (replacing the old binary "Show Archived" toggle), a "Spam"
  stat card, a live spam count on the Spam tab, per-row "Mark spam"/"Not
  spam" buttons, and spam-aware bulk actions.
- New `/admin/analytics` page: day-range tabs (7/30/90/365/all), totals,
  conversion stats, by-status and by-source breakdowns (plain CSS bars —
  no charting library added, matching the rest of this codebase's
  "no new dependency for one page" calls), a top-properties table, and a
  12-month trend.
- Cross-links to Analytics added from `/admin` (Listings) and
  `/admin/posts`, alongside the existing Listings/Inquiries/Blog Posts
  links each admin page already carries.
- `frontend/.env.local.example`: added
  `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (optional).

### Still needs a live deploy — can't be verified from a zip

- [ ] **Run `npx prisma migrate deploy`** against Render's database —
      `20260917160000_add_inquiry_source_spam` has not been run yet, on
      top of confirming every earlier migration already ran.
- [ ] **Create a Cloudflare Turnstile site** (dashboard →
      Turnstile → Add site), then set `TURNSTILE_SECRET_KEY` on Render
      and `NEXT_PUBLIC_TURNSTILE_SITE_KEY` on Vercel. Both are optional —
      leaving them unset just disables CAPTCHA verification, nothing
      else breaks — but real traffic should have this on before launch.
- [ ] **Submit the three public forms** (Inquire, Book a Viewing, Sell
      Your Property) end to end once Turnstile is live, and confirm a
      deliberately-triggered honeypot fill still returns a normal
      success response but the submission shows up flagged in the Spam
      view, not the main inbox.
- [ ] **Submit the same form twice within 24h** and confirm the second
      submission's success screen says "Already got this one" and the
      message gets appended to the first inquiry's timeline instead of
      creating a second row.
- [ ] **Walk `/admin/analytics` with real data** — confirm the numbers
      agree with a manual count in `/admin/inquiries` for the same date
      range, and that `avgDaysToClose` shows an em dash until at least
      one lead has actually closed.
- [ ] **This build was not verified with `npm install`/`tsc`/`next
      build`** — no network access in the sandbox this session (same
      limitation flagged in every phase since Phase 11). Run
      `npm install && npx tsc --noEmit && npm run build` in `frontend/`
      before deploying.

## Phase 21 — Hero Section Refinement (UI/UX Phase 2)

The last remaining 🔴 High-priority item on the UI/UX Improvement track.
Frontend-only, `Hero.tsx` alone — no backend, schema, or route changes.

- Removed the "Sell Your Property" text link that used to sit under the
  hero's two buttons. It's been live in `TopNav` since the Phase 1 nav
  cleanup, so keeping it here too was pure duplication — the hero is now
  down to exactly the two CTAs the roadmap calls for: **Browse
  Properties** and **Book a Viewing**.
- Strengthened the left-to-right scrim (`from-navy/90 via-navy/55` →
  `from-navy/95 via-navy/70`) — the old values let bright sky bleed
  through behind the supporting paragraph on wide screens.
- Headline hierarchy: bumped the max size to `lg:text-6xl`, tightened
  `leading`/`tracking`, and added a drop-shadow so the white line never
  washes out against the photo. Button text bumped to `text-base` with
  more generous padding and a subtle shadow on the gold CTA.
- Portrait container widened (`lg:w-[30%]` → `lg:w-[34%]`, `h-[85%]` →
  `h-[90%]`) so the real portrait photo (900×957) has more room to scale
  up — the old, tighter box was producing a letterboxed gap that read as
  a cropped portrait even though `object-contain` was never actually
  cutting the image off.
- The background photo swap and the portrait's real-asset swap-in
  (replacing Phase 5's placehold.co stand-ins) had already happened in an
  earlier session, so this phase is the polish pass on top of that, not
  the original asset swap.

### Still needs a live deploy — can't be fully verified from a zip

- [ ] **Eyeball the hero at real breakpoints** (mobile, tablet, laptop,
      wide desktop) against a deployed preview — the portrait-sizing fix
      was reasoned from the source image's pixel dimensions, not a
      rendered screenshot, so a visual pass is worth doing before calling
      this done.
- [x] **Build verified this session** — network access was available:
      `npm install`, `npx tsc --noEmit`, and `npm run build` all ran
      clean in `frontend/`, all 25 routes generated.

## Phase 22 — Property Search & Discovery (UI/UX Phase 3)

The first 🔴 High item on the UI/UX track that was still genuinely
open. Build Phase 8 had already shipped type/listing/location/price/sort
filtering and Build Phase 12 the saved-listings heart, so this phase is
the three gaps between what existed and what the roadmap asks for: a
homepage entry point, the missing filter dimensions, and a real call to
action on the card.

### Homepage search bar

- New `frontend/components/site/HomeSearch.tsx`, mounted directly under
  the hero (before `CategoryStrip`) — `What are you looking for?` with
  **Location / Property Type / Price Range / Search**, exactly the
  roadmap's shape.
- A plain native `GET` form pointed at `/properties`, same zero-JS
  approach `PropertyFilterForm` has used since Phase 8. It deep-links
  into the existing grid with query params pre-filled; **no filtering
  logic is duplicated here.**
- The Location input autocompletes from a `<datalist>` built off the
  existing `GET /api/properties/areas` (Phase 15), so every suggestion is
  a location that will actually return results.
- Price Range rides in one `?priceRange=min-max` param, because a single
  `<select>` can only submit one value. `/properties` expands it into
  `minPrice`/`maxPrice` (`parsePriceRange()` in `lib/types.ts`), so the
  filter panel below shows real editable numbers rather than an opaque
  bucket. An explicit `minPrice`/`maxPrice` always wins over the bucket.

### Filters — beds, baths, status

- `backend/src/routes/properties.js`: new `?minBeds=` / `?minBaths=`.
  Both are **minimums** (`gte`), not exact counts. Because `beds`/`baths`
  are nullable, a `gte` filter correctly drops vacant lots and similar —
  a NULL comparison is never true. Junk values are parsed away by a new
  `toPositiveInt()` helper rather than reaching Prisma as `NaN`.
- `?status=` already existed on the backend since Phase 2 but had never
  been exposed to a visitor. `getProperties()` no longer hardcodes
  `AVAILABLE` — it's now the **default**, so every existing caller
  (`/sitemap.ts`, `/areas/[slug]`) behaves identically, while the new
  Status select can opt into `RESERVED`, `SOLD`, or `ANY`.
- `PropertyFilterForm` regrouped from one six-across row into two
  labelled rows — *Property* (location/type/listing/status) and *Size &
  budget* (min/max price, beds, baths) — with sort and the actions on
  their own line. Nine controls across one line had stopped being
  readable.

### Richer property cards

- `PropertyCard` now ends in a full-width **View Property** button
  instead of the small circular arrow. The arrow was a hover hint, which
  means it was effectively invisible on touch. It's a `<span>`, not an
  `<a>` — the whole card is already a `<Link>`, and a nested anchor is
  invalid HTML (the same constraint `SaveButton` works around).
- Each bed/bath/car/sqm stat gained a `title`/`aria-label` ("3
  bedrooms"), so the icon row is no longer icon-only for anyone who
  doesn't already read the convention.
- Image, title, location, price, beds/baths, floor area, property ID
  (`ZZ-0000`, Phase 12), and the ♡ favourite (Phase 12) were all already
  on the card — nothing was rebuilt.

### Still needs a live deploy — can't be fully verified from a zip

- [ ] **No migration needed** — this phase adds no columns. `minBeds` /
      `minBaths` filter on `Property.beds` / `Property.baths`, which have
      existed since Phase 2.
- [ ] **Not build-verified this session** — this sandbox had no network
      access (`npm error 403` from the registry), so `npm install`,
      `npx tsc --noEmit`, and `npm run build` could not run. `node
      --check` is clean on the one changed backend file. Run the
      frontend three before deploying.
- [ ] **Search the homepage bar end to end** on a deployed preview:
      pick a location suggestion, a type, and a price bucket, confirm the
      resulting `/properties?...` URL returns the right listings and that
      the filter panel shows those same values pre-filled.
- [ ] **Confirm beds/baths filtering against real data** — set Beds to
      `3+` and check that vacant lots and any listing with a null bed
      count drop out, rather than appearing with a blank stat.
- [ ] **Check the Status filter** shows sold/reserved listings only when
      explicitly selected, and that a bare `/properties` still reads
      "N properties currently available."
- [ ] **Eyeball the card's new button at card width** on mobile — it's
      full-width inside a card in a one-column grid, which is a different
      shape from the three-column desktop grid.

## Phase 23 — Most-Viewed Properties (UI/UX Phase 7, continued)

Adds the one piece of UI/UX Phase 7's analytics section that Phase 20
didn't cover: view counts. "Most-favorited properties" is **not** built —
favorites are still purely `localStorage` (Phase 12), so there's no
server-side signal to aggregate yet. That needs a decision (a real
favorites backend vs. staying client-only) before it can be built; flagged
to Zee rather than guessed at.

- [ ] **Run the new migration first** — this phase changes `schema.prisma`:
      ```
      npx prisma migrate deploy
      npx prisma generate
      ```
      (local dev: `npx prisma migrate dev`), then restart the backend.
      Every existing property backfills `viewCount = 0`.
- [x] **Build-verified this session** — network access was available:
      `npm install` (108 packages), `npx tsc --noEmit` clean, `npm run
      build` clean, all 25 routes generated. `node --check` clean on both
      changed backend files.
- [ ] **Confirm the counter increments** — open a property detail page a
      few times, then check `/admin/analytics` → "Most-Viewed Properties"
      shows that listing with the matching count.
- [ ] **Confirm the count survives a page a bot might hit oddly** — an
      invalid/deleted property id should still 404 cleanly (P2025 path),
      not throw a 500 or silently create a row.
- [ ] Still open from Phase 7's checklist generally: a mobile performance
      pass and an accessibility pass haven't been done as a dedicated
      audit (same manual-QA nature as Phase 11's Lighthouse checklist) —
      worth a pass before calling Phase 7 fully closed.

## Phase 24 — Accessibility Fixes & Image Formats (UI/UX Phase 7, continued)

A targeted code-level pass against Phase 7's "optimize images" and "check
accessibility" items — not a full Lighthouse/axe audit, which needs a live
deploy the same way Phase 11's did. Three small, additive changes; no
schema change, no migration, no new dependency.

- `frontend/components/site/PostCard.tsx`: blog cover image had `alt=""`
  (treated as decorative). It's the visual identity of the post, same as
  `PropertyCard`'s photo — changed to `alt={post.title}`.
- `frontend/components/site/NavSearch.tsx`: the expanding search input had
  a `placeholder` but no accessible name once it's a genuinely empty
  field for a screen reader (a placeholder isn't reliably announced as a
  label) — added `aria-label="Search title or location"`, no visual
  change.
- `frontend/next.config.js`: added `images.formats: ["image/avif",
  "image/webp"]` so Next re-encodes property photos as AVIF first
  (smaller than WebP for photographic content) with WebP as the
  fallback, ahead of the original format.
- Checked and left alone: `PropertyGallery.tsx`'s thumbnail strip images
  use `alt=""`, but each thumbnail `<button>` already carries its own
  `aria-label="Show photo N"` — the accessible name comes from the
  button, so the empty image alt is correct there, not a bug.
  `PropertyFilterForm`, `HomeSearch`, and the admin inquiry filters were
  all already using native `<label>` wrapping for every control — no
  gaps found.

**Explicitly still not built:** "Most-favorited properties" analytics —
same open item Phase 23 flagged. Favorites are still `localStorage`-only
(Phase 12), so there's no server-side signal to aggregate. Needs a
decision on whether to add a `Property.favoriteCount` counter (the same
shape as Phase 23's `viewCount`, incremented/decremented from the existing
heart button) before this can be built — that's a `schema.prisma` change,
so per this project's standing rule it's being asked about, not assumed.

- [x] **No migration needed** — no schema change this phase.
- [x] **Build-verified this session** — network access was available:
      `npm install` (108 packages), `npx tsc --noEmit` clean, `npm run
      build` clean, all 25 routes generated, same route list as Phase 23.
- [ ] **Eyeball the blog grid** (`/blog`) — cover images should look
      identical; the change is only to the `alt` text screen readers get,
      not anything visual.
- [ ] **Screen-reader spot check** (optional but this is what the fix is
      for) — with VoiceOver/NVDA, tab into the nav search icon, activate
      it, and confirm the input announces "Search title or location" once
      it's a text field, not just an unlabeled edit box.
- [ ] **Still open, needs a live deploy**: mobile performance pass and a
      full Lighthouse/axe accessibility run — this phase closed the
      concrete code-level gaps that were actually findable from the repo;
      it isn't a substitute for that live-browser pass.

## Email Notifications — Resend (off-roadmap)

Not a numbered phase on either roadmap — an extension of Build Phase 10's
lead capture. When a real inquiry is saved (buyer, seller, or viewing
request), the backend emails Zee so a lead doesn't sit unseen until he next
opens `/admin/inquiries`. The `Inquiry` row is still the source of truth;
the email is only a heads-up.

- `backend/src/lib/email.js` (new): the Resend client and `sendEmail()`.
  Optional by design (same posture as Turnstile): with no `RESEND_API_KEY`
  the app boots normally, sending is skipped, and a warning is logged once
  at startup. `sendEmail()` never throws.
- `backend/src/lib/inquiryNotification.js` (new): builds the message and
  sends it. Subject reads "New viewing request from Maria Santos — ZZ-0007"
  (buyer / seller / viewing variants); the body carries the contact
  details, property (ref no. + title), preferred viewing date/time, the
  message, and an "Open in admin" button. The visitor's email is set as
  **Reply-To**, so replying from Gmail goes straight to them. All visitor
  text is HTML-escaped.
- `backend/src/routes/inquiries.js`: one call to `notifyNewInquiry()` after
  the insert. **Not awaited** — the visitor's response never waits on
  Resend, and a failed send can't turn a saved lead into an error.
- `backend/package.json`: added the `resend` SDK (requires Node 20+).
- `backend/.env.example`: documents the three new variables.

**Who gets emailed, and who doesn't:** every non-spam, non-duplicate
inquiry. Submissions the spam filter flags are skipped (they're in the
admin Spam view), and so are 24h duplicates (Zee was already told about
that lead; the follow-up text lands on its notes timeline as before).

No schema change, no migration.

### Environment variables (backend, all optional)

| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` | Turns the feature on. Unset = emails skipped. |
| `INQUIRY_NOTIFY_TO` | Recipient(s), comma-separated. Falls back to `ADMIN_EMAIL`, so the key alone is enough. |
| `RESEND_FROM_EMAIL` | Sender. Unset = Resend's sandbox `onboarding@resend.dev`. |

`render.yaml` was deliberately **not** changed — like `TURNSTILE_SECRET_KEY`,
these are optional and are added in the Render dashboard rather than as
required Blueprint variables.

**Sandbox sender limit:** until a domain is verified in Resend, mail sent
from `onboarding@resend.dev` is only delivered to the email address the
Resend account was created with. That's fine for notifying Zee, provided
`INQUIRY_NOTIFY_TO`/`ADMIN_EMAIL` is that same address. Emailing *visitors*
(an auto-reply) would need a verified domain first — not built.

- [x] **No migration needed.**
- [x] **Verified with a stubbed Resend + Prisma against the real route**
      (no network to Resend from the build sandbox): correct
      subject/recipients/Reply-To, HTML escaping of hostile input, no email
      for spam or duplicates, and a 201 with the lead saved when Resend
      errors or throws. `node --check` clean. **Not sent through the real
      Resend API** — that needs the key.
- [ ] **Add `RESEND_API_KEY`** in Render → your service → Environment (and
      in `backend/.env` for local testing). Redeploy/restart.
- [ ] **Confirm the startup log** no longer says "RESEND_API_KEY not set".
- [ ] **Submit a real inquiry** from the deployed site and confirm the email
      arrives (check spam the first time), that "Open in admin" lands on the
      right inquiry, and that Reply goes to the visitor's address.
- [ ] **Update `/privacy`** — Section 5's provider table lists Vercel,
      Render, Cloudinary, and Turnstile. Once Resend is live it also
      receives each visitor's name, contact details, and message; add a row
      before treating the policy as launch-ready.
- [ ] **Check the Render Node version is 20+** (the SDK's requirement).
      Render's default is newer, but `render.yaml` doesn't pin it.
