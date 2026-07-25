import Link from "next/link";
import { notFound } from "next/navigation";
import { FareComparisonRow } from "@/components/fares/FareComparisonRow";
import { SelectedFlightSummary } from "@/components/fares/SelectedFlightSummary";
import { getBrand } from "@/lib/branding";
import { prisma } from "@/lib/db";
import { buildFareProducts } from "@/lib/fares/products";
import { priceFlight, recordDemandEvent } from "@/lib/pricing/service";
import { getSessionId } from "@/lib/session";

export default async function TripReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ outboundId?: string; returnId?: string }>;
}) {
  const { outboundId, returnId } = await searchParams;
  if (!outboundId || !returnId) notFound();

  const brand = getBrand();
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

  const products = buildFareProducts({
    basePriceCents: total,
    cabinClass: outbound.cabinClass,
    farePriced: outPrice.farePriced && retPrice.farePriced,
  });

  return (
    <main className="min-h-[calc(100svh-4rem)] bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Link
          href="/"
          className="text-sm font-medium text-accent transition hover:text-accent-deep"
        >
          ← Back to results
        </Link>

        <div className="mt-5 space-y-6">
          <SelectedFlightSummary
            outbound={outbound}
            returnFlight={returnFlight}
          />

          <FareComparisonRow
            products={products}
            flightId={outbound.id}
            returnFlightId={returnFlight.id}
            supportEmail={brand.supportEmail}
            disabled={soldOut}
          />
        </div>
      </div>
    </main>
  );
}
