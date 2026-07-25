"use server";

import { revalidatePath } from "next/cache";
import { sendBankTransferBundle } from "@/lib/email/bookingMail";
import { prisma } from "@/lib/db";
import { getSessionId } from "@/lib/session";

/** Customer self-serve: email unpaid bank-transfer invoice to the booking email. */
export async function emailMyBankInvoiceAction(
  bookingId: string,
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  const sessionId = await getSessionId();
  if (!bookingId || sessionId === "anonymous") {
    return { ok: false, error: "Please try again from this browser session." };
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { quote: true, invoice: true },
  });

  if (!booking?.quote || booking.quote.sessionId !== sessionId) {
    return { ok: false, error: "Booking not found for this session." };
  }
  if (booking.paymentMethod !== "bank_transfer" || !booking.invoice) {
    return { ok: false, error: "No bank-transfer invoice is available." };
  }

  const result = await sendBankTransferBundle(booking.id);
  if (!result.ok) {
    if ("skipped" in result && result.skipped) {
      return {
        ok: false,
        error:
          "Email is not configured yet on the server. You can still view and download the invoice on this page.",
      };
    }
    return { ok: false, error: result.error || "Could not send invoice email." };
  }

  revalidatePath(`/confirmation/${booking.id}`);
  return {
    ok: true,
    message: `Invoice sent to ${booking.email}. Check your inbox (and spam folder).`,
  };
}
