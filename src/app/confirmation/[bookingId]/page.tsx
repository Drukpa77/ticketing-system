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
    include: { flight: true, returnFlight: true, invoice: true },
  });
  if (!booking) notFound();

  const isRound = booking.tripType === "round_trip" && booking.returnFlight;
  const invoice = booking.invoice;
  const unpaid = invoice?.status === "unpaid";
  const paid = invoice?.status === "paid" || booking.status === "confirmed";

  return (
    <main className="relative min-h-[calc(100svh-4rem)] overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 20% 0%, rgba(26, 107, 74, 0.16), transparent 40%),
            linear-gradient(180deg, #e9f0ec 0%, #f4f8f6 100%)
          `,
        }}
      />

      <div className="relative mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <div className="border border-line bg-surface/90 p-6 backdrop-blur-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            {unpaid ? "Booking reserved · awaiting payment" : "Booking confirmed"}
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-syne)] text-3xl font-semibold tracking-tight sm:text-4xl">
            {booking.bookingRef}
          </h1>
          <p className="mt-3 text-muted">
            {booking.passengerName} · {booking.email}
          </p>
          <p className="mt-1 text-sm text-muted">
            {isRound ? "Round trip" : "One way"}
            {booking.paymentMethod === "card"
              ? " · Paid by card"
              : booking.paymentMethod === "bank_transfer"
                ? " · Bank transfer"
                : ""}
          </p>

          <div className="mt-8 space-y-3 border-t border-line pt-6 text-sm">
            <p>
              <span className="text-muted">Outbound</span>{" "}
              {booking.flight.airline} {booking.flight.flightNumber} ·{" "}
              {airportLabel(booking.flight.origin)} →{" "}
              {airportLabel(booking.flight.destination)} ·{" "}
              {formatFlightTime(booking.flight.departureAt)}
            </p>
            {isRound && booking.returnFlight && (
              <p>
                <span className="text-muted">Return</span>{" "}
                {booking.returnFlight.airline}{" "}
                {booking.returnFlight.flightNumber} ·{" "}
                {airportLabel(booking.returnFlight.origin)} →{" "}
                {airportLabel(booking.returnFlight.destination)} ·{" "}
                {formatFlightTime(booking.returnFlight.departureAt)}
              </p>
            )}
            <p>
              <span className="text-muted">Fare</span>{" "}
              {booking.fareReleaseName || "—"}
            </p>
            <p>
              <span className="text-muted">Seats</span> {booking.seatsBooked}
            </p>
            <p>
              <span className="text-muted">Amount (AUD)</span>{" "}
              {formatAud(booking.amountPaidCents)}
            </p>
          </div>

          {invoice && (
            <div className="mt-8 border border-line bg-white/70 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    Invoice
                  </p>
                  <p className="mt-1 font-[family-name:var(--font-syne)] text-xl font-semibold">
                    {invoice.invoiceNumber}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold uppercase tracking-[0.14em] ${
                    paid ? "text-accent" : "text-amber-800"
                  }`}
                >
                  {invoice.status}
                </span>
              </div>

              <p className="mt-4 text-sm text-muted">
                Outstanding{" "}
                <span className="font-semibold text-foreground">
                  {formatAud(
                    invoice.status === "paid" ? 0 : invoice.amountCents,
                  )}
                </span>
              </p>

              {invoice.paymentMethod === "bank_transfer" && unpaid && (
                <dl className="mt-5 grid gap-2 border-t border-line pt-5 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Account name</dt>
                    <dd className="font-medium">{invoice.bankAccountName}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">BSB</dt>
                    <dd className="font-medium">{invoice.bankBsb}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Account number</dt>
                    <dd className="font-medium">{invoice.bankAccountNumber}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Payment reference</dt>
                    <dd className="font-semibold text-accent-deep">
                      {invoice.bankReference}
                    </dd>
                  </div>
                </dl>
              )}

              {invoice.paymentMethod === "card" && paid && (
                <p className="mt-4 text-sm text-muted">
                  Paid securely via Square
                  {invoice.squarePaymentId
                    ? ` · ${invoice.squarePaymentId}`
                    : ""}
                </p>
              )}
            </div>
          )}

          <Link
            href="/"
            className="mt-8 inline-flex bg-accent-deep px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent"
          >
            Search again
          </Link>
        </div>
      </div>
    </main>
  );
}
