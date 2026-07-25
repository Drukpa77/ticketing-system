-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN "airfareCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Invoice" ADD COLUMN "airportTaxesCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Invoice" ADD COLUMN "extraBaggageCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Invoice" ADD COLUMN "travelInsuranceCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Invoice" ADD COLUMN "otherChargesCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Invoice" ADD COLUMN "gstRateBps" INTEGER NOT NULL DEFAULT 1000;
ALTER TABLE "Invoice" ADD COLUMN "gstIncluded" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Invoice" ADD COLUMN "accountNumber" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Invoice" ADD COLUMN "businessTpn" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Invoice" ADD COLUMN "routeLabel" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Invoice" ADD COLUMN "seatLabel" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Invoice" ADD COLUMN "nameRef" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Invoice" ADD COLUMN "endorsementText" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Invoice" ADD COLUMN "fareCalculationLine" TEXT NOT NULL DEFAULT '';

-- Backfill airfare from existing fare / net amount
UPDATE "Invoice"
SET "airfareCents" = CASE
  WHEN "fareCents" > 0 THEN "fareCents"
  ELSE GREATEST(0, "amountCents" - "serviceFeeCents")
END
WHERE "airfareCents" = 0;
