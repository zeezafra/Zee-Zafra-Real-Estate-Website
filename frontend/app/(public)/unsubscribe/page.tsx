import type { Metadata } from "next";
import AlertTokenAction from "@/components/site/AlertTokenAction";

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false, follow: false } };

export default function UnsubscribePage({ searchParams }: { searchParams: { token?: string } }) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 lg:px-10">
      <AlertTokenAction action="unsubscribe" token={searchParams.token ?? ""} />
    </main>
  );
}
