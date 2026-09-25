import Link from "next/link";
import { getAdminSession, getAdminInquiries, getAdminInquiryStats } from "@/lib/adminAuth";
import type { InquiryStatus, InquiryType } from "@/lib/types";
import { INQUIRY_STATUSES } from "@/lib/types";
import LogoutButton from "../LogoutButton";
import InquiriesFilterBar from "./InquiriesFilterBar";
import StatsBar from "./StatsBar";
import InquiriesList from "./InquiriesList";

const TABS: { label: string; type?: InquiryType }[] = [
  { label: "All" },
  { label: "Buyers", type: "BUYER" },
  { label: "Sellers", type: "SELLER" },
];

function isValidType(value?: string): value is InquiryType {
  return value === "BUYER" || value === "SELLER";
}

function isValidStatus(value?: string): value is InquiryStatus {
  return INQUIRY_STATUSES.some((s) => s.value === value);
}

// Phase 10, extended through 13/14/18/19. Read-only-at-a-glance inbox.
//
// Phase 19 adds: a stats bar (item 6), the archived/active toggle (backs
// item 10's archive action), and hands card rendering + bulk-select off
// to InquiriesList (a client component, since selection state and the
// bulk action bar need interactivity the rest of this page doesn't).
// Phase 20. Active/Archived/Spam are mutually exclusive views, not two
// independent checkboxes, even though the backend's `archived`/`spam`
// filters are independent booleans that could technically combine — a
// three-way view selector is a simpler mental model than "show archived
// spam" as its own state, and nothing in the admin UI needs that
// combination. Selecting one clears the other.
const VIEWS: { label: string; archived?: boolean; spam?: boolean }[] = [
  { label: "Active" },
  { label: "Archived", archived: true },
  { label: "Spam", spam: true },
];

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: {
    type?: string;
    status?: string;
    q?: string;
    dateFrom?: string;
    dateTo?: string;
    archived?: string;
    spam?: string;
  };
}) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const activeType = isValidType(searchParams.type) ? searchParams.type : undefined;
  const activeStatus = isValidStatus(searchParams.status) ? searchParams.status : undefined;
  const showSpam = searchParams.spam === "true";
  const showArchived = !showSpam && searchParams.archived === "true";
  const activeView = showSpam ? "Spam" : showArchived ? "Archived" : "Active";

  const [session, inquiries, stats] = await Promise.all([
    getAdminSession(),
    getAdminInquiries({
      type: activeType,
      status: activeStatus,
      q: searchParams.q,
      dateFrom: searchParams.dateFrom,
      dateTo: searchParams.dateTo,
      archived: showArchived,
      spam: showSpam,
    }),
    getAdminInquiryStats(),
  ]);

  function withParam(overrides: Record<string, string | undefined>): string {
    const params = new URLSearchParams();
    const merged = {
      type: searchParams.type,
      status: searchParams.status,
      q: searchParams.q,
      dateFrom: searchParams.dateFrom,
      dateTo: searchParams.dateTo,
      archived: searchParams.archived,
      spam: searchParams.spam,
      ...overrides,
    };
    Object.entries(merged).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const qs = params.toString();
    return qs ? `/admin/inquiries?${qs}` : "/admin/inquiries";
  }

  const hasActiveFilters =
    activeStatus || searchParams.q || searchParams.dateFrom || searchParams.dateTo;

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy">Inquiries</h1>
          <p className="mt-1 text-sm text-navy/60">
            Signed in as <span className="font-medium">{session?.email}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin"
            className="rounded-full border border-navy/20 px-4 py-2 text-sm font-medium text-navy transition hover:border-navy/40"
          >
            ← Listings
          </Link>
          {/* Phase 20 */}
          <Link
            href="/admin/analytics"
            className="rounded-full border border-navy/20 px-4 py-2 text-sm font-medium text-navy transition hover:border-navy/40"
          >
            Analytics
          </Link>
          <LogoutButton />
        </div>
      </div>

      {stats && <StatsBar stats={stats} />}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {TABS.map((tab) => {
            const active = tab.type === activeType;
            return (
              <Link
                key={tab.label}
                href={withParam({ type: tab.type })}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-navy text-offwhite"
                    : "border border-navy/20 text-navy hover:border-navy/40"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
        <div className="flex gap-2">
          {VIEWS.map((view) => {
            const active = view.label === activeView;
            return (
              <Link
                key={view.label}
                href={withParam({
                  archived: view.archived ? "true" : undefined,
                  spam: view.spam ? "true" : undefined,
                })}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-navy text-offwhite"
                    : "border border-navy/20 text-navy hover:border-navy/40"
                }`}
              >
                {view.label === "Spam" && stats ? `Spam (${stats.spam})` : view.label}
              </Link>
            );
          })}
        </div>
      </div>

      <InquiriesFilterBar />

      {inquiries.length === 0 ? (
        <p className="mt-8 text-sm text-navy/60">
          {hasActiveFilters || activeType
            ? "No inquiries match these filters."
            : showSpam
              ? "No spam flagged. Nothing's been caught yet."
              : showArchived
                ? "No archived inquiries."
                : "No inquiries yet. They\u2019ll show up here as visitors submit the contact form on the site."}
        </p>
      ) : (
        <InquiriesList
          inquiries={inquiries}
          apiUrl={apiUrl}
          showArchived={showArchived}
          showSpam={showSpam}
        />
      )}
    </main>
  );
}
