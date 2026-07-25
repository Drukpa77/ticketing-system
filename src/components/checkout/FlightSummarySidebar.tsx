import Link from "next/link";
import {
  formatCardDate,
  formatClock,
  formatDuration,
  flightDurationMinutes,
} from "@/lib/flights/results";
import { airportCity } from "@/lib/format";
import { formatAud } from "@/lib/pricing";
import type { CheckoutQuoteState } from "@/lib/checkout/loadQuote";

type FlightSummarySidebarProps = {
  state: CheckoutQuoteState;
  changeHref: string;
};

export function FlightSummarySidebar({
  state,
  changeHref,
}: FlightSummarySidebarProps) {
  const { quote, isRound } = state;
  const fareLabel =
    [quote.flight.cabinClass === "business" ? "Business" : "Economy", quote.fareProductName]
      .filter(Boolean)
      .join(" · ") || "Charter fare";

  const adults = Math.max(1, quote.seatsBooked || 1);
  const totalCents = quote.quotedPriceCents * adults;

  return (
    <aside className="rounded-2xl border border-line bg-white p-5 shadow-[0_10px_32px_rgba(16,35,28,0.08)] sm:p-6 lg:sticky lg:top-24">
      <SegmentBlock
        label="Departure"
        origin={quote.flight.origin}
        destination={quote.flight.destination}
        departureAt={quote.flight.departureAt}
        arrivalAt={quote.flight.arrivalAt}
        airline={quote.flight.airline}
        flightNumber={quote.flight.flightNumber}
        fareLabel={fareLabel}
        changeHref={changeHref}
        detailsHref={`/flights/${quote.flight.id}`}
      />

      {isRound && quote.returnFlight ? (
        <div className="mt-5 border-t border-line pt-5">
          <SegmentBlock
            label="Return"
            origin={quote.returnFlight.origin}
            destination={quote.returnFlight.destination}
            departureAt={quote.returnFlight.departureAt}
            arrivalAt={quote.returnFlight.arrivalAt}
            airline={quote.returnFlight.airline}
            flightNumber={quote.returnFlight.flightNumber}
            fareLabel={
              quote.returnFareReleaseName || quote.fareProductName || fareLabel
            }
            changeHref={changeHref}
            detailsHref={`/flights/trip?outboundId=${quote.flightId}&returnId=${quote.returnFlightId}`}
          />
        </div>
      ) : null}

      <div className="mt-6 space-y-2.5 border-t border-dashed border-line pt-5 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-muted">Air Transportation Charge</span>
          <span className="font-medium">{formatAud(totalCents)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted">Taxes, Fees, and Charges</span>
          <span className="font-medium">{formatAud(0)}</span>
        </div>
        <div className="flex items-end justify-between gap-4 border-t border-dashed border-line pt-4">
          <span className="font-semibold text-foreground">Total Price</span>
          <span className="font-[family-name:var(--font-syne)] text-2xl font-bold tracking-tight text-accent-deep">
            {formatAud(totalCents)}
          </span>
        </div>
        <p className="text-xs text-muted">
          {adults} Adult{adults === 1 ? "" : "s"}. Total trip price for all
          passengers including taxes and fees.
        </p>
      </div>

    </aside>
  );
}

function SegmentBlock({
  label,
  origin,
  destination,
  departureAt,
  arrivalAt,
  airline,
  flightNumber,
  fareLabel,
  changeHref,
  detailsHref,
}: {
  label: string;
  origin: string;
  destination: string;
  departureAt: Date;
  arrivalAt: Date;
  airline: string;
  flightNumber: string;
  fareLabel: string;
  changeHref: string;
  detailsHref: string;
}) {
  const duration = formatDuration(
    flightDurationMinutes(departureAt, arrivalAt),
  );

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
        {label}
      </p>
      <p className="mt-2 font-[family-name:var(--font-syne)] text-lg font-bold tracking-tight text-foreground">
        {airportCity(origin)} → {airportCity(destination)}
      </p>
      <p className="mt-1 text-sm text-muted">
        {formatCardDate(departureAt)}{" "}
        {new Intl.DateTimeFormat("en-AU", {
          year: "numeric",
          timeZone: "Australia/Sydney",
        }).format(departureAt)}{" "}
        · {formatClock(departureAt)}-{formatClock(arrivalAt)} · Nonstop ·{" "}
        {duration}
      </p>

      <div className="mt-3 flex items-center gap-3 rounded-xl bg-accent/8 px-3 py-3">
        <img
          src="/airline-mark.svg"
          alt=""
          width={28}
          height={28}
          className="size-7 rounded-lg"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-accent-deep">
            {fareLabel}
          </p>
          <p className="truncate text-xs text-muted">
            {airline} {flightNumber}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center gap-3 text-sm font-semibold text-accent">
        <Link href={detailsHref} className="hover:text-accent-deep">
          Flight Details
        </Link>
        <span className="text-line">|</span>
        <Link href={changeHref} className="hover:text-accent-deep">
          Change
        </Link>
      </div>
    </div>
  );
}
