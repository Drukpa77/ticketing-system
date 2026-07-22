import { prisma } from "@/lib/db";
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

export async function priceFlight(flight: {
  id: string;
  basePriceCents: number;
  remainingSeats: number;
  totalSeats: number;
}): Promise<PriceBreakdown> {
  const config = getPricingConfig();
  const demandScore = await getDemandScoreForFlight(
    flight.id,
    config.demandWindowMinutes,
  );
  return calculatePrice({
    basePriceCents: flight.basePriceCents,
    remainingSeats: flight.remainingSeats,
    totalSeats: flight.totalSeats,
    demandScore,
    config,
  });
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
