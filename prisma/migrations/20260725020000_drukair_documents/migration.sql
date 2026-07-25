-- Passenger / ticket document fields + invoice fare breakdown

ALTER TABLE "Booking" ADD COLUMN "passengerPhone" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Booking" ADD COLUMN "passportNumber" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Booking" ADD COLUMN "nationality" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Booking" ADD COLUMN "serviceFeeCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Booking" ADD COLUMN "ticketNumber" TEXT;

UPDATE "Booking"
SET "ticketNumber" = 'ET-' || (100000000 + floor(random() * 900000000)::int)::text
WHERE "ticketNumber" IS NULL;

ALTER TABLE "Booking" ALTER COLUMN "ticketNumber" SET NOT NULL;
CREATE UNIQUE INDEX "Booking_ticketNumber_key" ON "Booking"("ticketNumber");

ALTER TABLE "Invoice" ADD COLUMN "fareCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Invoice" ADD COLUMN "serviceFeeCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Invoice" ADD COLUMN "customerPhone" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Invoice" ADD COLUMN "dueAt" TIMESTAMP(3);

UPDATE "Invoice" i
SET "fareCents" = GREATEST(0, i."amountCents" - COALESCE(b."serviceFeeCents", 0)),
    "serviceFeeCents" = COALESCE(b."serviceFeeCents", 0),
    "customerPhone" = COALESCE(b."passengerPhone", '')
FROM "Booking" b
WHERE i."bookingId" = b."id";
