"use server";

import { redirect } from "next/navigation";
import { createPriceQuote, confirmBooking } from "@/lib/booking/confirmBooking";
import { getSessionId } from "@/lib/session";
import { bookingSchema } from "@/lib/validation";

export async function startCheckoutAction(
  flightId: string,
  returnFlightId?: string,
) {
  const sessionId = await getSessionId();
  const result = await createPriceQuote({
    flightId,
    returnFlightId,
    sessionId,
  });
  if (!result.ok) {
    return { error: result.error };
  }
  redirect(`/checkout/${result.quote.id}`);
}

export async function confirmBookingAction(
  _prev: { error?: string } | null,
  formData: FormData,
) {
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
  const result = await confirmBooking({
    ...parsed.data,
    sessionId,
  });

  if (!result.ok) {
    return { error: result.error };
  }

  redirect(`/confirmation/${result.booking.id}`);
}
