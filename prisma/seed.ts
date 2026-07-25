import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  DEFAULT_DEMAND_BANDS,
  DEFAULT_SCARCITY_BANDS,
} from "../src/lib/pricing/defaults";
import { fareTemplateForCabin } from "../src/lib/fares/templates";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database");
}

if (
  process.env.NODE_ENV === "production" &&
  process.env.ALLOW_SEED !== "1"
) {
  throw new Error(
    "Refusing to seed production without ALLOW_SEED=1 (destroys bookings/invoices).",
  );
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function daysFromNow(days: number, hourUTC = 2): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hourUTC, 0, 0, 0);
  return d;
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

/** Drukair charter demo: Perth ⇄ Paro (business cabin). */
async function main() {
  await prisma.invoice.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.priceQuote.deleteMany();
  await prisma.demandEvent.deleteMany();
  await prisma.fareRelease.deleteMany();
  await prisma.flight.deleteMany();
  await prisma.pricingConfig.deleteMany();

  await prisma.pricingConfig.create({
    data: {
      name: "default",
      baseMarkup: 0.08,
      demandWindowMinutes: 45,
      quoteTtlMinutes: 15,
      maxUplift: 0.25,
      demandBands: DEFAULT_DEMAND_BANDS,
      scarcityBands: DEFAULT_SCARCITY_BANDS,
    },
  });

  // Inventory buckets (prices are overridden by CharterFareProduct at checkout).
  // Keep release prices > 0 so createPriceQuote gates pass.
  const businessReleasePrices = [129_900, 159_900, 189_900];
  const economyReleasePrices = [89_900, 109_900, 129_900];

  const schedules = [
    {
      airline: "Drukair",
      flightNumber: "KB500",
      origin: "PER",
      destination: "PBH",
      departureAt: daysFromNow(5, 2),
      durationHours: 9.5,
    },
    {
      airline: "Drukair",
      flightNumber: "KB501",
      origin: "PBH",
      destination: "PER",
      departureAt: daysFromNow(12, 6),
      durationHours: 9.5,
    },
    {
      airline: "Drukair",
      flightNumber: "KB502",
      origin: "PER",
      destination: "PBH",
      departureAt: daysFromNow(8, 1),
      durationHours: 9.5,
    },
    {
      airline: "Drukair",
      flightNumber: "KB503",
      origin: "PBH",
      destination: "PER",
      departureAt: daysFromNow(15, 5),
      durationHours: 9.5,
    },
    {
      airline: "Drukair",
      flightNumber: "KB510",
      origin: "PER",
      destination: "PBH",
      departureAt: daysFromNow(19, 3),
      durationHours: 9.5,
    },
    {
      airline: "Drukair",
      flightNumber: "KB511",
      origin: "PBH",
      destination: "PER",
      departureAt: daysFromNow(26, 7),
      durationHours: 9.5,
    },
  ] as const;

  const cabins = ["economy", "business"] as const;
  let created = 0;

  for (const schedule of schedules) {
    for (const cabinClass of cabins) {
      const template = fareTemplateForCabin(cabinClass);
      const releasePrices =
        cabinClass === "business"
          ? businessReleasePrices
          : economyReleasePrices;
      const releases = template.map((t, i) => ({
        name: t.name,
        sortOrder: t.sortOrder,
        totalSeats: t.totalSeats,
        remainingSeats: t.totalSeats,
        priceCents: releasePrices[i] ?? releasePrices[0],
        active: true,
      }));
      const totalSeats = releases.reduce((s, r) => s + r.totalSeats, 0);

      await prisma.flight.create({
        data: {
          airline: schedule.airline,
          flightNumber: schedule.flightNumber,
          origin: schedule.origin,
          destination: schedule.destination,
          departureAt: schedule.departureAt,
          cabinClass,
          arrivalAt: addHours(schedule.departureAt, schedule.durationHours),
          currency: "AUD",
          totalSeats,
          remainingSeats: totalSeats,
          active: true,
          fareReleases: { create: releases },
        },
      });
      created += 1;
    }
  }

  console.log(
    `Seeded ${created} Drukair PER⇄PBH flights (KB500–KB511 · economy + business)`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
