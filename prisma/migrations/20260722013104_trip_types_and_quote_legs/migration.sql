/*
  Warnings:

  - Added the required column `outboundPriceCents` to the `PriceQuote` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TripType" AS ENUM ('one_way', 'round_trip');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "returnFlightId" TEXT,
ADD COLUMN     "tripType" "TripType" NOT NULL DEFAULT 'one_way';

-- AlterTable
ALTER TABLE "PriceQuote" ADD COLUMN     "outboundPriceCents" INTEGER NOT NULL,
ADD COLUMN     "returnFlightId" TEXT,
ADD COLUMN     "returnPriceCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tripType" "TripType" NOT NULL DEFAULT 'one_way';

-- AddForeignKey
ALTER TABLE "PriceQuote" ADD CONSTRAINT "PriceQuote_returnFlightId_fkey" FOREIGN KEY ("returnFlightId") REFERENCES "Flight"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_returnFlightId_fkey" FOREIGN KEY ("returnFlightId") REFERENCES "Flight"("id") ON DELETE SET NULL ON UPDATE CASCADE;
