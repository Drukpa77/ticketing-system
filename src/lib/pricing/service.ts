import { prisma } from "@/lib/db";
import { getCurrentFareRelease } from "@/lib/fares/current";
import {
  calculatePrice,
  computeDemandScore,
  type PriceBreakdown,
} from "@/lib/pricing";
import { AUTO_PRICING } from "@/lib/pricing/auto";

export function getPricingConfig() {
  return {
    id: "auto",
    ...AUTO_PRICING,
  };
}

export async function getDemandScoreForFlight(
  flightId: string,
  demandWindowMinutes: number = AUTO_PRICING.demandWindowMinutes,
): Promise<number> {
  const scores = await getDemandScoresForFlights(
    [flightId],
    demandWindowMinutes,
  );
  return scores.get(flightId) ?? 0;
}

/** One DB round-trip for many flights (search results). */
export async function getDemandScoresForFlights(
  flightIds: string[],
  demandWindowMinutes: number = AUTO_PRICING.demandWindowMinutes,
): Promise<Map<string, number>> {
  const scores = new Map<string, number>();
  if (flightIds.length === 0) return scores;

  const since = new Date(Date.now() - demandWindowMinutes * 60 * 1000);
  const events = await prisma.demandEvent.findMany({
    where: { flightId: { in: flightIds }, createdAt: { gte: since } },
    select: { flightId: true, type: true },
  });

  const byFlight = new Map<
    string,
    Array<{ type: "view" | "hold" | "purchase" }>
  >();
  for (const event of events) {
    const list = byFlight.get(event.flightId) ?? [];
    list.push({ type: event.type });
    byFlight.set(event.flightId, list);
  }

  for (const id of flightIds) {
    scores.set(id, computeDemandScore(byFlight.get(id) ?? []));
  }
  return scores;
}

export type FlightPriceResult = PriceBreakdown & {
  fareReleaseId: string | null;
  fareReleaseName: string | null;
  farePriced: boolean;
};

export async function priceFlight(flight: {
  id: string;
  remainingSeats: number;
  totalSeats: number;
  fareReleases?: {
    id: string;
    name: string;
    sortOrder: number;
    totalSeats: number;
    remainingSeats: number;
    priceCents: number;
    active: boolean;
  }[];
}): Promise<FlightPriceResult> {
  const releases =
    flight.fareReleases ??
    (await prisma.fareRelease.findMany({
      where: { flightId: flight.id },
      orderBy: { sortOrder: "asc" },
    }));

  const current = getCurrentFareRelease(releases);
  const config = getPricingConfig();
  const demandScore = await getDemandScoreForFlight(
    flight.id,
    config.demandWindowMinutes,
  );

  if (!current || current.priceCents <= 0) {
    return {
      basePriceCents: 0,
      displayPriceCents: 0,
      baseMarkup: config.baseMarkup,
      demandMultiplier: 1,
      scarcityMultiplier: 1,
      demandScore,
      remainingSeats: flight.remainingSeats,
      totalSeats: flight.totalSeats,
      fareReleaseId: current?.id ?? null,
      fareReleaseName: current?.name ?? null,
      farePriced: false,
    };
  }

  const breakdown = calculatePrice({
    basePriceCents: current.priceCents,
    remainingSeats: flight.remainingSeats,
    totalSeats: flight.totalSeats,
    demandScore,
    config,
  });

  return {
    ...breakdown,
    fareReleaseId: current.id,
    fareReleaseName: current.name,
    farePriced: true,
  };
}

export async function recordDemandEvent(
  flightId: string,
  type: "view" | "hold" | "purchase",
  sessionId: string,
) {
  await prisma.demandEvent.create({
    data: { flightId, type, sessionId },
  });
}
