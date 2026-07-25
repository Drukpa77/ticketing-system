import Link from "next/link";
import {
  estimateCo2Kg,
  formatClock,
  formatDuration,
  formatShortDate,
  routeCityLabel,
  type CabinFare,
  type FlightResultRow,
} from "@/lib/flights/results";
import { formatAud } from "@/lib/pricing";

type FlightResultCardProps = {
  flight: FlightResultRow;
  globalLowestFareCents: number | null;
};

export function FlightResultCard({
  flight,
  globalLowestFareCents,
}: FlightResultCardProps) {
  const stopLabel = flight.stops === 0 ? "Nonstop" : `${flight.stops} Stop`;
  const detailsHref =
    flight.economy?.href ?? flight.business?.href ?? "#";

  return (
    <article className="results-card border-b border-line bg-white px-4 py-5 transition hover:bg-surface/50 sm:px-6 sm:py-6">
      <div className="mb-4 flex min-w-0 flex-wrap items-center gap-2">
        <AirlineMark name={flight.airline} />
        <p className="min-w-0 truncate text-sm font-semibold text-foreground">
          {flight.airline}{" "}
          <span className="text-muted">{flight.flightNumber}</span>
        </p>
      </div>

      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:gap-6">
        <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-4">
          <Endpoint
            time={formatClock(flight.departureAt)}
            date={formatShortDate(flight.departureAt)}
            code={flight.origin}
            city={routeCityLabel(flight.origin)}
            align="left"
          />

          <div className="flex w-[4.75rem] flex-col items-center gap-1 px-0.5 sm:w-[8rem] sm:gap-1.5 sm:px-1">
            <p className="text-[10px] font-medium text-muted sm:text-xs">
              {formatDuration(flight.durationMinutes)}
            </p>
            <div className="flex w-full items-center gap-1 sm:gap-2">
              <span className="h-px flex-1 bg-line" />
              <span className="rounded-full bg-surface px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-accent-deep sm:px-2.5 sm:text-[11px] sm:tracking-[0.08em]">
                {stopLabel}
              </span>
              <span className="h-px flex-1 bg-line" />
            </div>
            <Link
              href={detailsHref}
              className="inline-flex min-h-9 items-center text-[11px] font-semibold text-accent transition hover:text-accent-deep sm:text-xs"
            >
              Details
            </Link>
          </div>

          <Endpoint
            time={formatClock(flight.arrivalAt)}
            date={formatShortDate(flight.arrivalAt)}
            code={flight.destination}
            city={routeCityLabel(flight.destination)}
            align="right"
          />
        </div>

        <div className="grid min-w-0 shrink-0 grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:gap-3 xl:w-[22rem]">
          <CabinPriceCard
            label="Economy"
            fare={flight.economy}
            durationMinutes={flight.durationMinutes}
            isLowest={
              flight.economy?.farePriced === true &&
              globalLowestFareCents != null &&
              flight.economy.displayPriceCents === globalLowestFareCents
            }
          />
          <CabinPriceCard
            label="Business"
            fare={flight.business}
            durationMinutes={flight.durationMinutes}
            isLowest={
              flight.business?.farePriced === true &&
              globalLowestFareCents != null &&
              flight.business.displayPriceCents === globalLowestFareCents
            }
            premium
          />
        </div>
      </div>
    </article>
  );
}

function Endpoint({
  time,
  date,
  code,
  city,
  align,
}: {
  time: string;
  date: string;
  code: string;
  city: string;
  align: "left" | "right";
}) {
  return (
    <div className={`min-w-0 ${align === "right" ? "text-right" : "text-left"}`}>
      <p className="font-[family-name:var(--font-syne)] text-xl font-bold tracking-tight text-foreground sm:text-3xl">
        {time}
      </p>
      <p className="mt-0.5 text-[11px] text-muted sm:text-xs">{date}</p>
      <p className="mt-1.5 font-[family-name:var(--font-syne)] text-lg font-semibold tracking-tight text-foreground sm:mt-2 sm:text-xl">
        {code}
      </p>
      <p className="truncate text-[11px] text-muted sm:text-xs" title={city}>
        {city}
      </p>
    </div>
  );
}

function CabinPriceCard({
  label,
  fare,
  durationMinutes,
  isLowest,
  premium = false,
}: {
  label: string;
  fare: CabinFare | null;
  durationMinutes: number;
  isLowest: boolean;
  premium?: boolean;
}) {
  if (!fare) {
    return (
      <div
        className={`flex min-h-[6.5rem] flex-col justify-between rounded-xl border border-dashed border-line px-3 py-3 sm:min-h-[7.5rem] ${
          premium ? "bg-surface/40" : "bg-white"
        }`}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
          {label}
        </p>
        <p className="text-sm text-muted">Not Available</p>
      </div>
    );
  }

  const soldOut = fare.remainingSeats < 1 || !fare.farePriced;
  const co2 = estimateCo2Kg(durationMinutes, fare.cabinClass);

  return (
    <div
      className={`relative flex min-h-[6.5rem] flex-col rounded-xl border px-3 py-3 transition sm:min-h-[7.5rem] ${
        premium
          ? "border-accent/35 bg-gradient-to-b from-surface to-white"
          : "border-line bg-white"
      } ${soldOut ? "opacity-60" : "hover:border-accent"}`}
    >
      {isLowest && !soldOut ? (
        <span
          className="absolute -top-1 right-2 inline-block size-0 border-x-[6px] border-b-[10px] border-x-transparent border-b-accent"
          title="Lowest fare"
          aria-label="Lowest fare"
        />
      ) : null}

      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
          {label}
        </p>
        {fare.fareReleaseName ? (
          <p className="max-w-[5rem] truncate text-[10px] font-medium text-accent">
            {fare.fareReleaseName}
          </p>
        ) : null}
      </div>

      {soldOut ? (
        <p className="mt-3 text-sm font-semibold text-muted">
          {!fare.farePriced ? "Price TBA" : "Sold out"}
        </p>
      ) : (
        <>
          <p className="mt-2 font-[family-name:var(--font-syne)] text-lg font-bold tracking-tight text-foreground sm:text-xl">
            {formatAud(fare.displayPriceCents)}
          </p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-muted">
            <LeafIcon />
            {co2} kg CO2e
            <InfoIcon />
          </p>
          <Link
            href={fare.href}
            className="mt-auto inline-flex min-h-10 items-center pt-2 text-sm font-semibold text-accent-deep transition hover:text-accent"
          >
            {fare.ctaLabel} →
          </Link>
        </>
      )}
    </div>
  );
}

function AirlineMark({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <span
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-deep text-[11px] font-bold tracking-wide text-white"
      aria-hidden
    >
      {initials || "DR"}
    </span>
  );
}

function LeafIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 19c8 0 12-6 14-14-8 2-14 6-14 14Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M5 19c2-6 7-10 14-12"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 11v5M12 8.2h.01"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
