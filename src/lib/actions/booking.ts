"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
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

export async function startCheckoutFormAction(formData: FormData) {
  try {
    const flightId = String(formData.get("flightId") ?? "").trim();
    const returnRaw = String(formData.get("returnFlightId") ?? "").trim();
    const returnFlightId = returnRaw || undefined;

    if (!flightId) {
      redirect("/?error=Missing+flight");
    }

    const sessionId = await getSessionId();
    const result = await createPriceQuote({
      flightId,
      returnFlightId,
      sessionId,
    });

    if (!result.ok) {
      redirect(
        `/flights/${flightId}?error=${encodeURIComponent(result.error)}`,
      );
    }

    redirect(`/checkout/${result.quote.id}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("startCheckoutFormAction", error);
    const flightId = String(formData.get("flightId") ?? "").trim();
    redirect(
      flightId
        ? `/flights/${flightId}?error=${encodeURIComponent("Could not start checkout")}`
        : "/?error=Could+not+start+checkout",
    );
  }
}
