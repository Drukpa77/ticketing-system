"use server";

import { redirect } from "next/navigation";
import { createPriceQuote } from "@/lib/booking/confirmBooking";
import { getSessionId } from "@/lib/session";

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
