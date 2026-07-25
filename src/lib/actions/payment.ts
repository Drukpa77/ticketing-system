"use server";

import { randomUUID } from "crypto";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { confirmBooking } from "@/lib/booking/confirmBooking";
import {
  sendBankTransferBundle,
  sendBookingConfirmationBundle,
} from "@/lib/email/bookingMail";
import {
  getBankTransferDetails,
  isBankTransferConfigured,
} from "@/lib/payments/bank";
import { calculateCardServiceFee } from "@/lib/payments/fees";
import {
  chargeCardPayment,
  isSquareConfigured,
} from "@/lib/payments/square";
import { getSessionId } from "@/lib/session";
import { bookingSchema } from "@/lib/validation";
import { z } from "zod";

const billingAddressSchema = z.object({
  addressLine1: z.string().trim().min(3, "Billing street address is required"),
  addressLine2: z.string().trim().optional(),
  locality: z.string().trim().min(2, "Billing suburb / city is required"),
  administrativeDistrictLevel1: z.string().trim().optional(),
  postalCode: z.string().trim().min(3, "Billing postcode is required"),
  country: z.string().trim().length(2, "Billing country is required"),
});

const cardPaymentSchema = bookingSchema.extend({
  sourceId: z.string().min(1, "Card token missing"),
  billingAddress: billingAddressSchema,
});

function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export async function payWithCardAction(input: {
  quoteId: string;
  passengerName: string;
  email: string;
  passengerPhone?: string;
  passportNumber?: string;
  nationality?: string;
  seatsBooked: number;
  sourceId: string;
  billingAddress: {
    addressLine1: string;
    addressLine2?: string;
    locality: string;
    administrativeDistrictLevel1?: string;
    postalCode: string;
    country: string;
  };
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

    const fareCents =
      amountPreview.quotedPriceCents * parsed.data.seatsBooked;
    const { totalCents, serviceFeeCents } = calculateCardServiceFee(fareCents);

    let squarePaymentId: string;
    try {
      const payment = await chargeCardPayment({
        sourceId: parsed.data.sourceId,
        amountCents: totalCents,
        idempotencyKey: randomUUID(),
        referenceId: parsed.data.quoteId,
        note: `Flight booking ${parsed.data.passengerName} (incl. 2.2% credit card fee)`,
        buyerEmail: parsed.data.email,
        billingAddress: parsed.data.billingAddress,
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
      passengerPhone: parsed.data.passengerPhone || "",
      passportNumber: parsed.data.passportNumber || "",
      nationality: parsed.data.nationality || "",
      seatsBooked: parsed.data.seatsBooked,
      paymentMethod: "card",
      invoiceStatus: "paid",
      squarePaymentId,
      amountCentsOverride: totalCents,
      serviceFeeCents,
    });

    if (!result.ok) {
      return {
        error: `${result.error}. Your card may have been charged — contact support with Square payment ${squarePaymentId}.`,
      };
    }

    try {
      await sendBookingConfirmationBundle(result.booking.id);
    } catch (err) {
      console.error("confirmation email failed", err);
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
  const fail = (error: string) => {
    console.error("payWithBankTransferAction:", error);
    return { error };
  };

  try {
    if (!isBankTransferConfigured()) {
      return fail(
        "Bank transfer is not configured. Ask admin to set bank account details.",
      );
    }

    const parsed = bookingSchema.safeParse({
      quoteId: formData.get("quoteId"),
      passengerName: formData.get("passengerName"),
      email: formData.get("email"),
      passengerPhone: formData.get("passengerPhone") || "",
      passportNumber: formData.get("passportNumber") || "",
      nationality: formData.get("nationality") || "",
      seatsBooked: formData.get("seatsBooked") || "1",
    });

    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Invalid form");
    }

    const sessionId = await getSessionId();
    const bank = getBankTransferDetails();

    // Creates an unpaid invoice + pending booking (no charge). Admin confirms
    // after the customer emails a payment screenshot.
    const result = await confirmBooking({
      ...parsed.data,
      passengerPhone: parsed.data.passengerPhone || "",
      passportNumber: parsed.data.passportNumber || "",
      nationality: parsed.data.nationality || "",
      sessionId,
      paymentMethod: "bank_transfer",
      invoiceStatus: "unpaid",
      bankDetails: bank,
    });

    if (!result.ok) {
      return fail(result.error);
    }

    let emailed = "0";
    try {
      const mail = await sendBankTransferBundle(result.booking.id);
      emailed = mail.ok ? "1" : "0";
      if (!mail.ok) {
        console.error("bank transfer email failed", mail.error);
      }
    } catch (err) {
      console.error("bank transfer email failed", err);
    }

    redirect(
      `/confirmation/${result.booking.id}?invoice=1&emailed=${emailed}`,
    );
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("payWithBankTransferAction", error);
    return fail(toErrorMessage(error, "Could not create bank transfer invoice"));
  }
}
