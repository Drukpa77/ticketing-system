-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('card', 'bank_transfer');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('unpaid', 'paid', 'cancelled', 'failed');

-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'pending_payment' BEFORE 'confirmed';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "paymentMethod" "PaymentMethod",
ALTER COLUMN "status" SET DEFAULT 'pending_payment';

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'unpaid',
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "squarePaymentId" TEXT,
    "bankAccountName" TEXT,
    "bankBsb" TEXT,
    "bankAccountNumber" TEXT,
    "bankReference" TEXT,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "sentAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "markedPaidByAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_bookingId_key" ON "Invoice"("bookingId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_paymentMethod_idx" ON "Invoice"("paymentMethod");

-- CreateIndex
CREATE INDEX "Invoice_createdAt_idx" ON "Invoice"("createdAt");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;