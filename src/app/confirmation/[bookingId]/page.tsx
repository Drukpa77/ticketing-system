import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { airportLabel, formatFlightTime } from "@/lib/format";
import { formatAud } from "@/lib/pricing";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { flight: true, returnFlight: true },
  });
  if (!booking) notFound();

  const isRound = booking.tripType === "round_trip" && booking.returnFlight;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <div className="border border-zinc-300 bg-white p-6">
        <p className="text-sm font-medium uppercase tracking-[0.14em] text-[#0f3d2e]">
          Booking confirmed
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {booking.bookingRef}
        </h1>
        <p className="mt-3 text-zinc-600">
          {booking.passengerName} · {booking.email}
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          {isRound ? "Round trip" : "One way"}
        </p>

        <div className="mt-8 space-y-3 border-t border-zinc-200 pt-6 text-sm">
          <p>
            <span className="text-zinc-500">Outbound</span>{" "}
            {booking.flight.airline} {booking.flight.flightNumber} ·{" "}
            {airportLabel(booking.flight.origin)} →{" "}
            {airportLabel(booking.flight.destination)} ·{" "}
            {formatFlightTime(booking.flight.departureAt)}
          </p>
          {isRound && booking.returnFlight && (
            <p>
              <span className="text-zinc-500">Return</span>{" "}
              {booking.returnFlight.airline} {booking.returnFlight.flightNumber}{" "}
              · {airportLabel(booking.returnFlight.origin)} →{" "}
              {airportLabel(booking.returnFlight.destination)} ·{" "}
              {formatFlightTime(booking.returnFlight.departureAt)}
            </p>
          )}
          <p>
            <span className="text-zinc-500">Fare</span>{" "}
            {booking.fareReleaseName || "—"}
          </p>
          <p>
            <span className="text-zinc-500">Seats</span> {booking.seatsBooked}
          </p>
          <p>
            <span className="text-zinc-500">Amount (AUD)</span>{" "}
            {formatAud(booking.amountPaidCents)}
          </p>
        </div>

        <Link
          href="/"
          className="mt-8 inline-flex bg-[#0f3d2e] px-4 py-2.5 text-sm font-medium text-white"
        >
          Search again
        </Link>
      </div>
    </main>
  );
}
