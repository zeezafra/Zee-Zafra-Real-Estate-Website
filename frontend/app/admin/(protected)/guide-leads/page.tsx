import Link from "next/link";
import { getAdminGuideLeads } from "@/lib/adminAuth";
import { getGuide } from "@/lib/guides";
import LogoutButton from "../LogoutButton";
import RemoveGuideLeadButton from "./RemoveGuideLeadButton";

export const metadata = { title: "Guide Downloads" };

// Trust & polish. Everyone who entered their email to download a guide,
// newest first. Read-only apart from Remove (for someone who asks to be
// taken off). A colder lead than an inquiry — kept out of the inquiry inbox
// and its conversion analytics on purpose.
export default async function GuideLeadsPage() {
  const rows = await getAdminGuideLeads();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin" className="text-sm text-navy/60 underline-offset-2 hover:underline">
            ← Dashboard
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-navy">Guide Downloads</h1>
          {rows && <p className="mt-1 text-sm text-navy/60">{rows.length} total</p>}
        </div>
        <LogoutButton />
      </div>

      {rows === null ? (
        <p className="mt-8 rounded-lg bg-red-100 px-4 py-3 text-sm font-medium text-red-700">
          Couldn&rsquo;t load guide downloads. Has the latest migration been applied on the backend?
        </p>
      ) : rows.length === 0 ? (
        <p className="mt-8 text-navy/60">No one has downloaded a guide yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-navy/10">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-navy/5 text-navy/70">
              <tr>
                <th className="p-3">Email</th>
                <th className="p-3">Name</th>
                <th className="p-3">Guide</th>
                <th className="p-3">Date</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-navy/10 text-navy">
                  <td className="p-3 font-medium">
                    <a href={`mailto:${r.email}`} className="underline-offset-2 hover:underline">
                      {r.email}
                    </a>
                  </td>
                  <td className="p-3">{r.name ?? <span className="text-navy/40">—</span>}</td>
                  <td className="p-3">{getGuide(r.guide)?.title ?? r.guide}</td>
                  <td className="p-3 text-navy/60">
                    {new Date(r.createdAt).toLocaleDateString("en-PH")}
                  </td>
                  <td className="p-3 text-right">
                    <RemoveGuideLeadButton id={r.id} apiUrl={apiUrl} />
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
