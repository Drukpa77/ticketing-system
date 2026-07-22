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

  const flights = [
    {
      airline: "Qantas",
      flightNumber: "QF401",
      origin: "SYD",
      destination: "MEL",
      departureAt: daysFromNow(3, 1),
      durationHours: 1.5,
      cabinClass: "business" as const,
    },
    {
      airline: "Qantas",
      flightNumber: "QF402",
      origin: "MEL",
      destination: "SYD",
      departureAt: daysFromNow(7, 4),
      durationHours: 1.5,
      cabinClass: "business" as const,
    },
    {
      airline: "Virgin Australia",
      flightNumber: "VA823",
      origin: "SYD",
      destination: "MEL",
      departureAt: daysFromNow(3, 3),
      durationHours: 1.5,
      cabinClass: "business" as const,
    },
    {
      airline: "Qantas",
      flightNumber: "QF511",
      origin: "MEL",
      destination: "BNE",
      departureAt: daysFromNow(5, 2),
      durationHours: 2.2,
      cabinClass: "economy" as const,
    },
    {
      airline: "Virgin Australia",
      flightNumber: "VA317",
      origin: "BNE",
      destination: "SYD",
      departureAt: daysFromNow(5, 8),
      durationHours: 1.6,
      cabinClass: "business" as const,
    },
    {
      airline: "Qantas",
      flightNumber: "QF1",
      origin: "SYD",
      destination: "SIN",
      departureAt: daysFromNow(7, 11),
      durationHours: 8.5,
      cabinClass: "business" as const,
    },
    {
      airline: "Qantas",
      flightNumber: "QF2",
      origin: "SIN",
      destination: "SYD",
      departureAt: daysFromNow(14, 9),
      durationHours: 8.5,
      cabinClass: "business" as const,
    },
  ];

  // Demo prices so search works out of the box — admin can change anytime.
  const demoPricesBusiness = [449900, 499900, 549900];
  const demoPricesEconomy = [89900, 109900, 129900];

  for (const flight of flights) {
    const { durationHours, cabinClass, ...rest } = flight;
    const template = fareTemplateForCabin(cabinClass);
    const prices =
      cabinClass === "economy" ? demoPricesEconomy : demoPricesBusiness;
    const releases = template.map((t, i) => ({
      name: t.name,
      sortOrder: t.sortOrder,
      totalSeats: t.totalSeats,
      remainingSeats: t.totalSeats,
      priceCents: prices[i] ?? 0,
      active: true,
    }));
    const totalSeats = releases.reduce((s, r) => s + r.totalSeats, 0);

    await prisma.flight.create({
      data: {
        ...rest,
        cabinClass,
        arrivalAt: addHours(flight.departureAt, durationHours),
        currency: "AUD",
        totalSeats,
        remainingSeats: totalSeats,
        active: true,
        fareReleases: { create: releases },
      },
    });
  }

  console.log(
    `Seeded ${flights.length} flights with Early Bird / Standard / Final Release fares`,
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
