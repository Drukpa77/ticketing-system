import { NextResponse } from "next/server";

/** Compat redirect → travel document (e-ticket / itinerary / receipt). */
export async function GET(
  _request: Request,
  context: { params: Promise<{ bookingRef: string }> },
) {
  const { bookingRef } = await context.params;
  return NextResponse.redirect(
    new URL(
      `/documents/eticket/${encodeURIComponent(decodeURIComponent(bookingRef))}`,
      _request.url,
    ),
    308,
  );
}
