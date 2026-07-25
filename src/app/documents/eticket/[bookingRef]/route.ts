import { NextResponse } from "next/server";
import { canAccessBooking } from "@/lib/documentAccess";
import { prisma } from "@/lib/db";
import { renderTravelDocumentHtml } from "@/lib/documents/templates";
import { loadBookingDocumentData } from "@/lib/email/bookingMail";

export async function GET(
  request: Request,
  context: { params: Promise<{ bookingRef: string }> },
) {
  try {
    const { bookingRef } = await context.params;
    const token = new URL(request.url).searchParams.get("t");
    const booking = await prisma.booking.findUnique({
      where: { bookingRef: decodeURIComponent(bookingRef) },
      select: {
        id: true,
        accessToken: true,
        quote: { select: { sessionId: true } },
      },
    });
    if (!booking) {
      return new NextResponse("Travel document not found", { status: 404 });
    }

    const allowed = await canAccessBooking({
      accessToken: booking.accessToken,
      quoteSessionId: booking.quote?.sessionId,
      providedToken: token,
    });
    if (!allowed) {
      return new NextResponse(
        "Unauthorized — open this document from your confirmation email or booking page.",
        { status: 401 },
      );
    }

    const data = await loadBookingDocumentData(booking.id);
    if (!data) {
      return new NextResponse("Travel document not found", { status: 404 });
    }

    // Unpaid bookings still get a reservation letter — boarding passes are omitted in the renderer.
    return new NextResponse(renderTravelDocumentHtml(data), {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("eticket document failed", error);
    return new NextResponse("Could not render travel document", {
      status: 500,
    });
  }
}
