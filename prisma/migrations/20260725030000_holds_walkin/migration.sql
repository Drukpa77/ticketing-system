-- 48h holds, walk-in bookings, cash payment method

ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'hold_expired';
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'cash';

DO $$ BEGIN
  CREATE TYPE "BookingSource" AS ENUM ('online', 'walk_in');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "Booking" ALTER COLUMN "quoteId" DROP NOT NULL;

ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "source" "BookingSource" NOT NULL DEFAULT 'online';
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "holdExpiresAt" TIMESTAMP(3);

-- Existing unpaid bank transfers: 48h from creation if dueAt/hold not set
UPDATE "Booking" b
SET "holdExpiresAt" = b."createdAt" + INTERVAL '48 hours'
WHERE b."status" = 'pending_payment'
  AND b."paymentMethod" = 'bank_transfer'
  AND b."holdExpiresAt" IS NULL;

UPDATE "Invoice" i
SET "dueAt" = b."holdExpiresAt"
FROM "Booking" b
WHERE i."bookingId" = b."id"
  AND i."status" = 'unpaid'
  AND b."holdExpiresAt" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "Booking_status_holdExpiresAt_idx" ON "Booking"("status", "holdExpiresAt");
CREATE INDEX IF NOT EXISTS "Booking_createdAt_idx" ON "Booking"("createdAt");
