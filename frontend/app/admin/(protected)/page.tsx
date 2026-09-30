import Link from "next/link";
import { getAdminSession, getAdminProperties } from "@/lib/adminAuth";
import LogoutButton from "./LogoutButton";
import PropertiesTable from "./PropertiesTable";

// Replaces the Phase 3 placeholder now that there's real CRUD to show.
// Phase 27: reads from the authenticated GET /api/admin/properties (not
// the public route) so DRAFT listings show up here too — the public
// route now hard-excludes them.
export default async function AdminDashboardPage() {
  const [session, properties] = await Promise.all([
    getAdminSession(),
    getAdminProperties(),
  ]);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy">Listings</h1>
          <p className="mt-1 text-sm text-navy/60">
            Signed in as <span className="font-medium">{session?.email}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/inquiries"
            className="rounded-full border border-navy/20 px-4 py-2 text-sm font-medium text-navy transition hover:border-navy/40"
          >
            Inquiries
          </Link>
          {/* Phase 16 */}
          <Link
            href="/admin/posts"
            className="rounded-full border border-navy/20 px-4 py-2 text-sm font-medium text-navy transition hover:border-navy/40"
          >
            Blog Posts
          </Link>
          {/* Phase 20 */}
          <Link
            href="/admin/subscribers"
            className="rounded-full border border-navy/20 px-4 py-2 text-sm font-medium text-navy transition hover:border-gold hover:text-gold"
          >
            Alert Subscribers
          </Link>
          {/* Trust & polish */}
          <Link
            href="/admin/guide-leads"
            className="rounded-full border border-navy/20 px-4 py-2 text-sm font-medium text-navy transition hover:border-gold hover:text-gold"
          >
            Guide Downloads
          </Link>
          <Link
            href="/admin/analytics"
            className="rounded-full border border-navy/20 px-4 py-2 text-sm font-medium text-navy transition hover:border-navy/40"
          >
            Analytics
          </Link>
          <Link
            href="/admin/calendar"
            className="rounded-full border border-navy/20 px-4 py-2 text-sm font-medium text-navy transition hover:border-navy/40"
          >
            Viewing Calendar
          </Link>
          <Link
            href="/admin/properties/new"
            className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-navy transition hover:bg-gold-light"
          >
            Add Listing
          </Link>
          <LogoutButton />
        </div>
      </div>

      <PropertiesTable properties={properties} apiUrl={apiUrl} />
    </main>
  );
}
