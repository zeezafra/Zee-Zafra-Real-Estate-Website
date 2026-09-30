import Link from "next/link";
import { getAdminAlerts } from "@/lib/adminAuth";
import { PROPERTY_TYPES } from "@/lib/types";
import type { SavedSearchRow } from "@/lib/types";
import LogoutButton from "../LogoutButton";
import RemoveSubscriberButton from "./RemoveSubscriberButton";

export const metadata = { title: "Alert Subscribers" };

function criteria(s: SavedSearchRow): string {
  const parts: string[] = [];
  if (s.listingType) parts.push(s.listingType === "FOR_RENT" ? "For rent" : "For sale");
  if (s.type) parts.push(PROPERTY_TYPES.find((t) => t.value === s.type)?.label ?? s.type);
  if (s.location) parts.push(`in ${s.location}`);
  if (s.minBeds != null) parts.push(`${s.minBeds}+ beds`);
  if (s.minPrice != null || s.maxPrice != null) {
    parts.push(
      `₱${s.minPrice != null ? s.minPrice.toLocaleString() : "0"}–${s.maxPrice != null ? "₱" + s.maxPrice.toLocaleString() : "any"}`
    );
  }
  return parts.length ? parts.join(", ") : "All new listings";
}

// Phase 26. Read-only overview of who's signed up for new-listing alerts,
// with a remove button for anyone who writes asking to be taken off.
export default async function SubscribersPage() {
  const rows = await getAdminAlerts();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const confirmed = rows?.filter((r) => r.confirmedAt).length ?? 0;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin" className="text-sm text-navy/60 underline-offset-2 hover:underline">← Dashboard</Link>
          <h1 className="mt-1 text-2xl font-bold text-navy">Alert Subscribers</h1>
          {rows && (
            <p className="mt-1 text-sm text-navy/60">
              {confirmed} confirmed · {rows.length - confirmed} awaiting confirmation
            </p>
          )}
        </div>
        <LogoutButton />
      </div>

      {rows === null ? (
        <p className="mt-8 rounded-lg bg-red-100 px-4 py-3 text-sm font-medium text-red-700">
          Couldn&rsquo;t load subscribers. Has the latest migration been applied on the backend?
        </p>
      ) : rows.length === 0 ? (
        <p className="mt-8 text-navy/60">No one has signed up for alerts yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-navy/10">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-navy/5 text-navy/70">
              <tr>
                <th className="p-3">Email</th>
                <th className="p-3">Looking for</th>
                <th className="p-3">Status</th>
                <th className="p-3">Signed up</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-navy/10 text-navy">
                  <td className="p-3 font-medium">{r.email}</td>
                  <td className="p-3">{criteria(r)}</td>
                  <td className="p-3">
                    {r.confirmedAt ? (
                      <span className="text-emerald-600">Confirmed</span>
                    ) : (
                      <span className="text-navy/50">Pending</span>
                    )}
                  </td>
                  <td className="p-3 text-navy/60">{new Date(r.createdAt).toLocaleDateString("en-PH")}</td>
                  <td className="p-3 text-right">
                    <RemoveSubscriberButton id={r.id} apiUrl={apiUrl} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
