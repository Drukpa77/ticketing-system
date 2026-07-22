import Link from "next/link";
import { notFound } from "next/navigation";
import { BookButton } from "@/components/BookButton";
import { prisma } from "@/lib/db";
import { airportLabel, cabinLabel, formatFlightTime } from "@/lib/format";
import { formatAud } from "@/lib/pricing";
import { priceFlight, recordDemandEvent } from "@/lib/pricing/service";
import { getSessionId } from "@/lib/session";

export default async function FlightDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const flight = await prisma.flight.findFirst({
    where: { id, active: true },
  });
  if (!flight) notFound();

  const sessionId = await getSessionId();
  await recordDemandEvent(flight.id, "view", sessionId);
  const price = await priceFlight(flight);
  const soldOut = flight.remainingSeats < 1;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <Link href="/" className="text-sm text-zinc-600 underline">
        Back to search
      </Link>

      <div className="mt-6 border border-zinc-300 bg-white p-6">
        <p className="text-sm uppercase tracking-wide text-zinc-500">
          {flight.airline} · {flight.flightNumber} · {cabinLabel(flight.cabinClass)} · One way
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {airportLabel(flight.origin)} → {airportLabel(flight.destination)}
        </h1>
        <p className="mt-3 text-zinc-600">
          Departs {formatFlightTime(flight.departureAt)}
          <br />
          Arrives {formatFlightTime(flight.arrivalAt)}
        </p>

        <div className="mt-8 grid gap-6 border-t border-zinc-200 pt-6 sm:grid-cols-2">
          <div>
            <p className="text-sm text-zinc-500">Live fare (AUD)</p>
            <p className="text-3xl font-semibold">
              {formatAud(price.displayPriceCents)}
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Base ticket {formatAud(price.basePriceCents)} — system adjusts
              automatically for demand and seats left
            </p>
            <p className="mt-3 text-sm text-zinc-600">
              {soldOut
                ? "Sold out"
                : `${flight.remainingSeats} of ${flight.totalSeats} seats remaining`}
            </p>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-zinc-600">
              Booking locks this price for 15 minutes so it will not change
              during checkout.
            </p>
            <BookButton flightId={flight.id} disabled={soldOut} />
          </div>
        </div>
      </div>
    </main>
  );
}
