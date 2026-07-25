import { NextResponse } from "next/server";

/** Compat redirect → travel document (e-ticket / itinerary / receipt). */
export async function GET(
  request: Request,
  context: { params: Promise<{ bookingRef: string }> },
) {
  const { bookingRef } = await context.params;
  const token = new URL(request.url).searchParams.get("t");
  const path = `/documents/eticket/${encodeURIComponent(decodeURIComponent(bookingRef))}${
    token ? `?t=${encodeURIComponent(token)}` : ""
  }`;
  return NextResponse.redirect(new URL(path, request.url), 308);
}
