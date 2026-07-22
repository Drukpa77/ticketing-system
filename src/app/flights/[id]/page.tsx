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
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const flight = await prisma.flight.findFirst({
    where: { id, active: true },
    include: { fareReleases: { orderBy: { sortOrder: "asc" } } },
  });
  if (!flight) notFound();

  const sessionId = await getSessionId();
  try {
    await recordDemandEvent(flight.id, "view", sessionId);
  } catch (err) {
    console.error("recordDemandEvent failed", err);
  }

  let price;
  try {
    price = await priceFlight(flight);
  } catch (err) {
    console.error("priceFlight failed", err);
    price = {
      displayPriceCents: 0,
      basePriceCents: 0,
      farePriced: false,
      fareReleaseId: null,
      fareReleaseName: null,
    };
  }

  const soldOut = flight.remainingSeats < 1 || !price.farePriced;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <Link href="/" className="text-sm text-zinc-600 underline">
        Back to search
      </Link>

      <div className="mt-6 border border-zinc-300 bg-white p-6">
        <p className="text-sm uppercase tracking-wide text-zinc-500">
          {flight.airline} · {flight.flightNumber} ·{" "}
          {cabinLabel(flight.cabinClass)} · One way
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {airportLabel(flight.origin)} → {airportLabel(flight.destination)}
        </h1>
        <p className="mt-3 text-zinc-600">
          Departs {formatFlightTime(flight.departureAt)}
          <br />
          Arrives {formatFlightTime(flight.arrivalAt)}
        </p>

        <div className="mt-6 border-t border-zinc-200 pt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Fare releases
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {flight.fareReleases.map((r) => (
              <li key={r.id} className="flex justify-between gap-4">
                <span>
                  {r.name}
                  <span className="text-zinc-500">
                    {" "}
                    · {r.remainingSeats}/{r.totalSeats} seats
                  </span>
                  {price.fareReleaseId === r.id && (
                    <span className="ml-2 text-accent">Selling now</span>
                  )}
                </span>
                <span className="font-medium">
                  {r.priceCents > 0 ? formatAud(r.priceCents) : "TBA"}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 grid gap-6 border-t border-zinc-200 pt-6 sm:grid-cols-2">
          <div>
            <p className="text-sm text-zinc-500">
              Live fare
              {price.fareReleaseName ? ` · ${price.fareReleaseName}` : ""}
            </p>
            <p className="text-3xl font-semibold">
              {price.farePriced ? formatAud(price.displayPriceCents) : "TBA"}
            </p>
            {price.farePriced && (
              <p className="mt-1 text-sm text-zinc-500">
                Ticket {formatAud(price.basePriceCents)} — adjusts with demand
                and seats left
              </p>
            )}
            <p className="mt-3 text-sm text-zinc-600">
              {flight.remainingSeats < 1
                ? "Sold out"
                : !price.farePriced
                  ? "Admin has not set a price for the current release yet"
                  : `${flight.remainingSeats} of ${flight.totalSeats} seats remaining`}
            </p>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-zinc-600">
              Booking locks this price for 15 minutes so it will not change
              during checkout.
            </p>
            <BookButton flightId={flight.id} disabled={soldOut} />
            {error && (
              <p className="text-sm text-red-700">
                {decodeURIComponent(error)}
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
