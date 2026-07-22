import Link from "next/link";
import { notFound } from "next/navigation";
import { BookButton } from "@/components/BookButton";
import { prisma } from "@/lib/db";
import { airportLabel, cabinLabel, formatFlightTime } from "@/lib/format";
import { formatAud } from "@/lib/pricing";
import { priceFlight, recordDemandEvent } from "@/lib/pricing/service";
import { getSessionId } from "@/lib/session";

export default async function TripReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ outboundId?: string; returnId?: string }>;
}) {
  const { outboundId, returnId } = await searchParams;
  if (!outboundId || !returnId) notFound();

  const [outbound, returnFlight] = await Promise.all([
    prisma.flight.findFirst({
      where: { id: outboundId, active: true },
      include: { fareReleases: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.flight.findFirst({
      where: { id: returnId, active: true },
      include: { fareReleases: { orderBy: { sortOrder: "asc" } } },
    }),
  ]);
  if (!outbound || !returnFlight) notFound();

  const sessionId = await getSessionId();
  await recordDemandEvent(outbound.id, "view", sessionId);
  await recordDemandEvent(returnFlight.id, "view", sessionId);

  const [outPrice, retPrice] = await Promise.all([
    priceFlight(outbound),
    priceFlight(returnFlight),
  ]);
  const total = outPrice.displayPriceCents + retPrice.displayPriceCents;
  const soldOut =
    outbound.remainingSeats < 1 ||
    returnFlight.remainingSeats < 1 ||
    !outPrice.farePriced ||
    !retPrice.farePriced;
  const maxSeats = Math.min(
    outbound.remainingSeats,
    returnFlight.remainingSeats,
  );

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <Link href="/" className="text-sm text-zinc-600 underline">
        New search
      </Link>

      <div className="mt-6 border border-zinc-300 bg-white p-6">
        <p className="text-sm uppercase tracking-wide text-zinc-500">
          Round trip · both legs priced live
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Review your trip
        </h1>

        <div className="mt-6 space-y-4 border-t border-zinc-200 pt-6 text-sm">
          <div>
            <p className="font-medium text-zinc-900">Outbound</p>
            <p className="text-zinc-600">
              {outbound.airline} {outbound.flightNumber} ·{" "}
              {airportLabel(outbound.origin)} →{" "}
              {airportLabel(outbound.destination)}
            </p>
            <p className="text-zinc-500">
              {formatFlightTime(outbound.departureAt)} ·{" "}
              {cabinLabel(outbound.cabinClass)}
              {outPrice.fareReleaseName
                ? ` · ${outPrice.fareReleaseName}`
                : ""}{" "}
              · {outPrice.farePriced ? formatAud(outPrice.displayPriceCents) : "TBA"}
            </p>
          </div>
          <div>
            <p className="font-medium text-zinc-900">Return</p>
            <p className="text-zinc-600">
              {returnFlight.airline} {returnFlight.flightNumber} ·{" "}
              {airportLabel(returnFlight.origin)} →{" "}
              {airportLabel(returnFlight.destination)}
            </p>
            <p className="text-zinc-500">
              {formatFlightTime(returnFlight.departureAt)} ·{" "}
              {cabinLabel(returnFlight.cabinClass)}
              {retPrice.fareReleaseName
                ? ` · ${retPrice.fareReleaseName}`
                : ""}{" "}
              · {retPrice.farePriced ? formatAud(retPrice.displayPriceCents) : "TBA"}
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-zinc-200 pt-6">
          <p className="text-sm text-zinc-500">Total dynamic fare (AUD)</p>
          <p className="text-3xl font-semibold">{formatAud(total)}</p>
          <p className="mt-2 text-sm text-zinc-600">
            {soldOut
              ? "One or both flights are sold out"
              : `Up to ${maxSeats} seat(s) available on both legs`}
          </p>
          <div className="mt-4">
            <BookButton
              flightId={outbound.id}
              returnFlightId={returnFlight.id}
              disabled={soldOut}
              label="Book round trip at this price"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
