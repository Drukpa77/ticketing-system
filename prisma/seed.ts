import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  DEFAULT_DEMAND_BANDS,
  DEFAULT_SCARCITY_BANDS,
} from "../src/lib/pricing/defaults";

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
  await prisma.booking.deleteMany();
  await prisma.priceQuote.deleteMany();
  await prisma.demandEvent.deleteMany();
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
      cabinClass: "economy" as const,
      basePriceCents: 18900,
      totalSeats: 180,
      remainingSeats: 42,
    },
    {
      airline: "Qantas",
      flightNumber: "QF405",
      origin: "SYD",
      destination: "MEL",
      departureAt: daysFromNow(3, 6),
      durationHours: 1.5,
      cabinClass: "economy" as const,
      basePriceCents: 21900,
      totalSeats: 180,
      remainingSeats: 95,
    },
    {
      airline: "Virgin Australia",
      flightNumber: "VA823",
      origin: "SYD",
      destination: "MEL",
      departureAt: daysFromNow(3, 3),
      durationHours: 1.5,
      cabinClass: "economy" as const,
      basePriceCents: 16500,
      totalSeats: 160,
      remainingSeats: 12,
    },
    {
      airline: "Jetstar",
      flightNumber: "JQ503",
      origin: "MEL",
      destination: "SYD",
      departureAt: daysFromNow(4, 4),
      durationHours: 1.5,
      cabinClass: "economy" as const,
      basePriceCents: 12900,
      totalSeats: 186,
      remainingSeats: 140,
    },
    {
      airline: "Qantas",
      flightNumber: "QF511",
      origin: "MEL",
      destination: "BNE",
      departureAt: daysFromNow(5, 2),
      durationHours: 2.2,
      cabinClass: "economy" as const,
      basePriceCents: 24900,
      totalSeats: 168,
      remainingSeats: 55,
    },
    {
      airline: "Virgin Australia",
      flightNumber: "VA317",
      origin: "BNE",
      destination: "SYD",
      departureAt: daysFromNow(5, 8),
      durationHours: 1.6,
      cabinClass: "economy" as const,
      basePriceCents: 19900,
      totalSeats: 174,
      remainingSeats: 8,
    },
    {
      airline: "Qantas",
      flightNumber: "QF9",
      origin: "SYD",
      destination: "LHR",
      departureAt: daysFromNow(10, 15),
      durationHours: 23,
      cabinClass: "economy" as const,
      basePriceCents: 189900,
      totalSeats: 250,
      remainingSeats: 61,
    },
    {
      airline: "Qantas",
      flightNumber: "QF1",
      origin: "SYD",
      destination: "SIN",
      departureAt: daysFromNow(7, 11),
      durationHours: 8.5,
      cabinClass: "economy" as const,
      basePriceCents: 68900,
      totalSeats: 220,
      remainingSeats: 33,
    },
    {
      airline: "Qantas",
      flightNumber: "QF63",
      origin: "SYD",
      destination: "AKL",
      departureAt: daysFromNow(6, 9),
      durationHours: 3.2,
      cabinClass: "economy" as const,
      basePriceCents: 42900,
      totalSeats: 174,
      remainingSeats: 70,
    },
    {
      airline: "Virgin Australia",
      flightNumber: "VA551",
      origin: "PER",
      destination: "SYD",
      departureAt: daysFromNow(8, 0),
      durationHours: 5,
      cabinClass: "economy" as const,
      basePriceCents: 45900,
      totalSeats: 168,
      remainingSeats: 22,
    },
    {
      airline: "Jetstar",
      flightNumber: "JQ7",
      origin: "MEL",
      destination: "CNS",
      departureAt: daysFromNow(9, 5),
      durationHours: 3.5,
      cabinClass: "economy" as const,
      basePriceCents: 27900,
      totalSeats: 186,
      remainingSeats: 4,
    },
    {
      airline: "Qantas",
      flightNumber: "QF441",
      origin: "SYD",
      destination: "MEL",
      departureAt: daysFromNow(2, 22),
      durationHours: 1.5,
      cabinClass: "business" as const,
      basePriceCents: 68900,
      totalSeats: 28,
      remainingSeats: 6,
    },
    {
      airline: "Qantas",
      flightNumber: "QF79",
      origin: "MEL",
      destination: "LAX",
      departureAt: daysFromNow(14, 12),
      durationHours: 15,
      cabinClass: "economy" as const,
      basePriceCents: 129900,
      totalSeats: 240,
      remainingSeats: 110,
    },
    {
      airline: "Virgin Australia",
      flightNumber: "VA1427",
      origin: "ADL",
      destination: "MEL",
      departureAt: daysFromNow(4, 7),
      durationHours: 1.3,
      cabinClass: "economy" as const,
      basePriceCents: 15900,
      totalSeats: 150,
      remainingSeats: 88,
    },
  ];

  for (const flight of flights) {
    const { durationHours, ...rest } = flight;
    await prisma.flight.create({
      data: {
        ...rest,
        arrivalAt: addHours(flight.departureAt, durationHours),
        currency: "AUD",
        active: true,
      },
    });
  }

  console.log(`Seeded ${flights.length} flights and default PricingConfig`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
