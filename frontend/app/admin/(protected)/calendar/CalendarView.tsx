"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ViewingInquiry } from "@/lib/adminAuth";
import { INQUIRY_STATUS_STYLES } from "@/lib/types";
import { formatPreferredTime, formatRefNo } from "@/lib/format";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function todayManilaISODate(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date());
}

// Local (not Manila-shifted) YYYY-MM-DD for a plain JS Date used only to
// build the grid -- preferredDate itself is already a bare date string, so
// no timezone conversion happens on the data side at all.
function toISODate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Returns a 6x7 grid of ISO dates covering the given month, including the
// leading/trailing days from adjacent months needed to fill whole weeks.
function buildMonthGrid(year: number, month: number): string[] {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return toISODate(d);
  });
}

export default function CalendarView({ viewings }: { viewings: ViewingInquiry[] }) {
  const today = todayManilaISODate();
  const [cursor, setCursor] = useState(() => {
    const [y, m] = today.split("-").map(Number);
    return { year: y, month: m - 1 };
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(today);

  const byDate = useMemo(() => {
    const map = new Map<string, ViewingInquiry[]>();
    for (const v of viewings) {
      const list = map.get(v.preferredDate) ?? [];
      list.push(v);
      map.set(v.preferredDate, list);
    }
    return map;
  }, [viewings]);

  const grid = useMemo(() => buildMonthGrid(cursor.year, cursor.month), [cursor]);
  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  function shiftMonth(delta: number) {
    setCursor((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  const selectedViewings = selectedDate ? (byDate.get(selectedDate) ?? []) : [];

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-navy">{monthLabel}</h2>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              aria-label="Previous month"
              className="rounded-full border border-navy/20 p-1.5 text-navy transition hover:border-navy/40"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
              className="rounded-full border border-navy/20 p-1.5 text-navy transition hover:border-navy/40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs font-medium text-navy/50">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-1">
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {grid.map((iso) => {
            const inMonth = Number(iso.slice(5, 7)) - 1 === cursor.month;
            const dayViewings = byDate.get(iso) ?? [];
            const isToday = iso === today;
            const isSelected = iso === selectedDate;

            return (
              <button
                key={iso}
                type="button"
                onClick={() => setSelectedDate(iso)}
                className={`flex aspect-square flex-col items-center justify-center rounded-lg border p-1 text-sm transition ${
                  isSelected
                    ? "border-gold bg-gold/10"
                    : isToday
                      ? "border-navy/40"
                      : "border-navy/10 hover:border-navy/30"
                } ${inMonth ? "text-navy" : "text-navy/30"}`}
              >
                <span className={isToday ? "font-bold text-gold" : ""}>{Number(iso.slice(8, 10))}</span>
                {dayViewings.length > 0 && (
                  <span className="mt-1 flex gap-0.5">
                    {dayViewings.slice(0, 3).map((v) => (
                      <span key={v.id} className="h-1.5 w-1.5 rounded-full bg-gold" />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-navy/10 p-4">
        <h3 className="text-sm font-semibold text-navy">
          {selectedDate
            ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })
            : "Select a day"}
        </h3>

        {selectedViewings.length === 0 ? (
          <p className="mt-3 text-sm text-navy/50">No viewings on this day.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {selectedViewings.map((v) => (
              <li key={v.id} className="rounded-lg border border-navy/10 p-3">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/admin/inquiries/${v.id}`}
                    className="font-medium text-navy hover:text-gold"
                  >
                    {v.name}
                  </Link>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${INQUIRY_STATUS_STYLES[v.status]}`}
                  >
                    {v.status.replace(/_/g, " ")}
                  </span>
                </div>
                {v.preferredTime && (
                  <p className="mt-1 text-xs text-navy/60">{formatPreferredTime(v.preferredTime)}</p>
                )}
                {v.property && (
                  <p className="mt-1 text-xs text-navy/60">
                    {formatRefNo(v.property.refNo)} &mdash; {v.property.title}
                  </p>
                )}
                <p className="mt-1 text-xs text-navy/50">
                  {[v.phone, v.email].filter(Boolean).join(" \u00b7 ") || "No contact details"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
