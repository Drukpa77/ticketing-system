import {
  formatClock,
  formatDuration,
  formatShortDate,
  flightDurationMinutes,
  routeCityLabel,
} from "@/lib/flights/results";

type Leg = {
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureAt: Date;
  arrivalAt: Date;
};

export function SelectedFlightSummary({
  outbound,
  returnFlight,
}: {
  outbound: Leg;
  returnFlight?: Leg | null;
}) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_10px_28px_rgba(16,35,28,0.05)] sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
        Selected flight
      </p>
      <FlightLegRow leg={outbound} label={returnFlight ? "Outbound" : undefined} />
      {returnFlight ? (
        <>
          <div className="my-4 h-px bg-line" />
          <FlightLegRow leg={returnFlight} label="Return" />
        </>
      ) : null}
    </section>
  );
}

function FlightLegRow({ leg, label }: { leg: Leg; label?: string }) {
  const duration = flightDurationMinutes(leg.departureAt, leg.arrivalAt);
  return (
    <div className="mt-4">
      {label ? (
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          {label}
        </p>
      ) : null}
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm font-semibold">
        <span className="inline-flex size-7 items-center justify-center rounded-full bg-accent-deep text-[10px] font-bold text-white">
          {leg.airline
            .split(/\s+/)
            .slice(0, 2)
            .map((w) => w[0])
            .join("")
            .toUpperCase()}
        </span>
        {leg.airline}{" "}
        <span className="font-medium text-muted">{leg.flightNumber}</span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div>
          <p className="font-[family-name:var(--font-syne)] text-2xl font-bold tracking-tight">
            {formatClock(leg.departureAt)}
          </p>
          <p className="text-xs text-muted">{formatShortDate(leg.departureAt)}</p>
          <p className="mt-1 font-semibold">{leg.origin}</p>
          <p className="text-xs text-muted">{routeCityLabel(leg.origin)}</p>
        </div>
        <div className="flex min-w-[6rem] flex-col items-center gap-1">
          <p className="text-xs text-muted">{formatDuration(duration)}</p>
          <div className="flex w-full items-center gap-2">
            <span className="h-px flex-1 bg-line" />
            <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-accent-deep">
              Nonstop
            </span>
            <span className="h-px flex-1 bg-line" />
          </div>
        </div>
        <div className="text-right">
          <p className="font-[family-name:var(--font-syne)] text-2xl font-bold tracking-tight">
            {formatClock(leg.arrivalAt)}
          </p>
          <p className="text-xs text-muted">{formatShortDate(leg.arrivalAt)}</p>
          <p className="mt-1 font-semibold">{leg.destination}</p>
          <p className="text-xs text-muted">{routeCityLabel(leg.destination)}</p>
        </div>
      </div>
    </div>
  );
}
