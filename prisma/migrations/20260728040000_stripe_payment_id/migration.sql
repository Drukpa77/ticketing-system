-- Moving from Square to Stripe: rename card payment reference column (lossless).
ALTER TABLE "Invoice" RENAME COLUMN "squarePaymentId" TO "stripePaymentIntentId";
