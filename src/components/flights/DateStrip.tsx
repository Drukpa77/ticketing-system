"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatStripDay, type DateStripDay } from "@/lib/flights/results";
import { formatAud } from "@/lib/pricing";

type DateStripProps = {
  selectedDate: string;
  dayFares: DateStripDay[];
  baseParams: Record<string, string>;
  /** Which query param the strip updates (`date` or `returnDate`). */
  dateParam?: "date" | "returnDate";
};

export function DateStrip({
  selectedDate,
  dayFares,
  baseParams,
  dateParam = "date",
}: DateStripProps) {
  const [windowStart, setWindowStart] = useState(() => {
    const idx = dayFares.findIndex((d) => d.date === selectedDate);
    if (idx < 0) return 0;
    return Math.max(0, Math.min(idx - 3, Math.max(0, dayFares.length - 7)));
  });

  const visible = useMemo(
    () => dayFares.slice(windowStart, windowStart + 7),
    [dayFares, windowStart],
  );

  const canPrev = windowStart > 0;
  const canNext = windowStart + 7 < dayFares.length;

  function hrefFor(date: string) {
    const params = new URLSearchParams(baseParams);
    params.set(dateParam, date);
    return `/?${params.toString()}`;
  }

  return (
    <div className="border-b border-line bg-[#e3ece7]">
      <div className="mx-auto flex w-full max-w-6xl items-stretch gap-2 px-3 py-3 sm:px-6">
        <button
          type="button"
          aria-label="Previous dates"
          disabled={!canPrev}
          onClick={() => setWindowStart((v) => Math.max(0, v - 1))}
          className="flex w-9 shrink-0 items-center justify-center rounded-xl border border-line/80 bg-white/50 text-muted transition hover:border-accent hover:text-accent disabled:opacity-30"
        >
          ‹
        </button>
        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {visible.map((day) => {
            const label = formatStripDay(day.date);
            const isSelected = day.date === selectedDate;
            return (
              <Link
                key={day.date}
                href={hrefFor(day.date)}
                className={`results-rise flex min-w-[5.5rem] flex-1 flex-col items-center justify-center rounded-xl px-2 py-2.5 text-center transition sm:min-w-0 ${
                  isSelected
                    ? "bg-white text-foreground shadow-[0_8px_20px_rgba(15,61,46,0.14)]"
                    : "bg-transparent text-foreground hover:bg-white/50"
                }`}
              >
                <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
                  {label.weekday}
                </span>
                <span
                  className={`mt-0.5 text-sm ${
                    isSelected ? "font-bold" : "font-semibold"
                  }`}
                >
                  {label.dayMonth}
                </span>
                <span className="mt-1 text-xs font-semibold text-accent">

                  {day.lowestFareCents != null
                    ? formatAud(day.lowestFareCents)
                    : "—"}
                </span>
              </Link>
            );
          })}
        </div>
        <button
          type="button"
          aria-label="Next dates"
          disabled={!canNext}
          onClick={() =>
            setWindowStart((v) =>
              Math.min(Math.max(0, dayFares.length - 7), v + 1),
            )
          }
          className="flex w-9 shrink-0 items-center justify-center rounded-xl border border-line text-muted transition hover:border-accent hover:text-accent disabled:opacity-30"
        >
          ›
        </button>
      </div>
    </div>
  );
}
