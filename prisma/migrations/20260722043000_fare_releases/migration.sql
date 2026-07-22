-- Fare releases: Early Bird / Standard / Final Release
-- Admin controls prices per release; flight-level basePriceCents removed

CREATE TABLE "FareRelease" (
    "id" TEXT NOT NULL,
    "flightId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "totalSeats" INTEGER NOT NULL,
    "remainingSeats" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "FareRelease_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FareRelease_flightId_sortOrder_idx" ON "FareRelease"("flightId", "sortOrder");

ALTER TABLE "FareRelease" ADD CONSTRAINT "FareRelease_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "Flight"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill three releases per flight from seat totals + previous base price
INSERT INTO "FareRelease" ("id", "flightId", "name", "sortOrder", "totalSeats", "remainingSeats", "priceCents", "active")
SELECT
  replace(gen_random_uuid()::text, '-', ''),
  f."id",
  'Early Bird',
  1,
  GREATEST(1, ROUND(f."totalSeats" * 0.25)::int),
  GREATEST(0, LEAST(f."remainingSeats", ROUND(f."totalSeats" * 0.25)::int)),
  f."basePriceCents",
  true
FROM "Flight" f;

INSERT INTO "FareRelease" ("id", "flightId", "name", "sortOrder", "totalSeats", "remainingSeats", "priceCents", "active")
SELECT
  replace(gen_random_uuid()::text, '-', ''),
  f."id",
  CASE WHEN f."cabinClass"::text = 'economy' THEN 'Economy Standard' ELSE 'Business Standard' END,
  2,
  GREATEST(1, ROUND(f."totalSeats" * 0.50)::int),
  GREATEST(0, LEAST(
    GREATEST(0, f."remainingSeats" - ROUND(f."totalSeats" * 0.25)::int),
    ROUND(f."totalSeats" * 0.50)::int
  )),
  f."basePriceCents",
  true
FROM "Flight" f;

INSERT INTO "FareRelease" ("id", "flightId", "name", "sortOrder", "totalSeats", "remainingSeats", "priceCents", "active")
SELECT
  replace(gen_random_uuid()::text, '-', ''),
  f."id",
  'Final Release',
  3,
  GREATEST(1, f."totalSeats" - ROUND(f."totalSeats" * 0.25)::int - ROUND(f."totalSeats" * 0.50)::int),
  GREATEST(0, f."remainingSeats" - ROUND(f."totalSeats" * 0.25)::int - ROUND(f."totalSeats" * 0.50)::int),
  f."basePriceCents",
  true
FROM "Flight" f;

UPDATE "Flight" f
SET
  "totalSeats" = s.tot,
  "remainingSeats" = s.rem
FROM (
  SELECT "flightId", SUM("totalSeats") AS tot, SUM("remainingSeats") AS rem
  FROM "FareRelease"
  GROUP BY "flightId"
) s
WHERE f."id" = s."flightId";

ALTER TABLE "PriceQuote" ADD COLUMN "fareReleaseId" TEXT,
ADD COLUMN "fareReleaseName" TEXT NOT NULL DEFAULT '',
ADD COLUMN "returnFareReleaseId" TEXT,
ADD COLUMN "returnFareReleaseName" TEXT NOT NULL DEFAULT '';

ALTER TABLE "Booking" ADD COLUMN "fareReleaseId" TEXT,
ADD COLUMN "fareReleaseName" TEXT NOT NULL DEFAULT '',
ADD COLUMN "returnFareReleaseId" TEXT;

ALTER TABLE "PriceQuote" ADD CONSTRAINT "PriceQuote_fareReleaseId_fkey" FOREIGN KEY ("fareReleaseId") REFERENCES "FareRelease"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PriceQuote" ADD CONSTRAINT "PriceQuote_returnFareReleaseId_fkey" FOREIGN KEY ("returnFareReleaseId") REFERENCES "FareRelease"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_fareReleaseId_fkey" FOREIGN KEY ("fareReleaseId") REFERENCES "FareRelease"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_returnFareReleaseId_fkey" FOREIGN KEY ("returnFareReleaseId") REFERENCES "FareRelease"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Flight" DROP COLUMN "basePriceCents";

BEGIN;
CREATE TYPE "CabinClass_new" AS ENUM ('economy', 'business');
ALTER TABLE "Flight" ALTER COLUMN "cabinClass" DROP DEFAULT;
ALTER TABLE "Flight" ALTER COLUMN "cabinClass" TYPE "CabinClass_new"
  USING (
    CASE
      WHEN "cabinClass"::text IN ('business', 'first') THEN 'business'::"CabinClass_new"
      ELSE 'economy'::"CabinClass_new"
    END
  );
ALTER TYPE "CabinClass" RENAME TO "CabinClass_old";
ALTER TYPE "CabinClass_new" RENAME TO "CabinClass";
DROP TYPE "public"."CabinClass_old";
ALTER TABLE "Flight" ALTER COLUMN "cabinClass" SET DEFAULT 'business';
COMMIT;
