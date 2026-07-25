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
  cabinClass?: "economy" | "business";
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
  cabinClass = "economy",
  title,
  airports,
}: SearchSummaryBarProps) {
  const [modifyOpen, setModifyOpen] = useState(false);
  const cabinLabel = cabinClass === "business" ? "Business" : "Economy";

  return (
    <section
      className={`results-banner relative bg-accent-deep px-3 pb-5 pt-4 sm:px-6 sm:pb-7 sm:pt-6 ${
        modifyOpen ? "overflow-visible z-20" : "overflow-hidden"
      }`}
    >
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
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/70 sm:mb-3">
            {title}
          </p>
        ) : null}

        <div className="results-rise relative z-10 overflow-visible rounded-2xl bg-white shadow-[0_16px_40px_rgba(15,61,46,0.18)]">
          {!modifyOpen ? (
            <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-5">
              <div className="flex min-w-0 flex-1 flex-col gap-2 text-sm text-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-2">
                <p className="flex min-w-0 items-center gap-2 font-semibold">
                  <span
                    className="inline-flex shrink-0 items-center rounded-md bg-accent/12 px-2 py-0.5 text-xs font-bold tracking-wide text-accent-deep"
                    title={airportLabel(origin)}
                  >
                    {origin}
                  </span>
                  <span className="truncate">{airportCity(origin)}</span>
                  <span className="shrink-0 text-accent" aria-hidden>
                    {tripType === "round_trip" ? "⇄" : "→"}
                  </span>
                  <span
                    className="inline-flex shrink-0 items-center rounded-md bg-accent/12 px-2 py-0.5 text-xs font-bold tracking-wide text-accent-deep"
                    title={airportLabel(destination)}
                  >
                    {destination}
                  </span>
                  <span className="truncate">{airportCity(destination)}</span>
                </p>
                <span className="hidden h-4 w-px bg-line sm:block" aria-hidden />
                <p className="min-w-0 text-muted">
                  <span className="font-medium text-foreground">
                    {formatSearchDateRange(date, returnDate, tripType)}
                  </span>
                </p>
                <span className="hidden h-4 w-px bg-line sm:block" aria-hidden />
                <p className="text-muted">
                  <span className="font-medium text-foreground">
                    {passengers}
                  </span>{" "}
                  / {cabinLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModifyOpen(true)}
                className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-full border border-accent/30 bg-surface px-5 py-2 text-sm font-semibold text-accent-deep transition hover:border-accent hover:bg-white sm:w-auto"
              >
                Modify search
              </button>
            </div>
          ) : (
            <div className="px-4 py-4 sm:px-5 sm:py-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-accent-deep">
                  Modify search
                </p>
                <button
                  type="button"
                  onClick={() => setModifyOpen(false)}
                  className="text-sm font-medium text-muted transition hover:text-foreground"
                >
                  Close
                </button>
              </div>
              <SearchForm
                variant="panel"
                airports={airports}
                initialValues={{
                  origin,
                  destination,
                  date,
                  returnDate,
                  tripType,
                  passengers,
                  cabinClass,
                }}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
