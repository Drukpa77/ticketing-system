-- Soft seat holds on quotes
ALTER TABLE "PriceQuote" ADD COLUMN "inventoryHeld" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PriceQuote" ADD COLUMN "heldSeats" INTEGER NOT NULL DEFAULT 0;

-- Unguessable document / confirmation access tokens
ALTER TABLE "Booking" ADD COLUMN "accessToken" TEXT;

UPDATE "Booking"
SET "accessToken" = md5(random()::text || id || clock_timestamp()::text)
                 || md5(random()::text || "bookingRef")
WHERE "accessToken" IS NULL;

ALTER TABLE "Booking" ALTER COLUMN "accessToken" SET NOT NULL;

CREATE UNIQUE INDEX "Booking_accessToken_key" ON "Booking"("accessToken");
