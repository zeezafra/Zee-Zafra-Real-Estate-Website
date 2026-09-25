import type { Metadata } from "next";
import SavedListingsGrid from "@/components/site/SavedListingsGrid";

export const metadata: Metadata = {
  title: "Saved Properties",
  description: "The listings you've saved from Zee Zafra Properties.",
};

// A thin server wrapper so this page still gets a normal <title>/metadata
// pair like every other public page — the actual saved-IDs-from-
// localStorage work has to happen client-side (see SavedListingsGrid),
// which can't export `metadata` itself.
export default function SavedPropertiesPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-gold">
          Your Shortlist
        </p>
        <h1 className="mt-1 text-3xl font-bold text-navy dark:text-offwhite">
          Saved Properties
        </h1>
        <p className="mt-2 text-navy/60 dark:text-offwhite/60">
          Listings you&rsquo;ve saved on this device — tap the heart on any
          property to add or remove it.
        </p>
      </div>

      <SavedListingsGrid />
    </main>
  );
}
