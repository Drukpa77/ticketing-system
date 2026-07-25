import Link from "next/link";
import { notFound } from "next/navigation";
import { getBrand } from "@/lib/branding";
import { prisma } from "@/lib/db";
import { airportLabel, formatFlightTime } from "@/lib/format";
import { formatAud } from "@/lib/pricing";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const brand = getBrand();
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { flight: true, returnFlight: true, invoice: true, quote: true },
  });
  if (!booking) notFound();

  const isRound = booking.tripType === "round_trip" && booking.returnFlight;
  const invoice = booking.invoice;
  const unpaid = invoice?.status === "unpaid";
  const paid = invoice?.status === "paid" || booking.status === "confirmed";
  const fareOnlyCents =
    invoice?.fareCents ||
    (booking.quote
      ? booking.quote.quotedPriceCents * booking.seatsBooked
      : Math.max(0, booking.amountPaidCents - booking.serviceFeeCents));
  const cardServiceFeeCents =
    booking.paymentMethod === "card"
      ? booking.serviceFeeCents ||
        Math.max(0, booking.amountPaidCents - fareOnlyCents)
      : 0;

  return (
    <main className="page-shell relative overflow-x-clip pb-safe">
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

      <div className="relative mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="rounded-2xl border border-line bg-surface/90 p-5 backdrop-blur-sm sm:rounded-none sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            {brand.airlineName}
          </p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            {unpaid
              ? "Booking reserved · awaiting payment"
              : "Booking confirmed"}
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-syne)] text-3xl font-semibold tracking-tight sm:text-4xl">
            {booking.bookingRef}
          </h1>
          <p className="mt-2 text-sm text-muted">
            Ticket {booking.ticketNumber}
          </p>
          <p className="mt-3 text-muted">
            {booking.passengerName} · {booking.email}
          </p>
          <p className="mt-1 text-sm text-muted">
            {isRound ? "Round trip" : "One way"}
            {booking.paymentMethod === "card"
              ? " · Paid by credit card"
              : booking.paymentMethod === "bank_transfer"
                ? " · Bank transfer"
                : booking.paymentMethod === "cash"
                  ? " · Cash"
                  : ""}
            {booking.source === "walk_in" ? " · Walk-in" : ""}
          </p>

          <div className="mt-8 space-y-4 border-t border-line pt-6 text-sm">
            <div>
              <p className="text-muted">Outbound</p>
              <p className="mt-1 break-words font-medium text-foreground">
                {booking.flight.airline} {booking.flight.flightNumber}
              </p>
              <p className="mt-1 break-words text-muted">
                {airportLabel(booking.flight.origin)} →{" "}
                {airportLabel(booking.flight.destination)}
              </p>
              <p className="mt-1 text-muted">
                {formatFlightTime(booking.flight.departureAt)}
              </p>
            </div>
            {isRound && booking.returnFlight && (
              <div>
                <p className="text-muted">Return</p>
                <p className="mt-1 break-words font-medium text-foreground">
                  {booking.returnFlight.airline}{" "}
                  {booking.returnFlight.flightNumber}
                </p>
                <p className="mt-1 break-words text-muted">
                  {airportLabel(booking.returnFlight.origin)} →{" "}
                  {airportLabel(booking.returnFlight.destination)}
                </p>
                <p className="mt-1 text-muted">
                  {formatFlightTime(booking.returnFlight.departureAt)}
                </p>
              </div>
            )}
            <p>
              <span className="text-muted">Fare</span>{" "}
              {booking.fareReleaseName || "—"}
            </p>
            <p>
              <span className="text-muted">Seats</span> {booking.seatsBooked}
            </p>
            {cardServiceFeeCents > 0 ? (
              <>
                <p>
                  <span className="text-muted">Ticket fare</span>{" "}
                  {formatAud(fareOnlyCents)}
                </p>
                <p>
                  <span className="text-muted">Credit card fee (2.2%)</span>{" "}
                  {formatAud(cardServiceFeeCents)}
                </p>
                <p>
                  <span className="text-muted">Total paid (AUD)</span>{" "}
                  {formatAud(booking.amountPaidCents)}
                </p>
              </>
            ) : (
              <p>
                <span className="text-muted">Amount (AUD)</span>{" "}
                {formatAud(booking.amountPaidCents)}
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link
              href={`/documents/eticket/${encodeURIComponent(booking.bookingRef)}`}
              className={`inline-flex min-h-11 items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                paid
                  ? "bg-accent-deep text-white hover:bg-accent"
                  : "border border-line text-foreground hover:border-accent"
              }`}
              target="_blank"
            >
              View travel document
            </Link>
            {invoice && (
              <Link
                href={`/documents/invoice/${encodeURIComponent(invoice.invoiceNumber)}`}
                className={`inline-flex min-h-11 items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                  unpaid
                    ? "bg-accent-deep text-white hover:bg-accent"
                    : "border border-line text-foreground hover:border-accent"
                }`}
                target="_blank"
              >
                View airfare invoice
              </Link>
            )}
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
                <dl className="mt-5 grid gap-3 border-t border-line pt-5 text-sm">
                  <div className="flex flex-col gap-1 min-[420px]:flex-row min-[420px]:justify-between min-[420px]:gap-4">
                    <dt className="shrink-0 text-muted">Account name</dt>
                    <dd className="min-w-0 break-words font-medium">
                      {invoice.bankAccountName}
                    </dd>
                  </div>
                  <div className="flex flex-col gap-1 min-[420px]:flex-row min-[420px]:justify-between min-[420px]:gap-4">
                    <dt className="shrink-0 text-muted">BSB</dt>
                    <dd className="min-w-0 break-all font-medium">
                      {invoice.bankBsb}
                    </dd>
                  </div>
                  <div className="flex flex-col gap-1 min-[420px]:flex-row min-[420px]:justify-between min-[420px]:gap-4">
                    <dt className="shrink-0 text-muted">Account number</dt>
                    <dd className="min-w-0 break-all font-medium">
                      {invoice.bankAccountNumber}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Payment reference</dt>
                    <dd className="font-semibold text-accent-deep">
                      {invoice.bankReference}
                    </dd>
                  </div>
                  {booking.holdExpiresAt ? (
                    <p className="mt-3 text-xs leading-relaxed text-muted">
                      Seats held until{" "}
                      {booking.holdExpiresAt.toLocaleString("en-AU")}. If
                      payment is not confirmed by then, the hold ends and seats
                      return to the ticket pool.
                    </p>
                  ) : null}
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

              <p className="mt-4 text-sm text-muted">
                {unpaid
                  ? "A bank-transfer email with the airfare invoice is sent when email is configured. Admin can preview, edit, and resend from Invoices."
                  : "A confirmation email with your travel document and airfare invoice is sent when email is configured."}
              </p>
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
