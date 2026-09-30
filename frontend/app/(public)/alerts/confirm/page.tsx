import type { Metadata } from "next";
import AlertTokenAction from "@/components/site/AlertTokenAction";

export const metadata: Metadata = { title: "Confirm your alert", robots: { index: false, follow: false } };

export default function ConfirmAlertPage({ searchParams }: { searchParams: { token?: string } }) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 lg:px-10">
      <AlertTokenAction action="confirm" token={searchParams.token ?? ""} />
    </main>
  );
}
