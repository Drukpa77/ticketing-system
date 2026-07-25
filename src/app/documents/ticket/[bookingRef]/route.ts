import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { renderETicketHtml } from "@/lib/documents/templates";
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
      return new NextResponse("E-Ticket not found", { status: 404 });
    }

    const data = await loadBookingDocumentData(booking.id);
    if (!data) {
      return new NextResponse("E-Ticket not found", { status: 404 });
    }

    return new NextResponse(renderETicketHtml(data), {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("ticket document failed", error);
    return new NextResponse("Could not render e-ticket", { status: 500 });
  }
}
