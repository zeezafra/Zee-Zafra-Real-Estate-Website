# Project State

## Project
Zee Zafra Properties — personal real estate brand site. Two independently
deployed apps: `backend/` (Node.js + Express + Prisma + PostgreSQL, on
Render) and `frontend/` (Next.js App Router + Tailwind, on Vercel). See
`references/roadmap.md` (in the `personal-real-estate-website-builder`
skill) for the full phase-by-phase plan.

## Latest change (Resend inquiry notifications)
Off-roadmap, requested by Zee: email him when an inquiry comes in, using
Resend. An extension of Build Phase 10 lead capture, not a numbered phase
on either track. He is adding the API key himself later, so the feature is
built to be inert until `RESEND_API_KEY` exists.

- `backend/src/lib/email.js` (new): Resend client + `sendEmail()`. Client
  only constructed when a key is set (`new Resend()` throws without one).
  Never throws; unset key = skipped + one startup warning, same posture as
  `lib/turnstile.js`.
- `backend/src/lib/inquiryNotification.js` (new): builds/sends the email.
  Recipient = `INQUIRY_NOTIFY_TO` else `ADMIN_EMAIL` (so the key alone is
  enough); sender = `RESEND_FROM_EMAIL` else Resend's sandbox
  `onboarding@resend.dev`. Visitor's email becomes Reply-To only when it
  passes a stricter regex than the route's (Resend 422s a malformed
  Reply-To, which would drop the whole notification). All visitor text
  HTML-escaped; subject stripped of newlines.
- `backend/src/routes/inquiries.js`: `notifyNewInquiry(inquiry)` after the
  insert, un-awaited, only for non-spam. Duplicates return earlier and
  never email.
- `backend/package.json` / lockfile: `resend` ^6.28.1 (Node 20+).
- `backend/.env.example`: three new optional vars. `render.yaml`
  deliberately untouched (precedent: `TURNSTILE_SECRET_KEY` isn't listed).
- `README.md`: new "Email Notifications — Resend" section + checklist.

No schema change, no migration, no frontend change. Verified with a
stubbed Resend + Prisma driving the real router (subject/recipients/
Reply-To, escaping, spam and duplicate skipped, 201 preserved when Resend
errors or throws, no-key path); `node --check` clean. **Never sent through
the real Resend API** — the sandbox can't reach it and no key exists yet.
`npm run build` was not run (no frontend files touched).

**Still outstanding:**
- Add `RESEND_API_KEY` in Render (and local `.env`), then send a real
  inquiry end to end.
- Sandbox sender only delivers to the Resend account's own email — fine
  for notifying Zee; a visitor auto-reply needs a verified domain and was
  not built (flagged, not assumed).
- `/privacy` Section 5 provider table doesn't list Resend yet — legal text
  is Zee's, so flagged rather than edited. Add a row before launch.
- Duplicate submissions with new message text land on the lead's notes
  timeline but don't trigger an email. Easy follow-up if he wants it.

## Previous change (after Phase 25)
Homepage trim, requested by Zee: removed the **Why Work With Me**,
**Testimonials** preview, and **About Me** preview sections from the
homepage (`frontend/app/(public)/page.tsx` only — imports, JSX, and the
explanatory comment). The component files (`WhyWorkWithMe.tsx`,
`TestimonialsPreview.tsx`, `AboutPreview.tsx`) are left in
`components/site/` unused; the full `/about` and `/testimonials` pages are
untouched. Homepage order is now: Hero, HomeSearch, CategoryStrip,
FeaturedListings, PopularAreas, ServicesPreview, LatestArticles, CTABanner.
Build-verified: `npx tsc --noEmit` and `npm run build` clean (25 routes).

**Then:** added a Privacy Policy page, off-roadmap (not a numbered phase
on either the build or UI/UX track — a legal-content request, same
category as Phase 20's CAPTCHA/spam-filter work). Zee supplied the policy
text; it was adapted into the site's page shell/typography rather than
pasted as raw markdown, and the bracketed placeholders in his draft were
filled wherever the answer was already known elsewhere in the codebase
(email/service area from `CONTACT_INFO`, hosting/image/CAPTCHA providers
from what's actually integrated) rather than guessed.

- `frontend/app/(public)/privacy/page.tsx` (new): full policy content —
  sections 1–10 as supplied, with the Section 5 provider table filled in
  (Vercel, Render — hosting *and* database, since there's no separate DB
  provider — Cloudinary, Cloudflare Turnstile) and a line clarifying the
  site uses no third-party analytics (the `/admin/analytics` dashboard is
  first-party, queried from our own `Inquiry`/`Property` tables). Still
  bracketed, same `[Add ...]` convention as `siteConfig.ts`: phone number
  (already blank there) and the exact street/office address (only the
  service area — "Cebu City and nearby areas" — was known). `LAST_UPDATED`
  is hand-set to today's date, not computed at request time, so it won't
  silently drift on every render.
- `frontend/components/site/SellerLeadForm.tsx`,
  `frontend/components/site/ViewingModal.tsx`: added a small consent line
  above the submit button linking to `/privacy` — these are the two flows
  Zee specifically asked for ("selling and property viewing"). The general
  `InquiryModal` "Inquire Now" form collects the same kind of data and the
  policy applies to it too, but wasn't touched since it wasn't asked for —
  flagging in case Zee wants the same line added there for consistency.
- `frontend/components/site/Sidebar.tsx`: added a small "Privacy Policy"
  link under the tagline at the bottom, so the page is reachable site-wide
  and not just from the two forms above.
- `frontend/app/sitemap.ts`: added `/privacy` to the static route list
  (yearly change frequency, low priority) — every other static marketing
  page is listed there, so this one needed the same treatment to be
  honestly complete.

No backend changes, no schema change, no migration, no new dependency.
Build-verified this session — network access was available: `npm install`
(108 packages), `npx tsc --noEmit` clean, `npm run build` clean, 26 routes
generated (up from 25 — the new `/privacy` route).

**Still outstanding — not built/decided:**
- Phone number and exact business address on the new page are placeholders
  (`CONTACT_INFO.phone` is already `[Add phone number]` sitewide; the
  street address was never captured anywhere in the codebase).
- Whether to add the same consent line to `InquiryModal.tsx` for
  consistency across all three lead forms — flagged above, not assumed.
- This is Zee's own content, adapted into the page shell as supplied —
  it hasn't been reviewed by a lawyer, and Section 7's Data Privacy Act
  reference should be checked against Zee's actual data-retention
  practice before this is treated as launch-ready.
- README has no section for this session's work yet (nor does it have one
  for Phase 25 yet, either — a pre-existing gap from before this session,
  flagged rather than silently backfilled).

## Current milestone
Phase 25 (UI/UX Phase 7, continued — most-favorited analytics). Resolves
the one product-decision gap Phase 24 flagged: adds `Property.favoriteCount`
(schema change, confirmed with Zee before adding it — same "ask, don't add
silently" rule this project has followed since Phase 20), a new
`POST`/`DELETE /api/properties/:id/favorite` pair (rate-limited, mirrors
the `viewCount` increment pattern), a fire-and-forget call from
`useSavedListings.toggleSaved` so the heart button's localStorage toggle
never blocks on it, and a **Most-Favorited Properties** table on
`/admin/analytics` mirroring **Most-Viewed Properties**.

Frontend **build-verified this session** — network access was available:
`npm install`, `npx tsc --noEmit`, and `npm run build` all ran clean (25
routes, same route list as Phase 24). Backend: `node --check` clean on all
three touched/new files (`properties.js`, `adminAnalytics.js`,
`favoriteRateLimit.js`). `npx prisma validate` could **not** run — this
sandbox's network allowlist doesn't include `binaries.prisma.sh`, so
Prisma's query-engine download 403s. The schema edit is a single field in
the exact shape as the existing `viewCount` column; still worth an eyeball
before deploying since it's unverified by tooling. Migration has **not
been run** against any database, same as every prior phase's migrations at
checkpoint time.

This closes the last concrete, findable-from-the-repo gap in UI/UX Phase 7.
What's left is a live-deploy task only: mobile performance / Lighthouse /
axe pass — same limitation every prior phase's manual-QA checklist has
flagged. Once that's done, the entire UI/UX Improvement roadmap is
complete.

## Previous milestone
Phase 24 (UI/UX Phase 7, continued — accessibility fixes & image formats).
Code-complete and **build-verified** — network access was available:
`npm install`, `npx tsc --noEmit`, and `npm run build` all ran clean in
`frontend/` (25 routes, same route list as Phase 23). No backend files
touched this phase, so no `node --check` needed.

## Milestone before that
Phase 23 (UI/UX Phase 7, continued — Most-Viewed Properties analytics).
Code-complete and **build-verified** — network access was available:
`npm install`, `npx tsc --noEmit`, and `npm run build` all ran clean in
`frontend/` (25 routes generated); `node --check` clean on both touched
backend files.

**Also confirmed before starting Phase 23:** checked the actual files
(not this doc's prior claims) for UI/UX Phase 5 (Inquiry CRM) and Phase 6
(Follow-up & Activity) — both are genuinely done (status pipeline, stats
endpoint, filters/search, `nextFollowUpDate`/`lastContactedAt`,
`InquiryNote` timeline with auto-logged SYSTEM entries, `tel:`/`mailto:`/
WhatsApp contact actions, and the Spam view all verified present in
code). Zee redirected from "build Phase 5" → "Phase 6" → "Phase 7
polish" once each was confirmed already built, landing first on the one
real gap in Phase 7's analytics section (view-count tracking, Phase 23),
then on this phase's accessibility/image-format gaps.

## Milestone before that
Phase 22 (UI/UX Phase 3 — Property Search & Discovery). Code-complete,
**not build-verified** — no network access in that sandbox session
(`npm error 403` from the npm registry), so `npm install` /
`npx tsc --noEmit` / `npm run build` could not run in `frontend/`.
`node --check` is clean on the one changed backend file. **This has now
been build-verified retroactively** as part of this session's Phase 23
build (same `npm run build` run covers both phases' changes) — clean.

**Correction to the previous entry.** The Phase 21 note below listed the
UI/UX track's completed phases as "1, 2, 3, 5, plus Phase 7" — UI/UX
Phase 3 was *not* actually done. Checking the files directly this
session: the homepage had no search section at all
(`app/(public)/page.tsx` went Hero → CategoryStrip), `PropertyFilterForm`
had no bedroom, bathroom, or status controls, and `PropertyCard` had a
hover-only circular arrow instead of a "View Property" action. Build
Phase 8's filters and Build Phase 12's ♡/refNo *were* in place, which is
probably what the overclaim came from. This is the second time a
"complete" claim in this file hasn't matched the files (see the Phase 14
follow-up note) — check the diff, not the report.

## Completed work (this session — Phase 25, UI/UX Phase 7 continued)

Backend: three files (one new). Frontend: three files edited, no new
files. New migration, no new dependency.

- `backend/prisma/schema.prisma` / new migration
  `20260918110000_add_property_favorite_count`: `Property.favoriteCount`
  (Int, default 0) — same shape as Phase 23's `viewCount`, but incremented
  by the frontend heart button rather than a detail-page GET, since
  favorites are `localStorage`-only (Phase 12) with no server-side table
  to derive a count from.
- `backend/src/middleware/favoriteRateLimit.js` (new): 30/min + 100/15min,
  looser than `inquiryRateLimit` on purpose — hearting several listings
  while browsing is normal, this only guards against a script hammering
  the counter.
- `backend/src/routes/properties.js`: `POST`/`DELETE /api/properties/:id/
  favorite`. `DELETE` uses `updateMany` with `favoriteCount: { gt: 0 }` so
  it can never go negative (a plain atomic `decrement` has no floor of its
  own). Both return `204` — fire-and-forget endpoints, no body needed.
- `backend/src/routes/adminAnalytics.js`: added `topFavoritedProperties`,
  queried and shaped identically to the existing `topViewedProperties`
  (all-time, not scoped to the `days` range picker).
- `frontend/lib/useSavedListings.ts`: `toggleSaved` now also fires the
  new endpoint (POST on save, DELETE on unsave) after the localStorage
  write, never awaited and never allowed to affect the toggle itself.
- `frontend/lib/types.ts`: `Property.favoriteCount`,
  `InquiryAnalytics.topFavoritedProperties`.
- `frontend/app/admin/(protected)/analytics/page.tsx`: new
  **Most-Favorited Properties** table, placed right after **Most-Viewed
  Properties**, same layout.

## Completed work (prior session — Phase 24, UI/UX Phase 7 continued)

Frontend only, three files, no backend changes, no schema change, no
migration, no new dependency.

- `frontend/components/site/PostCard.tsx`: blog cover image's `alt=""`
  (decorative) changed to `alt={post.title}` — it's the post's own cover
  photo, not decoration, same status as `PropertyCard`'s image.
- `frontend/components/site/NavSearch.tsx`: added
  `aria-label="Search title or location"` to the expanding search input
  — a placeholder isn't a reliable accessible name once the field is
  empty. No visual or behavioral change.
- `frontend/next.config.js`: `images.formats: ["image/avif",
  "image/webp"]` added so Cloudinary-hosted property photos get
  re-encoded to AVIF first (falling back to WebP, then the original).

### What was checked and left alone (real audit, not busywork)

- `PropertyGallery.tsx`'s thumbnail images use `alt=""`, but each
  thumbnail's wrapping `<button>` already has `aria-label="Show photo
  N"` — the accessible name comes from the button, so this is already
  correct, not a gap.
- `PropertyFilterForm`, `HomeSearch`, and the admin filter controls all
  already wrap every input in a native `<label>` — no missing labels
  found.
- `ContactActions.tsx`'s Call/Email/WhatsApp links already pair icons
  with visible text, so they don't depend on an icon's accessible name.

### Explicitly still not built

"Most-favorited properties" analytics — same gap Phase 23 flagged, not
re-solved here. Favorites are still `localStorage`-only (Phase 12); no
server-side signal exists to aggregate. The natural fix is a
`Property.favoriteCount` counter — same shape as Phase 23's `viewCount`,
incremented/decremented by the existing heart button instead of a new
detail-page GET — but that's a `schema.prisma` change, so per this
project's standing rule (see "Key learnings" in the builder skill) it's
being asked about explicitly rather than added silently.

### Still open in Phase 7 generally

- Mobile performance pass and a full Lighthouse/axe accessibility run —
  live-deploy tasks, same limitation as every prior phase's manual-QA
  checklist.
- The favorites-backend decision above.

## Completed work (prior session — Phase 22, UI/UX Phase 3)

Backend: one file. Frontend: one new component, four edited. No schema
change, no migration, no new dependency.

- `backend/src/routes/properties.js`: added `?minBeds=` / `?minBaths=`
  to `GET /api/properties`, both as `gte` minimums rather than exact
  matches ("3+ beds" is how a buyer searches). Nullable `beds`/`baths`
  means a `gte` filter correctly excludes listings with no count at all
  — a SQL comparison against NULL is never true. New `toPositiveInt()`
  helper so `?minBeds=abc` is ignored instead of reaching Prisma as
  `NaN`. `?status=` needed no backend change — it has been supported
  since Phase 2 and simply had no UI.
- `frontend/lib/api.ts`: `PropertyFilters` gained `minBeds`, `minBaths`,
  `status`. `getProperties()` no longer *hardcodes* `status=AVAILABLE` —
  it's now the default when `status` is absent or empty, and `"ANY"`
  drops the param entirely. Both existing callers (`app/sitemap.ts`,
  `/areas/[slug]`) pass no status, so their behavior is byte-identical.
- `frontend/lib/types.ts`: added `MIN_ROOM_OPTIONS`,
  `PUBLIC_STATUS_FILTERS`, `PRICE_RANGES`, and `parsePriceRange()`.
- New `frontend/components/site/HomeSearch.tsx` — the homepage entry
  point: Location / Property Type / Price Range / Search, as a native
  GET form to `/properties`. Async server component; the Location input
  autocompletes from a `<datalist>` built off the existing
  `GET /api/properties/areas` (Phase 15), so every suggestion returns
  results. Mounted between `<Hero />` and `<CategoryStrip />`.
- `frontend/components/site/PropertyFilterForm.tsx`: added Status, Beds,
  and Baths; regrouped from one six-across row into two labelled
  fieldsets (*Property* / *Size & budget*) with sort and actions on
  their own line. Nine controls on one line had stopped being readable.
- `frontend/components/site/PropertyCard.tsx`: replaced the hover-only
  circular arrow with a full-width **View Property** button (a `<span>`,
  not an `<a>` — the card is already wrapped in a `<Link>` and a nested
  anchor is invalid HTML, the same constraint `SaveButton` works
  around). Each stat gained a `title`/`aria-label`.
- `frontend/app/(public)/properties/page.tsx`: reads the three new
  params, expands `?priceRange=` into `minPrice`/`maxPrice` (an explicit
  min/max always wins), and the count line now says "matching your
  filters" instead of "currently available" once a status filter is set.
- `README.md`: added a "## Phase 22" section with its own deploy
  checklist.

### Implementation decisions worth remembering

- **`priceRange` is one param, expanded at the page, not the API.** A
  single `<select>` can only submit one name/value, so the homepage
  bucket rides as `"min-max"` and `/properties` unpacks it. Keeps
  `HomeSearch` zero-JS and means the filter panel below shows real
  editable numbers rather than an opaque bucket.
- **AVAILABLE became a default, not a removal.** The public grid's
  "available only" contract from Phase 7 is preserved for every existing
  caller; seeing sold/reserved listings is an explicit opt-in.
- **Nothing from Build Phase 8 or 12 was reimplemented.** Per the
  roadmap's own note for this phase, the existing filter logic, ♡
  button, and `refNo` were reused as-is.

## Completed work (prior session — Phase 21, UI/UX Phase 2)

Frontend-only, `frontend/components/site/Hero.tsx` alone. No backend,
schema, or route changes.

- Removed the duplicate "Sell Your Property" text link under the hero's
  buttons — it's been live in `TopNav` since the Phase 1 nav cleanup, so
  the hero is now down to exactly the roadmap's two CTAs (Browse
  Properties, Book a Viewing).
- Strengthened the left-to-right scrim (`from-navy/90 via-navy/55` →
  `from-navy/95 via-navy/70`) so the supporting paragraph stays legible
  over the brightest part of the background photo.
- Headline hierarchy: `lg:text-6xl` ceiling, tighter `leading`/`tracking`,
  a text drop-shadow, and bigger/heavier CTA buttons with a subtle shadow
  on the gold one.
- Portrait container widened (`lg:w-[30%]`→`34%`, `h-[85%]`→`90%`) — the
  900×957 real portrait photo was getting boxed tighter than it needed,
  reading as "cropped" even though `object-contain` was never actually
  cutting it off; confirmed via the image's actual pixel dimensions, not
  just eyeballing the JSX.
- Build verification: `npm install` (108 packages), `npx tsc --noEmit`
  (clean), `npm run build` (clean, all 25 routes generated) — all ran
  this session since network access was available.

## Completed work (prior session, Phase 20)
Continuing from the "Still outstanding" list below.
- New `frontend/app/admin/(protected)/analytics/page.tsx`: day-range
  tabs (7/30/90/365/all, URL-driven via `?days=`), totals grid,
  conversion stats (with `avgDaysToClose` rendered as an em dash when
  `null`), by-status and by-source breakdowns as plain CSS bar rows (no
  charting library — matches this codebase's "no new dependency for one
  page" precedent), a top-properties table linking each row to its
  `/admin/properties/[id]/edit` page, and a 12-month trend. Reads
  `getAdminAnalytics()`, unchanged since last session.
- `frontend/lib/format.ts`: added `formatMonthLabel()` (parses the
  endpoint's raw `"YYYY-MM"` the same local-parts way
  `formatPreferredDate` does) and `formatPercent()`.
- `frontend/app/admin/(protected)/page.tsx` (Listings) and
  `frontend/app/admin/(protected)/posts/page.tsx` (Blog Posts): both
  gained an "Analytics" cross-link, same header-button pattern the
  Listings/Inquiries/Blog Posts links already share.
- `README.md`: added a "## Phase 20 — Security, Analytics &
  Optimization" section covering the whole phase (backend work from
  last session included, since it had no README entry yet) with its own
  "Still needs a live deploy" checklist.
- Build verification attempted: `node --check` clean on every backend
  file (none changed this session). `npm install` in `frontend/` failed
  — **no network access in this sandbox** (`npm error 403 ... registry
  is forbidden`). A global `tsc` was available and run anyway out of
  curiosity; it only produced `Cannot find module 'next'`/`'react'`/
  `'lucide-react'` errors from the missing `node_modules`, not anything
  about this session's actual changes — not a meaningful signal either
  way. **Nothing about this session's TypeScript correctness has
  actually been verified.** Run `npm install && npx tsc --noEmit && npm
  run build` before deploying, same as every prior phase's caveat.

## Still outstanding (from last session, now resolved above)
- ~~No `/admin/analytics` page~~ — done.
- ~~No Analytics cross-link from `/admin` or `/admin/posts`~~ — done.
- ~~`README.md` has no Phase 20 section~~ — done.
- Migration `20260917160000_add_inquiry_source_spam` is still **not
  run** against any database — first item on README's Phase 20 deploy
  checklist.
- Cloudflare Turnstile account not yet created — second item on the
  same checklist.

## Next task
Every 🔴 High item on both roadmap tracks is now code-complete (build
roadmap: 1–17; UI/UX track: 1, 2, 3, 5, plus the 🟡 Later Phase 7). What's
left is deploy-time verification, plus the two remaining 🟠 Medium UI/UX
phases — nothing blocking, no more "must do before anything else" items:
1. Deploy-time verification across every phase's README checklist —
   Phase 21's is short (visual QA at real breakpoints); Phase 20's is the
   bigger one (run the new migration, set up Turnstile, end-to-end form
   tests, sanity-check the analytics numbers).
2. **UI/UX Phase 4 — Featured Properties & Homepage Sections** (🟠
   Medium) — confirmed still open by reading `frontend/app/(public)/
   page.tsx` this session: the homepage has Hero/CategoryStrip/
   FeaturedListings/PopularAreas/LatestArticles/CTABanner, but none of
   "Why Work With Me?", a Services teaser, Market Insights, a
   Testimonials teaser, or an About Me teaser exist there yet — those
   still only live on their own standalone pages from Build Phase 9.
3. **UI/UX Phase 6 — Lead Follow-Up & Activity** (🟠 Medium, depends on
   UI/UX Phase 5 which is done): follow-up dates, an internal-notes
   field, a per-inquiry activity timeline, and quick contact actions
   (Call/Email/Messenger) on the inquiry detail view.

## Completed work (Phase 17)
- `frontend/lib/siteConfig.ts`: added `CHAT_LINKS` (`whatsapp`,
  `messenger`), same placeholder-href treatment as `SOCIAL_LINKS`
  (`"#"` until Zee supplies a real `wa.me`/`m.me` link).
- New `frontend/components/site/FloatingChatButton.tsx` — fixed
  bottom-right button, `z-30` (confirmed against every existing `z-`
  class under `components/site/`: sits below the mobile drawer's `z-40`
  and both modals' `z-50`). Click toggles two channel buttons reading
  `CHAT_LINKS` — WhatsApp (emerald, `MessageCircle` icon) and Messenger
  (blue, the same `Facebook` icon `SOCIAL_LINKS` already uses), both
  `target="_blank" rel="noopener noreferrer"`. Click-outside and
  Escape-to-close, same pattern as `SiteChrome`'s mobile drawer.
- No brand-logo icons exist in the installed `lucide-react` — checked
  its exports directly (grepped for whatsapp/messenger/chat/phone,
  nothing brand-specific came back). Generic icons in brand-associated
  colors are the deliberate substitute.
- Mounted in `frontend/app/(public)/layout.tsx` as a sibling to
  `SiteChrome`, alongside the Phase 10/14 modal providers. No provider
  needed — single global element, own local state, nothing else ever
  needs to trigger it (unlike the two modals, which multiple buttons
  across the site open).
- Purely additive, per the roadmap's original Phase 10 line: doesn't
  touch `InquiryModal`, `ViewingModal`, or the `Inquiry` table. Both
  remain the only DB-backed lead-capture paths; this is an external
  hand-off alongside them, not a replacement.
- `README.md`: added a "## Phase 17" section with its own "Still needs a
  live deploy" checklist.
- Build verification run this session: `node --check` clean on every
  backend file (unchanged this phase); `npm install && npx tsc --noEmit
  && npm run build` clean in `frontend/` — all 24 routes generate (no
  new route added — this is layout-level, not a page).

## Completed work (Phase 16)
- New `Post` model (`backend/prisma/schema.prisma`): `slug` (unique,
  chosen at creation, not re-derived from `title` on every save so
  editing a title later can't break a shared link), `title`, `excerpt`,
  `content` (`@db.Text`), `coverImage` (nullable), `published` (default
  `true`). No separate `publishedAt` — `createdAt` doubles as the
  display/sort date, same "plain data until volume justifies more
  structure" call already made for `rentPeriod`/the Phase 13 seller
  fields.
- Hand-written migration
  `backend/prisma/migrations/20260916193000_add_post/migration.sql` —
  **not yet run against the live database**, same as every earlier
  phase's migrations.
- New `backend/src/routes/posts.js` (public): `GET /api/posts`
  (published only, newest first) and `GET /api/posts/:slug` (published
  only — an unpublished slug 404s exactly like a nonexistent one).
- New `backend/src/routes/adminPosts.js` (protected): full CRUD —
  `GET /api/admin/posts` (no `published` filter, so drafts show up here),
  `POST`, `PATCH /:id`, `DELETE /:id`. Slug format-validated
  (`^[a-z0-9]+(-[a-z0-9]+)*$`); a DB-level unique-constraint hit (`P2002`)
  surfaces as a friendly "That slug is already in use" instead of a raw
  500.
- No new upload endpoint — the cover image reuses the existing
  `POST /api/admin/upload` from Phase 4, sending a single file instead
  of the array a property's photos use.
- `backend/src/server.js`: both routers wired in (`/api/posts`,
  `/api/admin` for the admin CRUD).
- `frontend/lib/types.ts`: added `Post` type.
- `frontend/lib/api.ts`: added `getPosts()` and `getPostBySlug()`
  (60s revalidate, same pattern as the other public list/detail
  helpers).
- `frontend/lib/adminAuth.ts`: added `getAdminPosts()` — same
  cookie-forwarding pattern as `getAdminInquiries()`, since the admin
  dashboard needs drafts too and can't just call the public endpoint.
- `frontend/lib/format.ts`: added `formatPostDate()`.
- New `frontend/components/site/PostCard.tsx` — shared by `/blog` and
  the homepage section; whole-card `<Link>`, no nested-anchor constraint
  to work around (a post has no per-card action living outside the
  card's `<Link>` the way `PropertyCard`'s `SaveButton` does).
- New `frontend/app/(public)/blog/page.tsx` — directory page, every
  published post as a card, newest first.
- New `frontend/app/(public)/blog/[slug]/page.tsx` — real route,
  `generateStaticParams` off `getPosts()`, per-post `<title>`/description/
  OG image. Content renders as plain text with `whitespace-pre-line`
  (blank-line paragraph breaks) — no markdown renderer added for a
  one-admin blog.
- New `frontend/components/site/LatestArticles.tsx` — homepage section,
  latest 3 posts, same async-server-component/disappears-if-empty shape
  as `PopularAreas`. Inserted between `PopularAreas` and `CTABanner` in
  `frontend/app/(public)/page.tsx`.
- `frontend/lib/siteConfig.ts`: `NAV_LINKS` — added "Market Insights" →
  `/blog`, right after "Properties". This was the other half of what
  Zee's updated reference screenshot showed (flagged, not built, back in
  the Phase 14/15 sessions) — it now shows up in the sidebar, top nav,
  and mobile drawer automatically since all three read from this one
  list.
- `frontend/app/sitemap.ts`: added `/blog` plus one entry per published
  post.
- Admin: new `frontend/app/admin/(protected)/posts/page.tsx` (own
  dashboard route, same reasoning `/admin/inquiries` got one in Phase
  10), `PostsTable.tsx`, `PostForm.tsx` (title→slug auto-suggest that
  stops once the admin edits the slug directly; single cover-image
  upload/preview/remove, same shape as `PropertyForm`'s multi-image
  version), `posts/new/page.tsx`, `posts/[id]/edit/page.tsx` (looks the
  post up via `getAdminPosts()` rather than a new by-id endpoint — the
  list is small enough that finding by id costs nothing extra). Added a
  "Blog Posts" link to the Listings dashboard header, and
  "Listings"/"Inquiries" links back from the new page, so all three
  admin sections cross-link.
- `README.md`: added a "## Phase 16 — Blog" section with its own "Still
  needs a live deploy" checklist.
- Build verification run this session: `node --check` clean on every
  backend file; `npm install && npx tsc --noEmit && npm run build` clean
  in `frontend/` — all 24 routes generate, including `/blog`,
  `/blog/[slug]`, `/admin/posts`, `/admin/posts/new`, and
  `/admin/posts/[id]/edit`.

## Completed work (Phase 15)
- **No schema change, no migration** — reads straight off the existing
  `Property.location` free-text column.
- `backend/src/routes/properties.js`: new `GET /api/properties/areas`
  — distinct `location` values (scoped to `AVAILABLE`) with a listing
  count each, via `prisma.property.groupBy`. Declared *before*
  `GET /api/properties/:id` — Express would otherwise match `"areas"`
  as an `:id` value on that route instead of reaching this one.
- New `frontend/lib/slug.ts` — `slugify()`, the one place the
  location→URL-slug rule lives. Every area link and
  `generateStaticParams()` call it instead of re-deriving their own
  version, so they can't drift apart.
- `frontend/lib/types.ts`: added `Area` type (`{ location, count }`).
- `frontend/lib/api.ts`: added `getAreas()` (60s revalidate, same
  pattern as the other list helpers).
- New `frontend/app/(public)/areas/page.tsx` — directory page, every
  area as a card, alphabetical.
- New `frontend/app/(public)/areas/[slug]/page.tsx` — one page per
  distinct location, statically generated via `generateStaticParams`.
  Reuses `PropertyCard` for its grid. The backend's `location` filter
  is `contains`, not exact-match, so this page adds a defensive
  exact-string filter client-side after fetching.
- New `frontend/components/site/PopularAreas.tsx` — homepage section,
  top 6 areas by listing count. This was flagged (not silently built)
  in the Phase 14 session's "reference-screenshot update" work as
  visible in Zee's updated screenshot but out of scope for that
  follow-up — it belongs here instead.
- `frontend/app/(public)/page.tsx`: `<PopularAreas />` inserted between
  `<FeaturedListings />` and `<CTABanner />`.
- `frontend/app/(public)/properties/[id]/page.tsx`: the location line
  now links to that listing's `/areas/[slug]` page.
  `PropertyCard.tsx` was deliberately left alone — its location text
  sits inside the card's whole-card `<Link>`, and a nested `<a>` would
  be invalid HTML (same constraint Phase 12's `SaveButton` worked
  around by sitting outside that `<Link>` as a sibling instead).
- `frontend/app/sitemap.ts`: added `/areas` plus one entry per area
  slug.
- `README.md`: added a "## Phase 15 — Neighborhood Landing Pages"
  section with its own "Still needs a live deploy" checklist.
- Build verification run this session (network was available):
  `npm install` (added 108 packages, `next@14.2.35` confirmed still
  the pinned version, not drifted) and `npm run build` in `frontend/`
  — compiled successfully, all 21 routes generated including the new
  `/areas` (static) and `/areas/[slug]` (SSG).

## Completed work (Phase 14)
- `backend/prisma/schema.prisma`: added nullable `preferredDate` /
  `preferredTime` `String` columns to `Inquiry` (deliberately not
  `DateTime`/`@db.Time` — see the schema comment for the UTC-vs-local
  reasoning). Both `null` for every inquiry except a viewing request.
- Hand-written migration
  `backend/prisma/migrations/20260916140000_add_viewing_request_fields/migration.sql`
  — **not yet run against the live database**, same as every earlier
  phase's migrations.
- `backend/src/routes/inquiries.js`: `POST /api/inquiries` validates
  `preferredDate`/`preferredTime` (format-checked against `YYYY-MM-DD`/
  `HH:MM`) and requires `propertyId` when either is present.
- `backend/src/routes/adminInquiries.js`: **no change needed** — the
  existing `findMany` has no `select`, so the new columns already come
  back automatically.
- `frontend/lib/adminAuth.ts`: `AdminInquiry.preferredDate` /
  `.preferredTime` added.
- `frontend/lib/format.ts`: added `formatPreferredDate` /
  `formatPreferredTime` display helpers.
- New `frontend/components/site/ViewingModal.tsx`,
  `ViewingModalProvider.tsx`, `BookViewingButton.tsx` — a second, separate
  modal from `InquiryModal` (own provider, own trigger) since a viewing
  request needs different fields (date/time pickers, not a free-text
  message). Mounted in `frontend/app/(public)/layout.tsx` alongside
  `InquiryModalProvider`.
- `frontend/app/(public)/properties/[id]/page.tsx`: added
  `<BookViewingButton>` between "Inquire Now" and the save button.
  Property-page-only — never added to `TopNav`/`CTABanner`, since a
  viewing request without a property doesn't mean anything (matches the
  backend's `propertyId` requirement).
- `frontend/app/admin/(protected)/inquiries/page.tsx`: no new filter tab
  (a viewing request is still `type: BUYER`) — instead a green "Viewing
  Requested" badge and a formatted "`<date>` at `<time>`" line on the row.
- `README.md`: added a "## Phase 14 — Book a Viewing" section with its
  own "Still needs a live deploy" checklist, including the build-
  verification caveat below.

## Completed work (this session's follow-up fixes)
- `backend/src/routes/inquiries.js`: added `todayManilaISODate()` and a
  check that a submitted `preferredDate` isn't before it. The frontend's
  `<input type="date" min=...>` was always just a client-side hint —
  nothing stopped a direct API call or devtools edit from submitting a
  past date until now. Compared as `Asia/Manila` rather than the
  server's own timezone (Render runs UTC) since that's where visitors
  and viewings actually are; string comparison works directly since
  `YYYY-MM-DD` sorts the same lexicographically as chronologically.
- `frontend/components/site/CTABanner.tsx`: added the quiet `/sell`
  text link under the banner's headline ("Thinking of selling instead?
  Get a free valuation →"). **This resolves a discrepancy, not a new
  ask**: the Phase 14 session report supplied alongside this zip
  claimed this exact change had already been made and documented in
  this session — it had not. Neither the file nor README.md/
  PROJECT-STATE.md showed any trace of it. Treat any future "applied
  this session" claim as unverified until the diff is actually visible
  in the exported files, not just described in a report.

## Completed work (this session's reference-screenshot update)
Zee supplied an updated reference screenshot showing `TopNav`/`Hero`
with global "Book a Viewing" + "Sell Your Property" CTAs — not just the
per-property one Phase 14 originally shipped with. Confirmed the
intended behavior first (property picker inside the modal, not a
separate page or an optional-`propertyId` backend), then:
- `frontend/components/site/ViewingModalProvider.tsx`: `ViewingContext`
  fields are now optional (matches `InquiryContext`'s shape); `open()`
  accepts no argument.
- `frontend/components/site/BookViewingButton.tsx`: props relaxed to
  optional so the same component works as both the property-page
  trigger (with props) and the new global trigger (without).
- `frontend/components/site/ViewingModal.tsx`: when opened without a
  locked-in property, shows a debounced property search (reusing
  `GET /api/properties?q=`, no backend change) instead of the "For:
  `<title>`" line; submission is blocked until one's picked. Fixed a
  real bug introduced while building this: the property-search input
  and the Name input both initially pointed at the same `firstFieldRef`
  — two simultaneously-mounted elements sharing one ref is undefined
  behavior. Split into `nameFieldRef` / `propertyFieldRef`.
- `frontend/components/site/TopNav.tsx`: "Inquire Now" replaced with
  "Book a Viewing" (gold pill) + "Sell Your Property" (outlined pill,
  → `/sell`).
- `frontend/components/site/Hero.tsx`: "Watch Introduction" (dead
  placeholder) replaced with an outlined "Book a Viewing" button + a
  "Sell Your Property" text link.
- **Deliberately not built**: the same screenshot also shows a "Market
  Insights" nav item, a "Popular Areas" section, and a blog-style
  section on the homepage. These belong to Phase 15/16, not this
  follow-up — flagged, not silently added.
- `README.md`: added a "Global 'Book a Viewing' entry points" note
  under Phase 14 and corrected the now-outdated "never appears in the
  nav" line from the original Phase 14 section.

## Completed work (earlier phases)
- `backend/prisma/schema.prisma`: added `InquiryType` enum (`BUYER` /
  `SELLER`) and a `type` column on `Inquiry`, defaulting to `BUYER`
- Hand-written migration
  `backend/prisma/migrations/20260916091500_add_inquiry_type/migration.sql`
  (Prisma engine binaries are blocked in the dev sandbox — this still
  needs `npx prisma migrate deploy` run manually against Render, same as
  every earlier phase's migrations — **not yet run against the live
  database**)
- `backend/src/routes/inquiries.js`: `POST /api/inquiries` now accepts an
  optional `type` field (`BUYER`/`SELLER`), defaults to `BUYER` so every
  existing caller (nav "Inquire Now", CTA banner, property detail page)
  needs no change
- `backend/src/routes/adminInquiries.js`: `GET /api/admin/inquiries` now
  supports `?type=BUYER|SELLER`
- `frontend/lib/types.ts`: added `InquiryType` + `INQUIRY_TYPES`
- `frontend/lib/adminAuth.ts`: `AdminInquiry.type` added,
  `getAdminInquiries(type?)` forwards the filter as a query param
- `frontend/app/admin/(protected)/inquiries/page.tsx`: added All / Buyers
  / Sellers tabs (URL-driven via `?type=`, same pattern as the Phase 8
  properties filters — not client-side state) and a "Seller" badge on
  seller-type inquiries in the list
- `frontend/components/site/SellerLeadForm.tsx`: dedicated seller lead
  form (name, email, phone, property type, location, optional details),
  submits `POST /api/inquiries` with `type: "SELLER"`
- `frontend/app/(public)/sell/page.tsx`: page shell (gold eyebrow, `<h1>`,
  intro paragraph, modeled on `contact/page.tsx`/`services/page.tsx`)
  wrapping `<SellerLeadForm />`
- `frontend/lib/siteConfig.ts`: `SERVICES` entries now each carry their
  own `href`; the "Selling" card points at `/sell`, "Buying"/"Investing"
  still point at `/contact`
- `frontend/app/(public)/services/page.tsx`: CTA link per card now reads
  `service.href` instead of a hardcoded `/contact`, with copy that reads
  "Get a property valuation →" specifically for the `/sell` link
- `frontend/app/sitemap.ts`: added `/sell` (`changeFrequency: "monthly",
  priority: 0.6`)
- `README.md`: added a "## Phase 13 — Seller Lead Capture" section with
  its own "Still needs a live deploy" checklist
- Build verification run this session: `node -c` clean on every touched/
  existing backend route and lib file; `npm install && npx tsc --noEmit
  && npm run build` clean in `frontend/` — all 20 routes generate,
  including the new `/sell`
- Fixed one real bug surfaced by `tsc --noEmit`:
  `SellerLeadForm.tsx`'s property-type `<select>` passed a bare `string`
  from `e.target.value` into a `useState<PropertyType>` setter; cast to
  `PropertyType` (safe — the `<option>` values only ever come from
  `PROPERTY_TYPES`)

## Current implementation (Phase 14)
- **`preferredDate`/`preferredTime` are plain Strings, not `DateTime`** —
  a deliberate call, not an oversight: they're a visitor's typed
  preference (no calendar sync or admin-confirmation flow exists yet),
  and storing the raw `"YYYY-MM-DD"`/`"HH:MM"` the `<input type="date">`/
  `<input type="time">` elements already produce sidesteps a whole class
  of UTC-vs-local off-by-one-day bug that a `DateTime`/`@db.Time` column
  would introduce the moment it round-trips through JSON between the two
  separately-deployed hosts.
- **No new `InquiryType` value** — a viewing request is still
  `type: "BUYER"`, distinguished only by `preferredDate`/`preferredTime`
  being set. The roadmap's Phase 14 line names the two new columns and
  "a focused viewing-request form," not a new type, so the admin filter
  tabs stayed untouched (still just All/Buyers/Sellers) and the row gets
  a badge instead. **Flag to Zee**: if viewing requests get common enough
  that he wants a dedicated tab, that's a small follow-up, not a schema
  change.
- **Two separate modals, not one modal with a mode prop** —
  `ViewingModal`/`ViewingModalProvider` are new files, not a branch
  inside `InquiryModal`. The two forms ask for different fields (date/
  time pickers vs. free-text message) and have independent open/closed
  state; branching one component on a `mode` prop would have made both
  harder to read for a marginal reduction in file count.
- **`propertyId` is required server-side when booking a viewing** — the
  backend rejects `preferredDate`/`preferredTime` sent without a
  `propertyId`, since "book a viewing" with nothing to view doesn't mean
  anything. Enforced in `validateInquiryPayload`, not the schema (same
  "business rule, not a column constraint" precedent as the existing
  email-or-phone check).

## Earlier-phase implementation notes
- **Schema stayed minimal on purpose** (Phase 13): the only new column
  was `Inquiry.type`. Seller-specific fields (property type, location) are
  *not* new columns — `SellerLeadForm` folds them into the existing
  `message` text field as clearly labeled lines before POSTing. This
  matches the roadmap's literal Phase 13 line ("`Inquiry.type`
  (BUYER/SELLER)") and the codebase's existing philosophy of not adding
  structure until volume justifies it (see the `rentPeriod`/
  `originalPrice` precedents). If Zee's seller volume grows enough to
  want to filter/sort by property type or location specifically, that's
  the signal to promote these into real columns later — flag this to him,
  don't assume it now.
- **`/sell` is a real page, not a modal** — reuses the existing
  `InquiryModalProvider`/`InquiryModal` pattern's *validation* shape but
  not the modal itself, since a seller lead needs fields (property type,
  location) a buyer inquiry never asks for, and it's not a "pop up over
  whatever page you're on" action.
- **`/sell` is deliberately NOT in `NAV_LINKS`** (the six-item
  Home/Properties/About Me/Services/Testimonials/Contact list from the
  reference screenshot) — same reasoning Phase 12 used for not adding the
  saved-listings link there. Resolved this session: it now has *two*
  buttons outside the main nav pointing at it (`TopNav`, `Hero`) plus the
  Services card and the CTA banner text link — four entry points total,
  none of them a nav slot.
- **Global "Book a Viewing" opens the modal with an in-modal property
  picker, not a separate page or a relaxed backend rule** — confirmed
  with Zee before building. `ViewingContext`/`BookViewingButton` props
  are optional now; the backend's propertyId-required check for viewing
  requests is untouched, just satisfied later (at submit, not at open).
- Filter tabs on `/admin/inquiries` follow the "filters live in the query
  string" convention already established by the Phase 8 properties
  filters, not client-side React state.

## Remaining tasks (in order)
Phase 17 is code-complete and build-verified — the roadmap has no phase
after it. What's left before deploying:
1. **Add Zee's real WhatsApp number and Facebook Page username** to
   `CHAT_LINKS` in `frontend/lib/siteConfig.ts` — both are still the
   `"#"` placeholder. `wa.me` needs digits only (country code first,
   e.g. `63` + the number for a PH mobile, no `+`/leading `0`); `m.me`
   needs the Page's username.
2. Run `npx prisma migrate deploy` against Render's database (Phase 16's
   new `Post` table, Phase 14's `preferredDate`/`preferredTime` columns,
   plus confirm every earlier migration already ran; Phase 15 and 17
   needed none).
3. **Deploy and confirm `/areas` reflects real listings** — once live,
   check that `/areas` and the homepage's Popular Areas section list
   every location currently in use, and that each count matches
   `/properties?location=...` for the same area.
4. Book a real viewing end to end on the deployed site; confirm it shows
   up in `/admin/inquiries` with the badge and formatted date/time, and
   check the native date/time pickers on an actual phone.
5. **Write and publish a real post via `/admin/posts/new`**, then
   confirm it appears on `/blog`, the homepage's "From the Blog"
   section, and its own `/blog/[slug]` page after the next deploy
   (`generateStaticParams` runs at build time — a post published after
   the last deploy 404s until the next one, same known limitation Phase
   15 flagged for brand-new areas). Also confirm the cover image upload
   round-trips through Cloudinary correctly.
6. **Tap through both chat channels on a real phone** once real links
   are in — confirm `wa.me` opens the WhatsApp app (not just a browser
   tab) and `m.me` opens Messenger, on both iOS and Android. Also check
   the button doesn't visually collide with anything on narrow mobile
   widths, especially the property detail page's stacked CTAs.
7. ~~Carry forward from Phase 13: decide whether `/sell` needs a more
   prominent CTA beyond the Services page card.~~ Resolved — a `/sell`
   text link lives in the closing CTA banner.

## Known bugs / issues
- **`CHAT_LINKS` is still placeholder (`"#"`)** — the button renders and
  toggles correctly, but neither channel goes anywhere real yet. Not a
  bug in the code, just real values that only Zee can supply.
- **Phase 16's blog content is plain text, not markdown** — deliberate,
  matching the codebase's existing treatment of admin-authored long text
  (`Property.description`). `whitespace-pre-line` turns the admin's
  blank-line paragraph breaks into real spacing; there's no bold/
  links/headings support. Flag to Zee if he wants richer formatting once
  he's writing these regularly — that's a `PostForm`/rendering change,
  not a schema change (`content` is already a plain `String`).
- **No `publishedAt`, so no scheduling/backdating** — a post's displayed
  date is always `createdAt`. Editing a post later touches `updatedAt`,
  not the date shown to readers. Fine for "write it, publish it" today;
  worth a small schema addition if Zee ever wants to schedule a post
  ahead of its publish date.
- **Phase 15's area pages have no formal location taxonomy behind
  them** — deliberate, matching the roadmap's decision against a full
  multi-city taxonomy. An "area" is just whatever exact string is
  already in `Property.location`. Two differently-punctuated locations
  that happen to `slugify()` to the same value would collide onto one
  `/areas/[slug]` page. Not an issue with today's seed data — worth
  knowing about if real listing data ever produces it.
- **`generateStaticParams` only picks up locations known at build
  time** — adding a listing in a brand-new location won't get its own
  `/areas/[slug]` page until the next deploy. Flag to Zee if this
  becomes a real gap; an on-demand fallback would be a small change.
- Pre-existing, unrelated to this phase: `frontend/app/(public)/contact/
  page.tsx` still has a stale comment/copy ("An online inquiry form is on
  its way") left over from before Phase 10 added the InquiryModal. Not in
  scope for Phase 14 — flag to Zee, don't fix silently.

## Important decisions
- **Phase 17**: fixed bottom-right button at `z-30`, chosen after
  checking every existing `z-` class in `components/site/` so it can't
  float above the mobile drawer (`z-40`) or either modal (`z-50`); no
  provider needed since nothing else triggers it; generic icons in
  brand-associated colors instead of unavailable brand-logo icons.
- **Phase 16**: `createdAt` doubles as the post's display date (no
  `publishedAt`); slug is chosen at creation and never re-derived from
  title on save; cover image reuses the existing upload endpoint instead
  of a new one; the edit page finds a post by id through the admin list
  rather than a new `GET /api/admin/posts/:id` route. See "Completed
  work (Phase 16)" above for the full reasoning on each.
- See "Current implementation (Phase 14)" above for that phase's three
  big ones (String not DateTime columns; no new InquiryType; two modals
  not one). See "Earlier-phase implementation notes" for Phase 13's (no
  new schema columns beyond `type`; `/sell` excluded from `NAV_LINKS`).

## Dependencies / setup
- `backend/`: `npm install`, `.env` from `.env.example`
  (`DATABASE_URL`, `FRONTEND_ORIGIN`, `JWT_SECRET`, `ADMIN_EMAIL`/
  `ADMIN_PASSWORD`, `CLOUDINARY_*`), then `npx prisma generate` and
  `npx prisma migrate deploy` (the new Phase 13 migration is included and
  needs to run), `npm run dev`.
- `frontend/`: `npm install`, `.env.local` from `.env.local.example`
  (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`), `npm run dev`.
- Prisma engine binaries are blocked by this sandbox's network policy —
  always run `prisma generate`/`migrate` manually in the real dev/deploy
  environment, never assume they ran here.

## Completed work (Phase 18 — Inquiry CRM Foundation)
Off-roadmap addition, not one of the original 17 phases — Zee requested
a CRM upgrade to the inquiries inbox based on a 12-item recommendation
list, split across three phases by tier. This phase covers the
"Essential" tier (items 1–5):
- `Inquiry.status` (new `InquiryStatus` enum: NEW, CONTACTED, FOLLOW_UP,
  VIEWING_SCHEDULED, NEGOTIATING, CLOSED_WON, CLOSED_LOST — split won/lost
  rather than a single CLOSED so Phase 20's conversion reporting doesn't
  need a second migration), defaulting to NEW.
- `/admin/inquiries/[id]` detail page — full contact info, linked
  property (with refNo), full message, preferred viewing date/time, and
  the status control.
- Property linking made visible: refNo now included in both the list and
  detail responses.
- Search (`?q=`, matches name/email/phone/property title) and filters
  (`?status=`, `?dateFrom=`/`?dateTo=`) on `GET /api/admin/inquiries`,
  combining with the existing `?type=` tabs. New
  `PATCH /api/admin/inquiries/:id` (status only — every other field is a
  verbatim record of the visitor's submission and isn't admin-editable).
- List cards trimmed to name/type/status/viewing badges, contact line,
  property ref, and a truncated message preview; everything else moved
  to the detail page.

**Run this before testing:** new migration
`20260917120000_add_inquiry_status` — from `backend/`, run
`npx prisma migrate deploy` then `npx prisma generate` and restart the
dev server, against whichever `DATABASE_URL` you're testing (local vs.
Render — see the recurring note in `learnings-and-workflow`).

## Completed work (Phase 19 — Inquiry CRM Pipeline)
Covers the "For CRM functionality" tier (items 6–10) of Zee's
recommendation list:
- `GET /api/admin/inquiries/stats` — total/new/follow-up/closed counts
  plus an overdue-follow-ups count, always computed over the whole
  inbox regardless of the list's active filters. Rendered as `StatsBar`
  above the tabs.
- `Inquiry.lastContactedAt` (real DateTime, auto-stamped whenever status
  moves away from NEW) and `Inquiry.nextFollowUpDate` (plain
  "YYYY-MM-DD", admin-set via `FollowUpControl` on the detail page) —
  same string-vs-DateTime split as the Phase 14 preferred-viewing
  fields, for the same reason.
- `InquiryNote` model + `notes` relation — the activity timeline.
  SYSTEM notes auto-created on every status/follow-up/archive change;
  MANUAL notes typed by the admin via `NotesTimeline`'s form. New
  `POST /api/admin/inquiries/:id/notes`.
- `ContactActions` — tel:/mailto:/wa.me links built from the inquiry's
  own contact info (opens a chat with the lead's number, not Zee's
  fixed Phase 17 business number — different direction, see the
  component's file-level comment). No Messenger deep-link exists (no
  FB API integration), so WhatsApp stands in for it.
- Bulk actions: checkbox selection in `InquiriesList` (client component,
  replaces the old inline card-mapping in `page.tsx`) + a floating
  action bar (Mark Contacted / Mark Closed / Archive-Unarchive) hitting
  new `PATCH /api/admin/inquiries/bulk`. `Inquiry.archived` (new
  Boolean) plus a "Show Archived" toggle on the list page — archiving is
  deliberately separate from `status`, so a CLOSED_LOST lead stays
  visible by default.
- `npm install && npm run build` ran clean this session (network access
  was available) — full TypeScript check passed, all 24 routes
  generated, including the three new/changed inquiries pages.

**Run this before testing:** new migration
`20260917140000_add_inquiry_followup_notes` (adds `InquiryNote` table
plus `nextFollowUpDate`/`lastContactedAt`/`archived` on `Inquiry`) — same
`npx prisma migrate deploy && npx prisma generate` + restart as Phase 18,
run against whichever `DATABASE_URL` is active.

## Completed work (UI/UX Phase 1 — Navigation & UI Cleanup)
First entry on the separate 7-phase UI/UX Improvement roadmap
(`references/ui-ux-roadmap.md` in the skill) — not a build-roadmap phase.
Build Phase 5 (sidebar + top nav) was already in place, so this was a
pure layout/CSS pass, no new routes or data:
- `frontend/components/site/TopNav.tsx`: removed the `NAV_LINKS` map that
  duplicated the sidebar's six main links over the hero. TopNav now holds
  exactly what the roadmap specifies — Search, Saved, Book a Viewing,
  Sell Your Property — regrouped into a right-aligned utility cluster
  (Search + Saved) and a CTA cluster (the two pill buttons), separated by
  a thin vertical divider instead of the old `justify-between` split.
- `frontend/components/site/Sidebar.tsx`: hairline dividers
  (`border-t border-offwhite/10`) added between each section (profile
  block / nav / social+theme / tagline) so the profile block → nav →
  social → theme toggle → tagline hierarchy from `SKILL.md` reads on its
  own rather than through margin alone. Active nav-link state strengthened
  — `bg-white/10` (was `/5`) plus `font-semibold` and `aria-current="page"`
  — and inactive links get a visible `hover:border-offwhite/30` instead of
  jumping straight from transparent to gold on hover.
- `frontend/components/site/SavedListingsLink.tsx`: the sidebar's `"row"`
  variant (the `/saved` entry rendered right after the `NAV_LINKS` map)
  got the same active-state and `aria-current` treatment, so it doesn't
  look like a different tier of nav item now that duplication is gone.
- Left untouched, per scope: `SiteChrome.tsx`'s mobile header/drawer
  (already reused `Sidebar` as-is, no duplication there to fix),
  `NavSearch.tsx`, `ThemeToggle.tsx`, `BookViewingButton.tsx` — no props
  or behavior changed, only how/where TopNav composes them.
- **Not build-verified this session** — this sandbox has no network
  access, so `npm install` couldn't run and `next build`/`tsc --noEmit`
  couldn't be checked here. Run `npm install && npx tsc --noEmit && npm
  run build` in `frontend/` before deploying to confirm. No backend
  changes this phase, so no migration and no backend check needed.

## Completed work (Phase 20 — Security & Analytics, IN PROGRESS)
**Checkpoint, not code-complete.** Covers the "Security" half of UI/UX
Phase 7 in full, and the backend half of "Analytics" in full. Frontend
analytics UI is NOT built yet.

Done:
- `backend/prisma/schema.prisma` + migration
  `20260917160000_add_inquiry_source_spam`: new `InquirySource` enum,
  `Inquiry.spam`/`source`/`closedAt` columns, three indexes
  (`propertyId`, `status`, `[spam, archived]`). Migration backfills
  `closedAt` for already-closed rows.
- `backend/src/lib/turnstile.js` (new): Cloudflare Turnstile
  verification, skipped entirely (fails open) when
  `TURNSTILE_SECRET_KEY` is unset; also fails open if Cloudflare itself
  is unreachable — only a genuinely rejected token fails closed.
- `backend/src/lib/spamFilter.js` (new): honeypot + keyword/link/
  no-whitespace heuristics. Flags are stored (`spam = true`), never
  rejected — a false positive stays recoverable from the admin Spam
  view (view not yet built, see below).
- `backend/src/middleware/inquiryRateLimit.js`: now two stacked
  windows (3/min burst + the original Phase 10 5/15min), exported as
  an array — route signature unchanged.
- `backend/src/middleware/authRateLimit.js` (new): brute-force guard
  on `POST /api/admin/login`, failures-only so Zee can't lock himself
  out.
- `backend/src/routes/inquiries.js`: stricter validation (phone digit
  count via a separate digits-only check, lowercased email, name/
  message minimums), Turnstile call, spam flagging, 24h duplicate
  detection (same contact + same property, or same contact + identical
  message) — a duplicate's new text is appended as a SYSTEM note to the
  original lead rather than dropped.
- `backend/src/routes/adminInquiries.js`: `?spam=true` opt-in list
  view (mirrors `?archived=true`), spam excluded from
  `/inquiries/stats`, `spam` now settable on both the single and bulk
  PATCH routes, `closedAt` auto-set/cleared alongside `status`.
- `backend/src/routes/adminAnalytics.js` (new):
  `GET /api/admin/analytics?days=7|30|90|365|0`. Per-property inquiry/
  win counts, conversion rate vs. win rate (two different questions,
  see file comment), avg days to close, lead-source breakdown,
  12-month trend (raw SQL — the one thing Prisma's groupBy can't
  express). Spam always excluded.
- `backend/src/routes/adminAuth.js`, `src/server.js`,
  `backend/.env.example`: wired the new limiter/router in.
- Frontend: `components/site/TurnstileWidget.tsx` and
  `HoneypotField.tsx` (new); `lib/siteConfig.ts` (`TURNSTILE_SITE_KEY`),
  `lib/types.ts` (`InquirySource`, `InquiryAnalytics`, `spam` on
  `InquiryStats`), `lib/adminAuth.ts` (`spam`/`source`/`closedAt` on
  `AdminInquiry`, `getAdminAnalytics()`), `.env.local.example`
  extended.
- Frontend: `InquiryModal.tsx`, `ViewingModal.tsx`,
  `SellerLeadForm.tsx` — all three now render the honeypot + Turnstile
  widget, send `source`/`turnstileToken`/`website` on submit, reset
  the Turnstile token on a failed submit, and show a distinct
  duplicate-submission success message.

**Not done yet:**
- `InquiryModalProvider`/`InquireButton`/`CTABanner` don't thread a
  `source` prop through yet — `InquiryModal` currently guesses
  NAV_CTA vs. PROPERTY_PAGE from whether `propertyId` is present,
  which is right for the nav button and the property page but will
  mis-tag the CTA banner as NAV_CTA until this is wired through
  explicitly.
- No `/admin/analytics` page — the backend endpoint has no UI yet.
- No Spam toggle/badge in the admin inbox (`InquiriesFilterBar`,
  `InquiriesList`, `StatsBar` untouched) — `?spam=true` and the
  `spam` field on `PATCH` both work, just nothing in the UI calls
  them yet.
- README.md not updated with a Phase 20 section.
- **No build verification run this session** (no code-execution
  network access) — run `npm install && npx tsc --noEmit && npm run
  build` in `frontend/`, and `node --check` across `backend/src/`,
  before deploying. All new backend files were syntax-checked with
  `node --check` as they were written.
- New migration `20260917160000_add_inquiry_source_spam` needs
  `npx prisma migrate deploy` + `npx prisma generate` + restart, same
  as every earlier phase's migration.
- `TURNSTILE_SECRET_KEY` (backend) / `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
  (frontend) are both optional — unset, the CAPTCHA simply doesn't
  render and verification is skipped. Create the widget at
  dash.cloudflare.com > Turnstile when ready.

## Completed work (Phase 20 — Security & Analytics tier) — CHECKPOINT, IN PROGRESS
Off-roadmap CRM work, "Security & analytics" tier flagged at the end of
Phase 19. **This checkpoint is a partial save, not a finished phase** —
see "Still outstanding" below before treating this as done.

**Backend — complete, `node --check` clean on every touched file:**
- `prisma/schema.prisma` / new migration
  `20260917160000_add_inquiry_source_spam`: `InquirySource` enum (NAV_CTA,
  PROPERTY_PAGE, CTA_BANNER, VIEWING_FORM, SELL_PAGE, DIRECT, defaulting
  to DIRECT), `Inquiry.spam` (Boolean, default false — a separate axis
  from `archived`/`status`, same reasoning as Phase 19's `archived`: a
  false positive has to be recoverable), `Inquiry.source`,
  `Inquiry.closedAt` (DateTime, stamped/cleared alongside status moving
  into/out of CLOSED_WON/CLOSED_LOST), three indexes
  (`propertyId`, `status`, `[spam, archived]`). Migration backfills
  `closedAt` for rows already closed before this migration, from
  `createdAt` — bounded-wrong rather than NULL, so the average-days-to-
  close figure doesn't silently drop historical leads.
- `src/lib/turnstile.js` (new): Cloudflare Turnstile server-side
  verification. No `TURNSTILE_SECRET_KEY` set → verification is skipped
  entirely (logged once at startup) rather than hard-failing dev/first
  deploy. Fails OPEN only on a Cloudflare network/timeout error; a
  genuinely rejected token still fails closed.
- `src/lib/spamFilter.js` (new): honeypot check, a short keyword list,
  excessive-link detection, link-in-name, and a no-whitespace long-string
  check. Returns `{spam, reason}`; never used to reject a request outright
  — see `inquiries.js`.
- `src/middleware/inquiryRateLimit.js`: was a single 5-per-15-min limiter,
  now exported as an array of two (`3/min` burst + the original
  `5/15min` sustained) — Express treats an array as an ordered middleware
  chain, so the route's call site (`router.post("/", inquiryRateLimit,
  …)`) didn't need to change.
- `src/middleware/authRateLimit.js` (new): 10 failed attempts / 15 min on
  `POST /api/admin/login`, `skipSuccessfulRequests: true` so Zee's own
  logins never count against it.
- `src/routes/inquiries.js`: rewritten. Tighter validation (phone now
  digit-counted, 7–15 digits, not just length-capped; email lowercased
  before storage/comparison; name requires a letter and 2+ chars; message
  requires 5+ chars). Request flow is now: rate limit (middleware) →
  validate → Turnstile → spam heuristics → duplicate check → insert. A
  flagged-spam or detected-duplicate submission still returns a normal
  2xx to the client (a bot learns nothing; a double-submitting human isn't
  told off) — spam is inserted with `spam: true` and hidden from the
  default inbox, a duplicate returns the *original* row's id and, if the
  new message differs from the original, appends it to that inquiry's
  Phase 19 `InquiryNote` timeline as a SYSTEM entry instead of creating a
  second row.
- `src/routes/adminInquiries.js`: stats endpoint and the list endpoint
  both now exclude `spam: true` by default (spam isn't a lead); `?spam=
  true` opts into the Spam review view, same opt-in shape as `?archived=
  true`. Both PATCH routes (`/inquiries/:id` and `/inquiries/bulk`) can
  now set `spam` (with a SYSTEM note logged either direction) and
  maintain `closedAt` automatically whenever `status` changes.
- `src/routes/adminAnalytics.js` (new): `GET /api/admin/analytics?days=`
  (7/30/90/365/0-for-all-time, validated against a fixed list). Returns
  totals, status/type/source breakdowns, conversion figures (both
  `conversionRate` = won ÷ everything, and `winRate` = won ÷ decided,
  reported separately since they answer different questions),
  `avgDaysToClose` (null until something has actually closed), top
  properties by inquiry count with a per-property won count, and a
  12-month trend via one raw `date_trunc` query (the one thing Prisma's
  `groupBy` can't express — no user input is interpolated into it).
  Everything else is Prisma's typed aggregate API, not a full-table fetch
  reduced in JS, so this stays flat as the inbox grows.
- `src/routes/adminAuth.js`, `src/server.js`, `backend/.env.example`:
  wired the new rate limiter and analytics router in; added
  `TURNSTILE_SECRET_KEY` to the env example (optional — unset disables
  CAPTCHA verification, nothing else).

**Frontend — in progress:**
- `components/site/TurnstileWidget.tsx` (new): renders nothing when
  `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is unset. Loads the Turnstile script
  once at module scope (not `next/script`, since these widgets mount
  inside modals that mount/unmount repeatedly) and renders in explicit
  mode, since automatic mode only scans the DOM once at page load and
  these don't exist yet then. Exposes a `resetSignal` prop the forms bump
  after a failed submit, since a Turnstile token is single-use.
- `components/site/HoneypotField.tsx` (new): shared by all three public
  forms. Off-screen positioning (not `display:none`) plus
  `aria-hidden`/`tabIndex={-1}`/`autoComplete="off"` — hidden from real
  users and screen readers, not skipped by bots smart enough to check
  `display`.
- `lib/siteConfig.ts`: added `TURNSTILE_SITE_KEY` (reads
  `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, empty string if unset).
- `lib/types.ts`: added `InquirySource` + `INQUIRY_SOURCE_LABELS`,
  `InquiryAnalytics` (mirrors the new endpoint), `spam` added to
  `InquiryStats`.
- `lib/adminAuth.ts`: `AdminInquiry` gained `spam`/`source`/`closedAt`;
  `AdminInquiryFilters` gained `spam?`; new `getAdminAnalytics(days)`.
- `frontend/.env.local.example`: added
  `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (optional).
- `components/site/InquiryModal.tsx`, `ViewingModal.tsx`,
  `SellerLeadForm.tsx`: all three now render `HoneypotField` +
  `TurnstileWidget`, block submission client-side when Turnstile is
  configured but unsolved, send `turnstileToken`/`website`/`source` in
  the POST body, reset the Turnstile challenge on a failed submit (token
  reuse would otherwise get rejected), and show a distinct "already got
  this one" success message when the backend reports `duplicate: true`.
  `InquiryModal` infers a fallback source (`PROPERTY_PAGE` vs `NAV_CTA`)
  when its trigger doesn't pass one explicitly yet.

**Still outstanding — none of this is built yet:**
- `InquiryModalProvider`'s `InquiryContext` type, and `InquireButton`,
  need an explicit `source` field threaded through so `CTABanner` (should
  send `CTA_BANNER`) and the property detail page's sidebar trigger
  (`PROPERTY_PAGE`) stop relying on `InquiryModal`'s fallback guess.
  `TopNav`'s "Inquire Now" should pass `NAV_CTA` explicitly for the same
  reason.
- No `/admin/analytics` page yet — the whole point of
  `adminAnalytics.js`/`getAdminAnalytics()` has no UI consuming it.
- No Spam view in the admin inquiries UI — no tab/toggle for `?spam=
  true`, no per-row "Mark as spam"/"Not spam" action, no spam count
  surfaced in `StatsBar`. The backend fully supports this (list filter,
  bulk PATCH, single PATCH); nothing calls it yet.
- No nav link from `/admin` or `/admin/inquiries` to the new analytics
  page (same cross-link pattern the Listings/Inquiries/Blog Posts admin
  sections already share).
- `README.md` has no Phase 20 section (every prior phase gets one, with
  its own "still needs a live deploy" checklist — this phase needs
  Cloudflare Turnstile account setup called out there).
- **Not build-verified.** `node --check` passed on every backend file
  this session; the frontend changes are untyped/unbuilt — no
  `npm install`, `tsc --noEmit`, or `next build` has run against them
  (no network access in this sandbox). Run those before deploying,
  especially given the new TypeScript types and a fair amount of
  cross-file plumbing (`InquiryContext`, `InquiryAnalytics`) added this
  session.
- New migration `20260917160000_add_inquiry_source_spam` has **not been
  run** against any database (same as every prior phase's migrations at
  checkpoint time) — `npx prisma migrate deploy && npx prisma generate`
  needed before this is testable at all.

## Next task (superseded)
See the "Next task" note near the top of this file (under "Current
milestone") for the up-to-date version — `source` threading and the Spam
view are done as of this session; the analytics page, cross-links, and
README section are what's left.
