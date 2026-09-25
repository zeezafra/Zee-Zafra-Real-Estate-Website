import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock } from "lucide-react";
import { getAdminInquiry } from "@/lib/adminAuth";
import { formatLastContacted, formatPreferredDate, formatPreferredTime, formatRefNo } from "@/lib/format";
import StatusControl from "./StatusControl";
import ContactActions from "./ContactActions";
import FollowUpControl from "./FollowUpControl";
import NotesTimeline from "./NotesTimeline";

// Phase 18. Full detail view — everything the trimmed-down list card
// (item 5 of the CRM recommendation) leaves out: complete contact info,
// the linked property's reference ID, and the status control. Server
// component for the fetch, same split as every other admin detail/edit
// page in this app; StatusControl is the one client island that mutates.
export default async function AdminInquiryDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const inquiry = await getAdminInquiry(params.id);

  if (!inquiry) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <Link
        href="/admin/inquiries"
        className="text-sm font-medium text-navy/60 hover:text-navy"
      >
        ← Back to Inquiries
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">{inquiry.name}</h1>
          <p className="mt-1 text-sm text-navy/60">
            Submitted {new Date(inquiry.createdAt).toLocaleString()}
          </p>
          {inquiry.lastContactedAt && (
            <p className="text-sm text-navy/60">
              Last contacted {formatLastContacted(inquiry.lastContactedAt)}
            </p>
          )}
          <ContactActions email={inquiry.email} phone={inquiry.phone} />
        </div>
        <div className="flex flex-col items-end gap-3">
          <StatusControl inquiryId={inquiry.id} status={inquiry.status} apiUrl={apiUrl} />
          <FollowUpControl
            inquiryId={inquiry.id}
            nextFollowUpDate={inquiry.nextFollowUpDate}
            apiUrl={apiUrl}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-navy/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">
            Contact
          </p>
          <p className="mt-2 text-sm text-navy">
            {inquiry.email ?? "No email provided"}
          </p>
          <p className="text-sm text-navy">
            {inquiry.phone ?? "No phone provided"}
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-navy/50">
            Type
          </p>
          <p className="text-sm text-navy">
            {inquiry.type === "SELLER" ? "Seller" : "Buyer"}
          </p>
        </div>

        <div className="rounded-xl border border-navy/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">
            Property
          </p>
          {inquiry.property ? (
            <>
              <Link
                href={`/properties/${inquiry.property.id}`}
                target="_blank"
                className="mt-2 inline-block text-sm font-medium text-navy underline-offset-2 hover:underline"
              >
                {inquiry.property.title}
              </Link>
              <p className="text-sm text-navy/70">{inquiry.property.location}</p>
              <p className="mt-1 text-xs text-navy/50">
                Ref: {formatRefNo(inquiry.property.refNo)}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-navy/60">
              General inquiry — not tied to a specific listing
            </p>
          )}
        </div>
      </div>

      {(inquiry.preferredDate || inquiry.preferredTime) && (
        <div className="mt-4 flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm font-medium text-emerald-700 dark:text-emerald-400">
          <CalendarClock size={16} className="shrink-0" />
          Viewing requested for{" "}
          {inquiry.preferredDate
            ? formatPreferredDate(inquiry.preferredDate)
            : "an unspecified date"}{" "}
          at{" "}
          {inquiry.preferredTime
            ? formatPreferredTime(inquiry.preferredTime)
            : "an unspecified time"}
        </div>
      )}

      <div className="mt-6 rounded-xl border border-navy/10 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">
          Message
        </p>
        <p className="mt-2 whitespace-pre-line text-sm text-navy/80">
          {inquiry.message}
        </p>
      </div>

      <NotesTimeline inquiryId={inquiry.id} notes={inquiry.notes ?? []} apiUrl={apiUrl} />
    </main>
  );
}
