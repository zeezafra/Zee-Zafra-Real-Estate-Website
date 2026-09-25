import type { InquiryStats } from "@/lib/types";

// Phase 19. Item 6 of the CRM recommendation. Plain server-rendered
// numbers — no client state needed, this is read-only at a glance.
// Always reflects the whole inbox (see getAdminInquiryStats), not
// whatever filters are currently applied below it.
export default function StatsBar({ stats }: { stats: InquiryStats }) {
  const cards = [
    { label: "Total", value: stats.total },
    { label: "New", value: stats.new },
    { label: "Follow-up", value: stats.followUp },
    { label: "Closed", value: stats.closed },
    // Phase 20. All-time, not scoped to the active inbox like the four
    // cards above — see the schema comment on InquiryStats.spam. Reported
    // here so the count is visible without switching to the Spam view.
    { label: "Spam", value: stats.spam },
  ];

  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-navy/10 p-4">
          <p className="text-2xl font-bold text-navy">{card.value}</p>
          <p className="text-xs font-medium uppercase tracking-wide text-navy/50">
            {card.label}
          </p>
        </div>
      ))}
      {stats.overdueFollowUps > 0 && (
        <p className="col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 sm:col-span-5">
          {stats.overdueFollowUps} follow-up
          {stats.overdueFollowUps === 1 ? " is" : "s are"} overdue
        </p>
      )}
    </div>
  );
}
