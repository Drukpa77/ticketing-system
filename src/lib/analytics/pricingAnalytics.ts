import { prisma } from "@/lib/db";
import { AUTO_PRICING } from "@/lib/pricing/auto";
import { priceFlight } from "@/lib/pricing/service";

export type PriceReason = {
  label: string;
  detail: string;
};

export type FlightPriceAnalytics = {
  flightId: string;
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  cabinClass: string;
  active: boolean;
  basePriceCents: number;
  livePriceCents: number;
  upliftCents: number;
  upliftPercent: number;
  demandScore: number;
  demandMultiplier: number;
  scarcityMultiplier: number;
  remainingSeats: number;
  totalSeats: number;
  seatFillPercent: number;
  recentViews: number;
  recentHolds: number;
  recentPurchases: number;
  reasons: PriceReason[];
  status: "up" | "flat" | "at_cap";
  primaryDriver: "demand" | "scarcity" | "both" | "none";
};

export type AnalyticsGroup = {
  key: string;
  title: string;
  subtitle: string;
  flightCount: number;
  risingCount: number;
  atCapCount: number;
  avgUpliftPercent: number;
  maxUpliftPercent: number;
  avgLivePriceCents: number;
  avgBasePriceCents: number;
  avgSeatFillPercent: number;
  totalViews: number;
  totalHolds: number;
  totalPurchases: number;
  topDriver: string;
  hottestFlightLabel: string;
  hottestUpliftPercent: number;
  flights: FlightPriceAnalytics[];
};

export type GroupedPriceAnalytics = {
  overall: {
    activeFlights: number;
    risingCount: number;
    avgUpliftPercent: number;
    destinationsRising: number;
    cabinTypesRising: number;
  };
  byDestination: AnalyticsGroup[];
  byCabin: AnalyticsGroup[];
  byRoute: AnalyticsGroup[];
};

function demandLevel(score: number): string {
  if (score <= 5) return "Quiet";
  if (score <= 20) return "Steady interest";
  if (score <= 50) return "Busy";
  return "Very high demand";
}

function scarcityLevel(ratio: number): string {
  if (ratio <= 0.1) return "Almost sold out";
  if (ratio <= 0.2) return "Few seats left";
  if (ratio <= 0.5) return "Selling down";
  return "Plenty of seats";
}

function cabinLabel(cabin: string): string {
  return cabin.replaceAll("_", " ");
}

function primaryDriverOf(row: {
  demandMultiplier: number;
  scarcityMultiplier: number;
  upliftCents: number;
}): FlightPriceAnalytics["primaryDriver"] {
  if (row.upliftCents <= 0) return "none";
  const demandUp = row.demandMultiplier > 1;
  const scarcityUp = row.scarcityMultiplier > 1;
  if (demandUp && scarcityUp) return "both";
  if (demandUp) return "demand";
  if (scarcityUp) return "scarcity";
  return "none";
}

export function explainPriceReasons(input: {
  basePriceCents: number;
  livePriceCents: number;
  baseMarkup: number;
  demandScore: number;
  demandMultiplier: number;
  scarcityMultiplier: number;
  remainingSeats: number;
  totalSeats: number;
  maxUplift: number;
  recentViews: number;
  recentHolds: number;
  recentPurchases: number;
}): PriceReason[] {
  const reasons: PriceReason[] = [];
  const ratio =
    input.totalSeats > 0 ? input.remainingSeats / input.totalSeats : 1;
  const maxPrice = Math.round(input.basePriceCents * (1 + input.maxUplift));

  if (input.demandMultiplier > 1) {
    reasons.push({
      label: demandLevel(input.demandScore),
      detail: `Interest score ${input.demandScore} from ${input.recentViews} views, ${input.recentHolds} holds, ${input.recentPurchases} bookings.`,
    });
  }

  if (input.scarcityMultiplier > 1) {
    reasons.push({
      label: scarcityLevel(ratio),
      detail: `${input.remainingSeats} of ${input.totalSeats} seats left (${Math.round((1 - ratio) * 100)}% sold).`,
    });
  }

  if (
    input.livePriceCents >= maxPrice &&
    input.livePriceCents > input.basePriceCents
  ) {
    reasons.push({
      label: "At maximum",
      detail: `Hit the +${Math.round(input.maxUplift * 100)}% ceiling above ticket price.`,
    });
  }

  if (reasons.length === 0) {
    reasons.push({
      label: "No pressure",
      detail: "Interest is calm and seats are still available, so fare stays near ticket price.",
    });
  }

  return reasons;
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function buildGroup(
  key: string,
  title: string,
  subtitle: string,
  flights: FlightPriceAnalytics[],
): AnalyticsGroup {
  const rising = flights.filter((f) => f.upliftCents > 0);
  const atCap = flights.filter((f) => f.status === "at_cap");

  let demandDriven = 0;
  let scarcityDriven = 0;
  let both = 0;
  for (const f of rising) {
    if (f.primaryDriver === "both") both += 1;
    else if (f.primaryDriver === "demand") demandDriven += 1;
    else if (f.primaryDriver === "scarcity") scarcityDriven += 1;
  }

  const topDriver =
    rising.length === 0
      ? "Prices steady"
      : both >= demandDriven && both >= scarcityDriven && both > 0
        ? "Interest + low seats together"
        : scarcityDriven > demandDriven
          ? "Mostly low seats left"
          : demandDriven > scarcityDriven
            ? "Mostly customer interest"
            : "Mix of interest and seats";

  const hottest = [...flights].sort(
    (a, b) => b.upliftPercent - a.upliftPercent,
  )[0];

  return {
    key,
    title,
    subtitle,
    flightCount: flights.length,
    risingCount: rising.length,
    atCapCount: atCap.length,
    avgUpliftPercent: round1(avg(flights.map((f) => f.upliftPercent))),
    maxUpliftPercent: round1(
      Math.max(0, ...flights.map((f) => f.upliftPercent)),
    ),
    avgLivePriceCents: Math.round(avg(flights.map((f) => f.livePriceCents))),
    avgBasePriceCents: Math.round(avg(flights.map((f) => f.basePriceCents))),
    avgSeatFillPercent: Math.round(avg(flights.map((f) => f.seatFillPercent))),
    totalViews: flights.reduce((s, f) => s + f.recentViews, 0),
    totalHolds: flights.reduce((s, f) => s + f.recentHolds, 0),
    totalPurchases: flights.reduce((s, f) => s + f.recentPurchases, 0),
    topDriver,
    hottestFlightLabel: hottest
      ? `${hottest.airline} ${hottest.flightNumber}`
      : "—",
    hottestUpliftPercent: hottest ? hottest.upliftPercent : 0,
    flights: [...flights].sort((a, b) => b.upliftPercent - a.upliftPercent),
  };
}

function groupBy(
  rows: FlightPriceAnalytics[],
  getKey: (row: FlightPriceAnalytics) => string,
  getTitle: (key: string, rows: FlightPriceAnalytics[]) => string,
  getSubtitle: (key: string, rows: FlightPriceAnalytics[]) => string,
): AnalyticsGroup[] {
  const map = new Map<string, FlightPriceAnalytics[]>();
  for (const row of rows) {
    const key = getKey(row);
    const list = map.get(key) ?? [];
    list.push(row);
    map.set(key, list);
  }

  return [...map.entries()]
    .map(([key, flights]) =>
      buildGroup(key, getTitle(key, flights), getSubtitle(key, flights), flights),
    )
    .sort((a, b) => b.avgUpliftPercent - a.avgUpliftPercent || b.risingCount - a.risingCount);
}

export async function getFlightPriceAnalytics(): Promise<GroupedPriceAnalytics> {
  const flights = await prisma.flight.findMany({
    where: { active: true },
    orderBy: { departureAt: "asc" },
  });

  const since = new Date(
    Date.now() - AUTO_PRICING.demandWindowMinutes * 60 * 1000,
  );

  const rows: FlightPriceAnalytics[] = [];

  for (const flight of flights) {
    const [price, events] = await Promise.all([
      priceFlight(flight),
      prisma.demandEvent.groupBy({
        by: ["type"],
        where: { flightId: flight.id, createdAt: { gte: since } },
        _count: { _all: true },
      }),
    ]);

    const counts = { view: 0, hold: 0, purchase: 0 };
    for (const row of events) {
      counts[row.type] = row._count._all;
    }

    const upliftCents = price.displayPriceCents - price.basePriceCents;
    const upliftPercent =
      price.basePriceCents > 0
        ? round1((upliftCents / price.basePriceCents) * 100)
        : 0;
    const maxPrice = Math.round(
      price.basePriceCents * (1 + AUTO_PRICING.maxUplift),
    );
    const status: FlightPriceAnalytics["status"] =
      upliftCents <= 0
        ? "flat"
        : price.displayPriceCents >= maxPrice
          ? "at_cap"
          : "up";

    const demandMultiplier = price.demandMultiplier;
    const scarcityMultiplier = price.scarcityMultiplier;

    rows.push({
      flightId: flight.id,
      airline: flight.airline,
      flightNumber: flight.flightNumber,
      origin: flight.origin,
      destination: flight.destination,
      cabinClass: flight.cabinClass,
      active: flight.active,
      basePriceCents: price.basePriceCents,
      livePriceCents: price.displayPriceCents,
      upliftCents,
      upliftPercent,
      demandScore: price.demandScore,
      demandMultiplier,
      scarcityMultiplier,
      remainingSeats: flight.remainingSeats,
      totalSeats: flight.totalSeats,
      seatFillPercent: Math.round(
        ((flight.totalSeats - flight.remainingSeats) /
          Math.max(flight.totalSeats, 1)) *
          100,
      ),
      recentViews: counts.view,
      recentHolds: counts.hold,
      recentPurchases: counts.purchase,
      reasons: explainPriceReasons({
        basePriceCents: price.basePriceCents,
        livePriceCents: price.displayPriceCents,
        baseMarkup: price.baseMarkup,
        demandScore: price.demandScore,
        demandMultiplier,
        scarcityMultiplier,
        remainingSeats: flight.remainingSeats,
        totalSeats: flight.totalSeats,
        maxUplift: AUTO_PRICING.maxUplift,
        recentViews: counts.view,
        recentHolds: counts.hold,
        recentPurchases: counts.purchase,
      }),
      status,
      primaryDriver: primaryDriverOf({
        demandMultiplier,
        scarcityMultiplier,
        upliftCents,
      }),
    });
  }

  const byDestination = groupBy(
    rows,
    (r) => r.destination,
    (key) => `To ${key}`,
    (key, list) =>
      `${list.length} flight${list.length === 1 ? "" : "s"} landing in ${key}`,
  );

  const byCabin = groupBy(
    rows,
    (r) => r.cabinClass,
    (key) => cabinLabel(key),
    (_key, list) =>
      `${list.length} flight${list.length === 1 ? "" : "s"} in this ticket type`,
  );

  const byRoute = groupBy(
    rows,
    (r) => `${r.origin}-${r.destination}`,
    (key) => key.replace("-", " → "),
    (_key, list) =>
      `${list.length} flight${list.length === 1 ? "" : "s"} on this route`,
  );

  const rising = rows.filter((r) => r.upliftCents > 0);

  return {
    overall: {
      activeFlights: rows.length,
      risingCount: rising.length,
      avgUpliftPercent: round1(avg(rows.map((r) => r.upliftPercent))),
      destinationsRising: byDestination.filter((g) => g.risingCount > 0).length,
      cabinTypesRising: byCabin.filter((g) => g.risingCount > 0).length,
    },
    byDestination,
    byCabin,
    byRoute,
  };
}
