"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { INQUIRY_STATUSES } from "@/lib/types";

// Phase 18. Filters live in the URL query string, same convention as the
// existing type tabs on this page and the Phase 8 properties filters —
// shareable/bookmarkable, and the actual filtering happens server-side in
// getAdminInquiries, not by hiding rows already sent to the browser.
// A local `search` input value is kept so typing doesn't refetch on every
// keystroke; it only commits to the URL on submit.
export default function InquiriesFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/admin/inquiries?${params.toString()}`);
  }

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Phase 26. Fetched with the admin cookie and saved as a blob rather than
  // linked to directly, so it works regardless of the browser's cross-site
  // cookie handling for plain navigations. Exports exactly what the current
  // filters + Active/Archived/Spam view are showing.
  async function exportCsv() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return;
    setExporting(true);
    setExportError(null);
    try {
      const res = await fetch(`${apiUrl}/api/admin/inquiries/export.csv?${searchParams.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `inquiries-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setExportError("Couldn't export — try again.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        updateParam("q", search.trim());
      }}
      className="mt-4 flex flex-wrap items-center gap-3"
    >
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search name, email, phone, or property"
        className="w-full max-w-xs rounded-lg border border-navy/15 bg-white px-3.5 py-2 text-sm text-navy placeholder:text-navy/40 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold dark:border-offwhite/15 dark:bg-navy-light dark:text-offwhite"
      />

      <select
        value={searchParams.get("status") ?? ""}
        onChange={(e) => updateParam("status", e.target.value)}
        className="rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm text-navy focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold dark:border-offwhite/15 dark:bg-navy-light dark:text-offwhite"
      >
        <option value="">All statuses</option>
        {INQUIRY_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={searchParams.get("dateFrom") ?? ""}
        onChange={(e) => updateParam("dateFrom", e.target.value)}
        aria-label="From date"
        className="rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm text-navy focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold dark:border-offwhite/15 dark:bg-navy-light dark:text-offwhite"
      />
      <span className="text-sm text-navy/50">to</span>
      <input
        type="date"
        value={searchParams.get("dateTo") ?? ""}
        onChange={(e) => updateParam("dateTo", e.target.value)}
        aria-label="To date"
        className="rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm text-navy focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold dark:border-offwhite/15 dark:bg-navy-light dark:text-offwhite"
      />

      <button
        type="submit"
        className="rounded-full bg-navy px-4 py-2 text-sm font-medium text-offwhite transition hover:bg-navy/90"
      >
        Search
      </button>

      <button
        type="button"
        onClick={exportCsv}
        disabled={exporting}
        className="rounded-full border border-navy/20 px-4 py-2 text-sm font-medium text-navy transition hover:border-gold hover:text-gold disabled:opacity-60 dark:border-offwhite/20 dark:text-offwhite"
      >
        {exporting ? "Exporting…" : "Export CSV"}
      </button>
      {exportError && <span className="text-sm text-red-600">{exportError}</span>}

      {(searchParams.get("q") ||
        searchParams.get("status") ||
        searchParams.get("dateFrom") ||
        searchParams.get("dateTo")) && (
        <button
          type="button"
          onClick={() => {
            setSearch("");
            router.push(
              searchParams.get("type")
                ? `/admin/inquiries?type=${searchParams.get("type")}`
                : "/admin/inquiries"
            );
          }}
          className="text-sm font-medium text-navy/60 underline-offset-2 hover:underline"
        >
          Clear
        </button>
      )}
    </form>
  );
}
