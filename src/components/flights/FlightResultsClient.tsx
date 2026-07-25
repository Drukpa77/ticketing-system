"use client";

import { useMemo, useState } from "react";
import { DateStrip } from "@/components/flights/DateStrip";
import { FlightResultCard } from "@/components/flights/FlightResultCard";
import {
  ResultsToolbar,
  type SortKey,
} from "@/components/flights/ResultsToolbar";
import { SearchSummaryBar } from "@/components/flights/SearchSummaryBar";
import type { DateStripDay, FlightResultRow } from "@/lib/flights/results";
import type { AirportOption } from "@/lib/format";

type FlightResultsClientProps = {
  origin: string;
  destination: string;
  date: string;
  returnDate?: string;
  tripType: "one_way" | "round_trip";
  passengers?: number;
  cabinClass?: "economy" | "business";
  title?: string;
  summaryTitle?: string;
  dayFares: DateStripDay[];
  baseParams: Record<string, string>;
  flights: FlightResultRow[];
  airports: AirportOption[];
  outboundSummary?: string | null;
  /** Date used by the strip highlight / navigation. */
  stripDate?: string;
  dateParam?: "date" | "returnDate";
};

export function FlightResultsClient({
  origin,
  destination,
  date,
  returnDate,
  tripType,
  passengers = 1,
  cabinClass = "economy",
  summaryTitle,
  dayFares,
  baseParams,
  flights,
  airports,
  outboundSummary,
  stripDate,
  dateParam = "date",
}: FlightResultsClientProps) {
  const [sortBy, setSortBy] = useState<SortKey>("relevant");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [nonstopOnly, setNonstopOnly] = useState(false);

  const globalLowestFareCents = useMemo(() => {
    const prices = flights
      .flatMap((f) => [f.economy, f.business])
      .filter((f) => f?.farePriced)
      .map((f) => f!.displayPriceCents);
    return prices.length ? Math.min(...prices) : null;
  }, [flights]);

  const visible = useMemo(() => {
    let list = [...flights];
    if (nonstopOnly) list = list.filter((f) => f.stops === 0);

    list.sort((a, b) => {
      if (sortBy === "lowest_fare") {
        const ap = a.lowestFareCents ?? Number.POSITIVE_INFINITY;
        const bp = b.lowestFareCents ?? Number.POSITIVE_INFINITY;
        return ap - bp;
      }
      if (sortBy === "earliest") {
        return (
          new Date(a.departureAt).getTime() - new Date(b.departureAt).getTime()
        );
      }
      if (sortBy === "shortest") {
        return a.durationMinutes - b.durationMinutes;
      }
      return (
        new Date(a.departureAt).getTime() - new Date(b.departureAt).getTime()
      );
    });
    return list;
  }, [flights, nonstopOnly, sortBy]);

  return (
    <main className="page-shell bg-background pb-safe">
      <SearchSummaryBar
        origin={origin}
        destination={destination}
        date={date}
        returnDate={returnDate}
        tripType={tripType}
        passengers={passengers}
        cabinClass={cabinClass}
        title={summaryTitle}
        airports={airports}
      />

      <DateStrip
        selectedDate={stripDate ?? date}
        dayFares={dayFares}
        baseParams={baseParams}
        dateParam={dateParam}
      />

      {outboundSummary ? (
        <div className="border-b border-line bg-white">
          <div className="mx-auto w-full max-w-6xl px-4 py-3 text-sm text-muted sm:px-6">
            <p className="font-semibold text-foreground">Outbound selected</p>
            <p className="mt-1 break-words">{outboundSummary}</p>
          </div>
        </div>
      ) : null}

      <ResultsToolbar
        count={visible.length}
        sortBy={sortBy}
        onSortChange={setSortBy}
        filtersOpen={filtersOpen}
        onToggleFilters={() => setFiltersOpen((v) => !v)}
        nonstopOnly={nonstopOnly}
        onNonstopOnlyChange={setNonstopOnly}
        lowestFareCents={globalLowestFareCents}
      />

      <div className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-6 sm:py-5">
        {visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-14 text-center shadow-[0_8px_28px_rgba(15, 23, 42,0.05)]">
            <p className="font-[family-name:var(--font-syne)] text-xl font-semibold">
              No flights found
            </p>
            <p className="mt-2 text-sm text-muted">
              Try another date on the strip above, or modify your search.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {visible.map((flight) => (
              <FlightResultCard
                key={flight.key}
                flight={flight}
                globalLowestFareCents={globalLowestFareCents}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
