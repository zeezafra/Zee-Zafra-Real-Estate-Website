import Link from "next/link";
import { getAdminSession, getAdminAnalytics } from "@/lib/adminAuth";
import { INQUIRY_SOURCE_LABELS, INQUIRY_STATUSES, PROPERTY_STATUSES } from "@/lib/types";
import { formatMonthLabel, formatPercent, formatRefNo } from "@/lib/format";
import LogoutButton from "../LogoutButton";

const RANGES: { label: string; days: number }[] = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "1 year", days: 365 },
  { label: "All time", days: 0 },
];

function statusLabel(status: string): string {
  return INQUIRY_STATUSES.find((s) => s.value === status)?.label ?? status;
}

function propertyStatusLabel(status: string): string {
  return PROPERTY_STATUSES.find((s) => s.value === status)?.label ?? status;
}

// A small horizontal bar row — count against `max` for the fill width.
// Plain divs, not a charting library: this codebase has none installed
// (see package.json), matching the "no markdown renderer for a one-admin
// blog" precedent of not adding a dependency for a single, simple page.
function BarRow({
  label,
  count,
  max,
  secondary,
}: {
  label: string;
  count: number;
  max: number;
  secondary?: string;
}) {
  const width = max > 0 ? Math.max((count / max) * 100, count > 0 ? 3 : 0) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <p className="w-40 shrink-0 truncate text-navy/70">{label}</p>
      <div className="h-5 flex-1 overflow-hidden rounded-full bg-navy/5">
        <div className="h-full rounded-full bg-gold" style={{ width: `${width}%` }} />
      </div>
      <p className="w-24 shrink-0 text-right font-medium text-navy">
        {count}
        {secondary && <span className="ml-1 font-normal text-navy/50">{secondary}</span>}
      </p>
    </div>
  );
}

// Phase 20 / UI/UX Phase 7 (Security, Analytics & Optimization). The
// reporting half of the analytics endpoint built last session —
// GET /api/admin/analytics — finally gets a UI. Range picked via
// ?days=, same URL-driven-filter convention as /admin/inquiries. Every
// number here already excludes spam on the backend (see the schema
// comment on adminAnalytics.js's rangeFilter) — spamBlocked is reported
// separately so the filter's effect stays visible instead of just
// vanishing the count.
export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: { days?: string };
}) {
  const requestedDays = Number.parseInt(searchParams.days ?? "30", 10);
  const days = RANGES.some((r) => r.days === requestedDays) ? requestedDays : 30;

  const [session, analytics] = await Promise.all([
    getAdminSession(),
    getAdminAnalytics(days),
  ]);

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy">Analytics</h1>
          <p className="mt-1 text-sm text-navy/60">
            Signed in as <span className="font-medium">{session?.email}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin"
            className="rounded-full border border-navy/20 px-4 py-2 text-sm font-medium text-navy transition hover:border-navy/40"
          >
            Listings
          </Link>
          <Link
            href="/admin/inquiries"
            className="rounded-full border border-navy/20 px-4 py-2 text-sm font-medium text-navy transition hover:border-navy/40"
          >
            Inquiries
          </Link>
          <Link
            href="/admin/posts"
            className="rounded-full border border-navy/20 px-4 py-2 text-sm font-medium text-navy transition hover:border-navy/40"
          >
            Blog Posts
          </Link>
          <LogoutButton />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {RANGES.map((range) => (
          <Link
            key={range.label}
            href={`/admin/analytics?days=${range.days}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              range.days === days
                ? "bg-navy text-offwhite"
                : "border border-navy/20 text-navy hover:border-navy/40"
            }`}
          >
            {range.label}
          </Link>
        ))}
      </div>

      {!analytics ? (
        <p className="mt-8 text-sm text-navy/60">
          Analytics aren&rsquo;t available right now — try refreshing, or
          check that the backend is reachable.
        </p>
      ) : (
        <div className="mt-8 space-y-10">
          {/* Totals */}
          <section>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "All-time Leads", value: analytics.totals.allTime },
                { label: `In Range (${days === 0 ? "all time" : `${days}d`})`, value: analytics.totals.inRange },
                { label: "Open", value: analytics.totals.open },
                { label: "Spam Blocked", value: analytics.totals.spamBlocked },
                { label: "Buyers", value: analytics.totals.buyers },
                { label: "Sellers", value: analytics.totals.sellers },
                { label: "Viewing Requests", value: analytics.totals.viewingRequests },
              ].map((card) => (
                <div key={card.label} className="rounded-xl border border-navy/10 p-4">
                  <p className="text-2xl font-bold text-navy">{card.value}</p>
                  <p className="text-xs font-medium uppercase tracking-wide text-navy/50">
                    {card.label}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Conversion */}
          <section>
            <h2 className="text-lg font-bold text-navy">Conversion</h2>
            <p className="mt-1 text-sm text-navy/60">
              Two different questions get two different rates:{" "}
              <span className="font-medium">conversion rate</span> is of
              everything that came in; <span className="font-medium">win
              rate</span> is of everything that&rsquo;s actually been
              decided one way or the other.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {[
                { label: "Closed Won", value: analytics.conversion.closedWon },
                { label: "Closed Lost", value: analytics.conversion.closedLost },
                { label: "Conversion Rate", value: formatPercent(analytics.conversion.conversionRate) },
                { label: "Win Rate", value: formatPercent(analytics.conversion.winRate) },
                {
                  label: "Avg. Days to Close",
                  value:
                    analytics.conversion.avgDaysToClose === null
                      ? "\u2014"
                      : analytics.conversion.avgDaysToClose.toFixed(1),
                },
              ].map((card) => (
                <div key={card.label} className="rounded-xl border border-navy/10 p-4">
                  <p className="text-2xl font-bold text-navy">{card.value}</p>
                  <p className="text-xs font-medium uppercase tracking-wide text-navy/50">
                    {card.label}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* By status */}
          <section>
            <h2 className="text-lg font-bold text-navy">By Status</h2>
            <div className="mt-4 space-y-2.5">
              {INQUIRY_STATUSES.map((s) => (
                <BarRow
                  key={s.value}
                  label={s.label}
                  count={analytics.byStatus[s.value]}
                  max={Math.max(...Object.values(analytics.byStatus), 1)}
                />
              ))}
            </div>
          </section>

          {/* By source */}
          <section>
            <h2 className="text-lg font-bold text-navy">Lead Sources</h2>
            <p className="mt-1 text-sm text-navy/60">
              Where each inquiry came in from, set by the form that
              submitted it (see <code>InquirySource</code>) — not
              inferred after the fact.
            </p>
            {analytics.bySource.length === 0 ? (
              <p className="mt-4 text-sm text-navy/60">
                No inquiries in this range yet.
              </p>
            ) : (
              <div className="mt-4 space-y-2.5">
                {analytics.bySource.map((row) => (
                  <BarRow
                    key={row.source}
                    label={INQUIRY_SOURCE_LABELS[row.source]}
                    count={row.count}
                    max={Math.max(...analytics.bySource.map((r) => r.count), 1)}
                    secondary={`${row.won} won`}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Top properties */}
          <section>
            <h2 className="text-lg font-bold text-navy">Top Properties by Inquiries</h2>
            {analytics.topProperties.length === 0 ? (
              <p className="mt-4 text-sm text-navy/60">
                No property-linked inquiries in this range yet.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto rounded-xl border border-navy/10">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-navy/5 text-navy/70">
                    <tr>
                      <th className="px-4 py-3 font-medium">Ref #</th>
                      <th className="px-4 py-3 font-medium">Title</th>
                      <th className="px-4 py-3 font-medium">Location</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Inquiries</th>
                      <th className="px-4 py-3 font-medium text-right">Won</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topProperties.map((p) => (
                      <tr key={p.id} className="border-t border-navy/10">
                        <td className="px-4 py-3 font-mono text-xs text-navy/60">
                          {formatRefNo(p.refNo)}
                        </td>
                        <td className="px-4 py-3 font-medium text-navy">
                          <Link
                            href={`/admin/properties/${p.id}/edit`}
                            className="hover:text-gold hover:underline"
                          >
                            {p.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-navy/70">{p.location}</td>
                        <td className="px-4 py-3 text-navy/70">
                          {propertyStatusLabel(p.status)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-navy">
                          {p.inquiries}
                        </td>
                        <td className="px-4 py-3 text-right text-navy/70">{p.won}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Most-viewed properties */}
          <section>
            <h2 className="text-lg font-bold text-navy">Most-Viewed Properties</h2>
            <p className="mt-1 text-sm text-navy/60">
              All-time view counts, not scoped to the date range above —
              a listing&rsquo;s view count doesn&rsquo;t reset, so
              there&rsquo;s no per-range figure to show yet.
            </p>
            {analytics.topViewedProperties.length === 0 ? (
              <p className="mt-4 text-sm text-navy/60">
                No property detail pages have been viewed yet.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto rounded-xl border border-navy/10">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="bg-navy/5 text-navy/70">
                    <tr>
                      <th className="px-4 py-3 font-medium">Ref #</th>
                      <th className="px-4 py-3 font-medium">Title</th>
                      <th className="px-4 py-3 font-medium">Location</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Views</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topViewedProperties.map((p) => (
                      <tr key={p.id} className="border-t border-navy/10">
                        <td className="px-4 py-3 font-mono text-xs text-navy/60">
                          {formatRefNo(p.refNo)}
                        </td>
                        <td className="px-4 py-3 font-medium text-navy">
                          <Link
                            href={`/admin/properties/${p.id}/edit`}
                            className="hover:text-gold hover:underline"
                          >
                            {p.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-navy/70">{p.location}</td>
                        <td className="px-4 py-3 text-navy/70">
                          {propertyStatusLabel(p.status)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-navy">
                          {p.viewCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Most-favorited properties */}
          <section>
            <h2 className="text-lg font-bold text-navy">Most-Favorited Properties</h2>
            <p className="mt-1 text-sm text-navy/60">
              All-time favorite counts, not scoped to the date range above —
              favorites live in each visitor&rsquo;s browser (there&rsquo;s
              no per-visit or per-range breakdown to show).
            </p>
            {analytics.topFavoritedProperties.length === 0 ? (
              <p className="mt-4 text-sm text-navy/60">
                No listings have been favorited yet.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto rounded-xl border border-navy/10">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="bg-navy/5 text-navy/70">
                    <tr>
                      <th className="px-4 py-3 font-medium">Ref #</th>
                      <th className="px-4 py-3 font-medium">Title</th>
                      <th className="px-4 py-3 font-medium">Location</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Favorites</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topFavoritedProperties.map((p) => (
                      <tr key={p.id} className="border-t border-navy/10">
                        <td className="px-4 py-3 font-mono text-xs text-navy/60">
                          {formatRefNo(p.refNo)}
                        </td>
                        <td className="px-4 py-3 font-medium text-navy">
                          <Link
                            href={`/admin/properties/${p.id}/edit`}
                            className="hover:text-gold hover:underline"
                          >
                            {p.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-navy/70">{p.location}</td>
                        <td className="px-4 py-3 text-navy/70">
                          {propertyStatusLabel(p.status)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-navy">
                          {p.favoriteCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Monthly trend */}
          <section>
            <h2 className="text-lg font-bold text-navy">Last 12 Months</h2>
            {analytics.byMonth.length === 0 ? (
              <p className="mt-4 text-sm text-navy/60">Not enough history yet.</p>
            ) : (
              <div className="mt-4 space-y-2.5">
                {analytics.byMonth.map((row) => (
                  <BarRow
                    key={row.month}
                    label={formatMonthLabel(row.month)}
                    count={row.count}
                    max={Math.max(...analytics.byMonth.map((r) => r.count), 1)}
                    secondary={`${row.won} won`}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
