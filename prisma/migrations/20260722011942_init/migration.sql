-- CreateEnum
CREATE TYPE "CabinClass" AS ENUM ('economy', 'premium_economy', 'business', 'first');

-- CreateEnum
CREATE TYPE "DemandEventType" AS ENUM ('view', 'hold', 'purchase');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('active', 'used', 'expired');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('confirmed', 'cancelled');

-- CreateTable
CREATE TABLE "Flight" (
    "id" TEXT NOT NULL,
    "airline" TEXT NOT NULL,
    "flightNumber" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "departureAt" TIMESTAMP(3) NOT NULL,
    "arrivalAt" TIMESTAMP(3) NOT NULL,
    "cabinClass" "CabinClass" NOT NULL DEFAULT 'economy',
    "basePriceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "totalSeats" INTEGER NOT NULL,
    "remainingSeats" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Flight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemandEvent" (
    "id" TEXT NOT NULL,
    "flightId" TEXT NOT NULL,
    "type" "DemandEventType" NOT NULL,
    "sessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemandEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceQuote" (
    "id" TEXT NOT NULL,
    "flightId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "quotedPriceCents" INTEGER NOT NULL,
    "basePriceSnapshotCents" INTEGER NOT NULL,
    "demandMultiplier" DOUBLE PRECISION NOT NULL,
    "scarcityMultiplier" DOUBLE PRECISION NOT NULL,
    "baseMarkup" DOUBLE PRECISION NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceQuote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "flightId" TEXT NOT NULL,
    "passengerName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "seatsBooked" INTEGER NOT NULL DEFAULT 1,
    "amountPaidCents" INTEGER NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'confirmed',
    "bookingRef" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'default',
    "baseMarkup" DOUBLE PRECISION NOT NULL DEFAULT 0.08,
    "demandWindowMinutes" INTEGER NOT NULL DEFAULT 45,
    "quoteTtlMinutes" INTEGER NOT NULL DEFAULT 15,
    "maxUplift" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "demandBands" JSONB NOT NULL,
    "scarcityBands" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Flight_origin_destination_departureAt_idx" ON "Flight"("origin", "destination", "departureAt");

-- CreateIndex
CREATE INDEX "Flight_active_idx" ON "Flight"("active");

-- CreateIndex
CREATE INDEX "DemandEvent_flightId_createdAt_idx" ON "DemandEvent"("flightId", "createdAt");

-- CreateIndex
CREATE INDEX "DemandEvent_sessionId_idx" ON "DemandEvent"("sessionId");

-- CreateIndex
CREATE INDEX "PriceQuote_sessionId_idx" ON "PriceQuote"("sessionId");

-- CreateIndex
CREATE INDEX "PriceQuote_expiresAt_idx" ON "PriceQuote"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_quoteId_key" ON "Booking"("quoteId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_bookingRef_key" ON "Booking"("bookingRef");

-- CreateIndex
CREATE INDEX "Booking_flightId_idx" ON "Booking"("flightId");

-- CreateIndex
CREATE INDEX "Booking_email_idx" ON "Booking"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PricingConfig_name_key" ON "PricingConfig"("name");

-- AddForeignKey
ALTER TABLE "DemandEvent" ADD CONSTRAINT "DemandEvent_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "Flight"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceQuote" ADD CONSTRAINT "PriceQuote_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "Flight"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "PriceQuote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "Flight"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
