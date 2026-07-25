import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { renderTravelDocumentHtml } from "@/lib/documents/templates";
import { loadBookingDocumentData } from "@/lib/email/bookingMail";

export async function GET(
  _request: Request,
  context: { params: Promise<{ bookingRef: string }> },
) {
  try {
    const { bookingRef } = await context.params;
    const booking = await prisma.booking.findUnique({
      where: { bookingRef: decodeURIComponent(bookingRef) },
      select: { id: true },
    });
    if (!booking) {
      return new NextResponse("Travel document not found", { status: 404 });
    }

    const data = await loadBookingDocumentData(booking.id);
    if (!data) {
      return new NextResponse("Travel document not found", { status: 404 });
    }

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
