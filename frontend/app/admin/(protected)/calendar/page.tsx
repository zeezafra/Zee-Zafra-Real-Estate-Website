import Link from "next/link";
import { getAdminViewings } from "@/lib/adminAuth";
import LogoutButton from "../LogoutButton";
import CalendarView from "./CalendarView";

export const metadata = { title: "Viewing Calendar" };

// Phase 27. Every inquiry with a viewing preference (preferredDate set),
// visual instead of scanning the inbox for them. Data fetch stays a plain
// server component; the month grid + day list are client-side (CalendarView)
// since navigating months and picking a day are local UI state.
export default async function ViewingCalendarPage() {
  const viewings = await getAdminViewings();

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin" className="text-sm text-navy/60 underline-offset-2 hover:underline">
            &larr; Dashboard
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-navy">Viewing Calendar</h1>
          <p className="mt-1 text-sm text-navy/60">
            Every requested and confirmed viewing, from &ldquo;Book a Viewing&rdquo; submissions.
          </p>
        </div>
        <LogoutButton />
      </div>

      {viewings === null ? (
        <p className="mt-8 rounded-lg bg-red-100 px-4 py-3 text-sm font-medium text-red-700">
          Couldn&rsquo;t load viewings. Try refreshing.
        </p>
      ) : (
        <CalendarView viewings={viewings} />
      )}
    </main>
  );
}
