import Link from "next/link";
import { FlightCard } from "@/components/FlightCard";
import { searchWindow } from "@/lib/datetime";
import { prisma } from "@/lib/db";
import { airportLabel, formatFlightTime } from "@/lib/format";
import { formatAud } from "@/lib/pricing";
import { priceFlight, recordDemandEvent } from "@/lib/pricing/service";
import { getSessionId } from "@/lib/session";
import { searchSchema } from "@/lib/validation";

export default async function FlightsPage({
  searchParams,
}: {
  searchParams: Promise<{
    origin?: string;
    destination?: string;
    date?: string;
    tripType?: string;
    returnDate?: string;
    outboundId?: string;
  }>;
}) {
  const raw = await searchParams;
  const parsed = searchSchema.safeParse(raw);

  if (!parsed.success) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-12">
        <p className="text-red-700">
          {parsed.error.issues[0]?.message ?? "Invalid search"}
        </p>
        <Link href="/" className="mt-4 inline-block text-sm underline">
          Back to search
        </Link>
      </main>
    );
  }

  const { origin, destination, date, tripType, returnDate } = parsed.data;
  const isRoundTrip = tripType === "round_trip";
  const outboundId = raw.outboundId;
  const sessionId = await getSessionId();

  // Step 2: choosing return flight
  if (isRoundTrip && outboundId) {
    const outbound = await prisma.flight.findFirst({
      where: { id: outboundId, active: true },
      include: { fareReleases: { orderBy: { sortOrder: "asc" } } },
    });
    if (!outbound) {
      return (
        <main className="mx-auto w-full max-w-5xl px-4 py-12">
          <p className="text-red-700">Selected outbound flight not found.</p>
          <Link href="/" className="mt-4 inline-block text-sm underline">
            Back to search
          </Link>
        </main>
      );
    }

    const outboundPrice = await priceFlight(outbound);
    const { windowEnd } = searchWindow(returnDate ?? date);
    const returns = await prisma.flight.findMany({
      where: {
        active: true,
        origin: destination,
        destination: origin,
        departureAt: {
          gte: outbound.arrivalAt,
          lte: windowEnd,
        },
      },
      include: { fareReleases: { orderBy: { sortOrder: "asc" } } },
      orderBy: { departureAt: "asc" },
    });

    const priced = await Promise.all(
      returns.map(async (flight) => {
        await recordDemandEvent(flight.id, "view", sessionId);
        const price = await priceFlight(flight);
        return { flight, price };
      }),
    );

    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-12">
        <Link href="/" className="text-sm text-zinc-600 underline">
          New search
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          Choose your return flight
        </h1>
        <div className="mt-4 border border-zinc-200 bg-white p-4 text-sm">
          <p className="font-medium">Outbound selected</p>
          <p className="text-zinc-600">
            {outbound.airline} {outbound.flightNumber} ·{" "}
            {airportLabel(outbound.origin)} → {airportLabel(outbound.destination)}{" "}
            · {formatFlightTime(outbound.departureAt)} ·{" "}
            {formatAud(outboundPrice.displayPriceCents)}
          </p>
        </div>
        <p className="mt-4 text-sm text-zinc-600">
          Return {airportLabel(destination)} → {airportLabel(origin)}
          {returnDate ? ` near ${returnDate}` : ""}. Each leg is priced
          dynamically; total is locked at checkout.
        </p>

        {priced.length === 0 ? (
          <div className="mt-6 border border-dashed border-zinc-300 bg-white p-8">
            <p className="font-medium">No return flights found</p>
            <p className="mt-2 text-sm text-zinc-600">
              Add a return-direction flight in Admin, or pick another return date.
            </p>
          </div>
        ) : (
          <div className="mt-6 border border-zinc-300 bg-white px-5">
            {priced.map(({ flight, price }) => {
              const params = new URLSearchParams({
                outboundId: outbound.id,
                returnId: flight.id,
              });
              return (
                <FlightCard
                  key={flight.id}
                  id={flight.id}
                  airline={flight.airline}
                  flightNumber={flight.flightNumber}
                  origin={flight.origin}
                  destination={flight.destination}
                  departureAt={flight.departureAt}
                  arrivalAt={flight.arrivalAt}
                  cabinClass={flight.cabinClass}
                  remainingSeats={flight.remainingSeats}
                  totalSeats={flight.totalSeats}
                  displayPriceCents={
                    outboundPrice.displayPriceCents + price.displayPriceCents
                  }
                  basePriceCents={
                    outboundPrice.basePriceCents + price.basePriceCents
                  }
                  fareReleaseName={
                    [outboundPrice.fareReleaseName, price.fareReleaseName]
                      .filter(Boolean)
                      .join(" + ") || null
                  }
                  farePriced={outboundPrice.farePriced && price.farePriced}
                  href={`/flights/trip?${params.toString()}`}
                  ctaLabel="Review round trip"
                />
              );
            })}
          </div>
        )}
      </main>
    );
  }

  // Step 1: outbound / one-way list
  const { windowStart, windowEnd } = searchWindow(date);
  const flights = await prisma.flight.findMany({
    where: {
      active: true,
      origin,
      destination,
      departureAt: { gte: windowStart, lte: windowEnd },
    },
    include: { fareReleases: { orderBy: { sortOrder: "asc" } } },
    orderBy: { departureAt: "asc" },
  });

  const priced = await Promise.all(
    flights.map(async (flight) => {
      await recordDemandEvent(flight.id, "view", sessionId);
      const price = await priceFlight(flight);
      return { flight, price };
    }),
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12">
      <div className="mb-8 space-y-2">
        <Link href="/" className="text-sm text-zinc-600 underline">
          New search
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isRoundTrip ? "Choose outbound · " : ""}
          {airportLabel(origin)} → {airportLabel(destination)}
        </h1>
        <p className="text-sm text-zinc-600">
          {isRoundTrip
            ? `Round trip · depart near ${date}${returnDate ? ` · return near ${returnDate}` : ""}`
            : `One way · near ${date}`}
          . Prices auto-adjust with demand and seats left.
        </p>
      </div>

      {priced.length === 0 ? (
        <div className="border border-dashed border-zinc-300 bg-white p-8">
          <p className="font-medium text-zinc-900">No flights found</p>
          <p className="mt-2 text-sm text-zinc-600">
            Add flights in Admin, or try SYD→MEL with a date in the next two
            weeks.
          </p>
        </div>
      ) : (
        <div className="border border-zinc-300 bg-white px-5">
          {priced.map(({ flight, price }) => {
            const href = isRoundTrip
              ? `/flights?${new URLSearchParams({
                  origin,
                  destination,
                  date,
                  tripType: "round_trip",
                  ...(returnDate ? { returnDate } : {}),
                  outboundId: flight.id,
                }).toString()}`
              : `/flights/${flight.id}`;
            return (
              <FlightCard
                key={flight.id}
                id={flight.id}
                airline={flight.airline}
                flightNumber={flight.flightNumber}
                origin={flight.origin}
                destination={flight.destination}
                departureAt={flight.departureAt}
                arrivalAt={flight.arrivalAt}
                cabinClass={flight.cabinClass}
                remainingSeats={flight.remainingSeats}
                totalSeats={flight.totalSeats}
                displayPriceCents={price.displayPriceCents}
                basePriceCents={price.basePriceCents}
                fareReleaseName={price.fareReleaseName}
                farePriced={price.farePriced}
                href={href}
                ctaLabel={isRoundTrip ? "Select outbound" : "View"}
              />
            );
          })}
        </div>
      )}
    </main>
  );
}
