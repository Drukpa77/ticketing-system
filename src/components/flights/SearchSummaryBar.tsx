"use client";

import { useState } from "react";
import { SearchForm } from "@/components/SearchForm";
import { airportCity, airportLabel, type AirportOption } from "@/lib/format";
import { formatSearchDateRange } from "@/lib/flights/results";

type SearchSummaryBarProps = {
  origin: string;
  destination: string;
  date: string;
  returnDate?: string;
  tripType: "one_way" | "round_trip";
  passengers?: number;
  title?: string;
  airports: AirportOption[];
};

export function SearchSummaryBar({
  origin,
  destination,
  date,
  returnDate,
  tripType,
  passengers = 1,
  title,
  airports,
}: SearchSummaryBarProps) {
  const [modifyOpen, setModifyOpen] = useState(false);

  return (
    <section className="results-banner relative overflow-hidden bg-accent-deep px-4 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 12% 20%, rgba(255,255,255,0.14), transparent 42%),
            radial-gradient(ellipse at 88% 80%, rgba(26,107,74,0.55), transparent 48%)
          `,
        }}
      />
      <div className="relative mx-auto w-full max-w-6xl">
        {title ? (
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
            {title}
          </p>
        ) : null}
        <div className="results-rise rounded-2xl bg-white shadow-[0_16px_40px_rgba(15,61,46,0.18)]">
          <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-5 sm:py-4">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2 text-sm text-foreground sm:gap-x-6">
              <p className="flex min-w-0 items-center gap-2 font-semibold">
                <span className="truncate" title={airportLabel(origin)}>
                  {airportCity(origin)}
                </span>
                <span className="text-accent" aria-hidden>
                  ⇄
                </span>
                <span className="truncate" title={airportLabel(destination)}>
                  {airportCity(destination)}
                </span>
                <span className="hidden text-xs font-medium uppercase tracking-[0.12em] text-muted sm:inline">
                  {origin}–{destination}
                </span>
              </p>
              <span className="hidden h-4 w-px bg-line sm:block" aria-hidden />
              <p className="text-muted">
                <span className="font-medium text-foreground">
                  {formatSearchDateRange(date, returnDate, tripType)}
                </span>
              </p>
              <span className="hidden h-4 w-px bg-line sm:block" aria-hidden />
              <p className="text-muted">
                <span className="font-medium text-foreground">{passengers}</span>{" "}
                {passengers === 1 ? "Passenger" : "Passengers"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setModifyOpen((v) => !v)}
              className="inline-flex shrink-0 items-center justify-center rounded-full border border-accent/30 bg-surface px-4 py-2 text-sm font-semibold text-accent-deep transition hover:border-accent hover:bg-white"
            >
              {modifyOpen ? "Close" : "Modify Search"}
            </button>
          </div>

          {modifyOpen ? (
            <div className="border-t border-line px-4 py-5 sm:px-5">
              <SearchForm
                variant="panel"
                airports={airports}
                initialValues={{
                  origin,
                  destination,
                  date,
                  returnDate,
                  tripType,
                }}
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
