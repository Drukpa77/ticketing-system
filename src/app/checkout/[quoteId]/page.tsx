import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckoutForm } from "@/components/CheckoutForm";
import { expireQuoteIfNeeded } from "@/lib/booking/confirmBooking";
import { prisma } from "@/lib/db";
import { airportLabel, formatFlightTime } from "@/lib/format";
import { formatAud } from "@/lib/pricing";
import { getSessionId } from "@/lib/session";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ quoteId: string }>;
}) {
  const { quoteId } = await params;
  await expireQuoteIfNeeded(quoteId);

  const quote = await prisma.priceQuote.findUnique({
    where: { id: quoteId },
    include: { flight: true, returnFlight: true },
  });
  if (!quote) notFound();

  const sessionId = await getSessionId();
  const owned = quote.sessionId === sessionId;
  const expired =
    quote.status === "expired" ||
    (quote.status === "active" && quote.expiresAt <= new Date());
  const used = quote.status === "used";
  const isRound = quote.tripType === "round_trip" && quote.returnFlight;
  const maxSeats = isRound
    ? Math.min(
        quote.flight.remainingSeats,
        quote.returnFlight!.remainingSeats,
      )
    : quote.flight.remainingSeats;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <Link href="/" className="text-sm text-zinc-600 underline">
        Back to search
      </Link>

      <div className="mt-6 border border-zinc-300 bg-white p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {isRound ? "Round trip" : "One way"} · price locked
        </p>

        <div className="mt-4 space-y-3 text-sm text-zinc-600">
          <p>
            <span className="font-medium text-zinc-900">Outbound · </span>
            {quote.flight.airline} {quote.flight.flightNumber} ·{" "}
            {airportLabel(quote.flight.origin)} →{" "}
            {airportLabel(quote.flight.destination)} ·{" "}
            {formatFlightTime(quote.flight.departureAt)}
            {quote.fareReleaseName ? ` · ${quote.fareReleaseName}` : ""}
            {isRound && <> · {formatAud(quote.outboundPriceCents)}</>}
          </p>
          {isRound && quote.returnFlight && (
            <p>
              <span className="font-medium text-zinc-900">Return · </span>
              {quote.returnFlight.airline} {quote.returnFlight.flightNumber} ·{" "}
              {airportLabel(quote.returnFlight.origin)} →{" "}
              {airportLabel(quote.returnFlight.destination)} ·{" "}
              {formatFlightTime(quote.returnFlight.departureAt)}
              {quote.returnFareReleaseName
                ? ` · ${quote.returnFareReleaseName}`
                : ""}{" "}
              · {formatAud(quote.returnPriceCents)}
            </p>
          )}
        </div>

        <div className="mt-6 border-t border-zinc-200 pt-6">
          <p className="text-sm text-zinc-500">Locked total (AUD)</p>
          <p className="text-3xl font-semibold">
            {formatAud(quote.quotedPriceCents)}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Expires {formatFlightTime(quote.expiresAt)}
          </p>
        </div>

        {!owned && (
          <p className="mt-6 text-sm text-red-700">
            This quote belongs to another browser session.
          </p>
        )}
        {used && (
          <p className="mt-6 text-sm text-amber-700">
            This quote was already used for a booking.
          </p>
        )}
        {expired && !used && (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-red-700">
              This price lock has expired. Search again for a fresh quote.
            </p>
            <Link
              href="/"
              className="inline-flex bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
            >
              Search again
            </Link>
          </div>
        )}

        {owned && !expired && !used && (
          <div className="mt-8">
            <CheckoutForm quoteId={quote.id} maxSeats={maxSeats} />
          </div>
        )}
      </div>
    </main>
  );
}
