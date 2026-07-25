import Link from "next/link";
import { removeCartItemAction } from "@/lib/actions/cart";
import { getActiveCartQuotes } from "@/lib/cart";
import { airportCity, formatFlightTime } from "@/lib/format";
import { formatAud } from "@/lib/pricing";

export default async function CartPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const params = await searchParams;
  const items = await getActiveCartQuotes();
  const totalCents = items.reduce((sum, q) => sum + q.quotedPriceCents, 0);

  return (
    <main className="page-shell bg-background pb-safe">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
          Your cart
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-syne)] text-3xl font-semibold tracking-tight sm:text-4xl">
          Cart
        </h1>
        <p className="mt-2 text-sm text-muted">
          Held fares stay in your cart for 15 minutes while you check out.
        </p>

        {params.saved === "removed" ? (
          <p className="mt-4 rounded-2xl border border-line bg-white px-4 py-3 text-sm text-accent-deep">
            Item removed from cart.
          </p>
        ) : null}
        {params.error ? (
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {decodeURIComponent(params.error)}
          </p>
        ) : null}

        {items.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-line bg-white px-6 py-14 text-center">
            <p className="font-[family-name:var(--font-syne)] text-xl font-semibold">
              Your cart is empty
            </p>
            <p className="mt-2 text-sm text-muted">
              Search for a flight and select a fare to add it here.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex min-h-11 items-center rounded-full bg-accent-deep px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent"
            >
              Search flights
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {items.map((quote) => {
              const isRound =
                quote.tripType === "round_trip" && quote.returnFlight;
              const minutesLeft = Math.max(
                0,
                Math.round(
                  (quote.expiresAt.getTime() - Date.now()) / 60000,
                ),
              );

              return (
                <article
                  key={quote.id}
                  className="min-w-0 rounded-2xl border border-line bg-white p-4 shadow-[0_10px_28px_rgba(16,35,28,0.05)] sm:p-6"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                        {isRound ? "Round trip" : "One way"}
                      </p>
                      <h2 className="mt-1 break-words font-[family-name:var(--font-syne)] text-lg font-semibold sm:text-xl">
                        {airportCity(quote.flight.origin)} ({quote.flight.origin}) →{" "}
                        {airportCity(quote.flight.destination)} (
                        {quote.flight.destination})
                      </h2>
                    </div>
                    <p className="shrink-0 font-[family-name:var(--font-syne)] text-2xl font-bold tracking-tight">
                      {formatAud(quote.quotedPriceCents)}
                    </p>
                  </div>

                  <div className="mt-4 space-y-3 text-sm text-muted">
                    <div>
                      <p className="font-medium text-foreground">Outbound</p>
                      <p className="mt-0.5 break-words">
                        {quote.flight.airline} {quote.flight.flightNumber} ·{" "}
                        {formatFlightTime(quote.flight.departureAt)}
                        {quote.fareReleaseName
                          ? ` · ${quote.fareReleaseName}`
                          : ""}
                      </p>
                    </div>
                    {isRound && quote.returnFlight ? (
                      <div>
                        <p className="font-medium text-foreground">Return</p>
                        <p className="mt-0.5 break-words">
                          {quote.returnFlight.airline}{" "}
                          {quote.returnFlight.flightNumber} ·{" "}
                          {formatFlightTime(quote.returnFlight.departureAt)}
                          {quote.returnFareReleaseName
                            ? ` · ${quote.returnFareReleaseName}`
                            : ""}
                        </p>
                      </div>
                    ) : null}
                    <p className="text-xs">
                      Price held for about {minutesLeft} minute
                      {minutesLeft === 1 ? "" : "s"}
                    </p>
                  </div>

                  <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <Link
                      href={`/checkout/${quote.id}/passengers`}
                      className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent-deep px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent"
                    >
                      Continue to passenger details
                    </Link>
                    <form action={removeCartItemAction} className="sm:inline">
                      <input type="hidden" name="quoteId" value={quote.id} />
                      <button
                        type="submit"
                        className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-muted transition hover:border-accent hover:text-foreground sm:w-auto"
                      >
                        Remove
                      </button>
                    </form>
                  </div>
                </article>
              );
            })}

            <div className="rounded-2xl border border-line bg-white px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-muted">
                  {items.length} item{items.length === 1 ? "" : "s"}
                </p>
                <p className="font-[family-name:var(--font-syne)] text-xl font-bold">
                  {formatAud(totalCents)}
                </p>
              </div>
              {items.length === 1 ? (
                <Link
                  href={`/checkout/${items[0].id}/passengers`}
                  className="mt-4 flex min-h-11 w-full items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-deep"
                >
                  Continue to passenger details
                </Link>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
