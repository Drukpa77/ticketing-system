import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { renderAirfareInvoiceHtml } from "@/lib/documents/templates";
import { loadBookingDocumentData } from "@/lib/email/bookingMail";

export async function GET(
  _request: Request,
  context: { params: Promise<{ invoiceNumber: string }> },
) {
  try {
    const { invoiceNumber } = await context.params;
    const invoice = await prisma.invoice.findUnique({
      where: { invoiceNumber: decodeURIComponent(invoiceNumber) },
      select: { bookingId: true },
    });
    if (!invoice) {
      return new NextResponse("Airfare invoice not found", { status: 404 });
    }

    const data = await loadBookingDocumentData(invoice.bookingId);
    if (!data?.invoice) {
      return new NextResponse("Airfare invoice not found", { status: 404 });
    }

    return new NextResponse(renderAirfareInvoiceHtml(data), {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("airfare invoice document failed", error);
    return new NextResponse("Could not render airfare invoice", {
      status: 500,
    });
  }
}
