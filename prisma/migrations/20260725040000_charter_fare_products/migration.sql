-- Charter fare catalogue + quote/booking product snapshot fields

ALTER TABLE "PriceQuote" ADD COLUMN IF NOT EXISTS "fareProductCode" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PriceQuote" ADD COLUMN IF NOT EXISTS "fareProductName" TEXT NOT NULL DEFAULT '';

ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "fareProductCode" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "fareProductName" TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS "CharterFareProduct" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cabinClass" "CabinClass" NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "tagline" TEXT NOT NULL DEFAULT '',
    "recommended" BOOLEAN NOT NULL DEFAULT false,
    "mostPopular" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "flightChangeLabel" TEXT NOT NULL,
    "refundLabel" TEXT NOT NULL,
    "checkedBaggage" TEXT NOT NULL,
    "cabinBaggage" TEXT NOT NULL DEFAULT '7kg',
    "seatSelection" TEXT NOT NULL,
    "mealLabel" TEXT NOT NULL DEFAULT 'Meal Included',
    "frequentFlyerLabel" TEXT NOT NULL DEFAULT 'Not Applicable',
    "priorityCheckIn" TEXT NOT NULL DEFAULT 'No',
    "priorityBoarding" TEXT NOT NULL DEFAULT 'No',
    "changePermitted" BOOLEAN NOT NULL DEFAULT true,
    "changeFeeLabel" TEXT NOT NULL DEFAULT '',
    "refundPermitted" BOOLEAN NOT NULL DEFAULT false,
    "refundFeeLabel" TEXT NOT NULL DEFAULT '',
    "perkLines" JSONB NOT NULL,
    "changeBullets" JSONB NOT NULL,
    "refundBullets" JSONB NOT NULL,
    "baggageBullets" JSONB NOT NULL,
    "nameChangeBullets" JSONB NOT NULL,
    "noShowBullets" JSONB NOT NULL,
    "loyaltyBullets" JSONB NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CharterFareProduct_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CharterFareProduct_code_key" ON "CharterFareProduct"("code");
CREATE INDEX IF NOT EXISTS "CharterFareProduct_cabinClass_sortOrder_idx" ON "CharterFareProduct"("cabinClass", "sortOrder");
CREATE INDEX IF NOT EXISTS "CharterFareProduct_active_idx" ON "CharterFareProduct"("active");
