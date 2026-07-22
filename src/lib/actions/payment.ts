"use server";

import { randomUUID } from "crypto";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { confirmBooking } from "@/lib/booking/confirmBooking";
import {
  getBankTransferDetails,
  isBankTransferConfigured,
} from "@/lib/payments/bank";
import {
  chargeCardPayment,
  isSquareConfigured,
} from "@/lib/payments/square";
import { getSessionId } from "@/lib/session";
import { bookingSchema } from "@/lib/validation";
import { z } from "zod";

const cardPaymentSchema = bookingSchema.extend({
  sourceId: z.string().min(1, "Card token missing"),
});

function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export async function payWithCardAction(input: {
  quoteId: string;
  passengerName: string;
  email: string;
  seatsBooked: number;
  sourceId: string;
}): Promise<{ error?: string }> {
  try {
    if (!isSquareConfigured()) {
      return {
        error:
          "Card payments are not configured yet. Choose bank transfer instead.",
      };
    }

    const parsed = cardPaymentSchema.safeParse(input);
    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "Invalid payment form",
      };
    }

    const sessionId = await getSessionId();
    const { prisma } = await import("@/lib/db");
    const amountPreview = await prisma.priceQuote.findUnique({
      where: { id: parsed.data.quoteId },
      select: { quotedPriceCents: true, status: true, expiresAt: true },
    });

    if (!amountPreview || amountPreview.status !== "active") {
      return { error: "Quote is no longer available" };
    }
    if (amountPreview.expiresAt <= new Date()) {
      return { error: "Quote has expired — please book again" };
    }

    const amountCents =
      amountPreview.quotedPriceCents * parsed.data.seatsBooked;

    let squarePaymentId: string;
    try {
      const payment = await chargeCardPayment({
        sourceId: parsed.data.sourceId,
        amountCents,
        idempotencyKey: randomUUID(),
        referenceId: parsed.data.quoteId,
        note: `Flight booking ${parsed.data.passengerName}`,
        buyerEmail: parsed.data.email,
      });
      squarePaymentId = payment.paymentId;
    } catch (error) {
      return { error: toErrorMessage(error, "Card payment failed") };
    }

    const result = await confirmBooking({
      quoteId: parsed.data.quoteId,
      sessionId,
      passengerName: parsed.data.passengerName,
      email: parsed.data.email,
      seatsBooked: parsed.data.seatsBooked,
      paymentMethod: "card",
      invoiceStatus: "paid",
      squarePaymentId,
    });

    if (!result.ok) {
      return {
        error: `${result.error}. Your card may have been charged — contact support with Square payment ${squarePaymentId}.`,
      };
    }

    redirect(`/confirmation/${result.booking.id}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("payWithCardAction", error);
    return { error: toErrorMessage(error, "Unexpected card payment error") };
  }
}

export async function payWithBankTransferAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  try {
    if (!isBankTransferConfigured()) {
      return {
        error:
          "Bank transfer is not configured. Ask admin to set bank account details.",
      };
    }

    const parsed = bookingSchema.safeParse({
      quoteId: formData.get("quoteId"),
      passengerName: formData.get("passengerName"),
      email: formData.get("email"),
      seatsBooked: formData.get("seatsBooked") || "1",
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid form" };
    }

    const sessionId = await getSessionId();
    const bank = getBankTransferDetails();

    const result = await confirmBooking({
      ...parsed.data,
      sessionId,
      paymentMethod: "bank_transfer",
      invoiceStatus: "unpaid",
      bankDetails: bank,
    });

    if (!result.ok) {
      return { error: result.error };
    }

    redirect(`/confirmation/${result.booking.id}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("payWithBankTransferAction", error);
    return {
      error: toErrorMessage(error, "Could not create bank transfer invoice"),
    };
  }
}
