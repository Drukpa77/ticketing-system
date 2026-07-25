"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatStripDay, type DateStripDay } from "@/lib/flights/results";
import { formatAud } from "@/lib/pricing";

type DateStripProps = {
  selectedDate: string;
  dayFares: DateStripDay[];
  baseParams: Record<string, string>;
  /** Which query param the strip updates (`date` or `returnDate`). */
  dateParam?: "date" | "returnDate";
};

function useVisibleDayCount() {
  const [count, setCount] = useState(7);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 380) setCount(3);
      else if (w < 640) setCount(4);
      else if (w < 900) setCount(5);
      else setCount(7);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return count;
}

export function DateStrip({
  selectedDate,
  dayFares,
  baseParams,
  dateParam = "date",
}: DateStripProps) {
  const dayCount = useVisibleDayCount();
  const [windowStart, setWindowStart] = useState(0);

  useEffect(() => {
    const idx = dayFares.findIndex((d) => d.date === selectedDate);
    if (idx < 0) {
      setWindowStart(0);
      return;
    }
    setWindowStart(
      Math.max(0, Math.min(idx - Math.floor(dayCount / 2), Math.max(0, dayFares.length - dayCount))),
    );
  }, [selectedDate, dayFares, dayCount]);

  const visible = useMemo(
    () => dayFares.slice(windowStart, windowStart + dayCount),
    [dayFares, windowStart, dayCount],
  );

  const canPrev = windowStart > 0;
  const canNext = windowStart + dayCount < dayFares.length;

  function hrefFor(date: string) {
    const params = new URLSearchParams(baseParams);
    params.set(dateParam, date);
    return `/?${params.toString()}`;
  }

  return (
    <div className="border-b border-line bg-[#e3ece7]">
      <div className="mx-auto flex w-full max-w-6xl items-stretch gap-2 px-3 py-3 sm:gap-3 sm:px-6">
        <button
          type="button"
          aria-label="Previous dates"
          disabled={!canPrev}
          onClick={() => setWindowStart((v) => Math.max(0, v - 1))}
          className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-line/80 bg-white/70 text-lg text-muted transition hover:border-accent hover:text-accent disabled:opacity-30"
        >
          ‹
        </button>
        <div className="grid min-w-0 flex-1 grid-flow-col gap-1.5 sm:gap-2" style={{ gridTemplateColumns: `repeat(${visible.length}, minmax(0, 1fr))` }}>
          {visible.map((day) => {
            const label = formatStripDay(day.date);
            const isSelected = day.date === selectedDate;
            return (
              <Link
                key={day.date}
                href={hrefFor(day.date)}
                className={`results-rise flex min-h-16 flex-col items-center justify-center rounded-xl px-1 py-2 text-center transition sm:min-h-[4.5rem] sm:px-2 sm:py-2.5 ${
                  isSelected
                    ? "bg-white text-foreground shadow-[0_8px_20px_rgba(15,61,46,0.14)]"
                    : "bg-transparent text-foreground hover:bg-white/50"
                }`}
              >
                <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted sm:text-[11px]">
                  {label.weekday}
                </span>
                <span
                  className={`mt-0.5 text-xs sm:text-sm ${
                    isSelected ? "font-bold" : "font-semibold"
                  }`}
                >
                  {label.dayMonth}
                </span>
                <span className="mt-1 max-w-full truncate text-[10px] font-semibold text-accent sm:text-xs">
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
              Math.min(Math.max(0, dayFares.length - dayCount), v + 1),
            )
          }
          className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-line/80 bg-white/70 text-lg text-muted transition hover:border-accent hover:text-accent disabled:opacity-30"
        >
          ›
        </button>
      </div>
    </div>
  );
}
