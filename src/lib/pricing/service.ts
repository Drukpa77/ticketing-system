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
  const since = new Date(Date.now() - demandWindowMinutes * 60 * 1000);
  const events = await prisma.demandEvent.findMany({
    where: { flightId, createdAt: { gte: since } },
    select: { type: true },
  });
  return computeDemandScore(events);
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
