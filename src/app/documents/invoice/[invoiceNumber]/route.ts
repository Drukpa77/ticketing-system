import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { renderTaxInvoiceHtml } from "@/lib/documents/templates";
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
      return new NextResponse("Invoice not found", { status: 404 });
    }

    const data = await loadBookingDocumentData(invoice.bookingId);
    if (!data?.invoice) {
      return new NextResponse("Invoice not found", { status: 404 });
    }

    return new NextResponse(renderTaxInvoiceHtml(data), {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("invoice document failed", error);
    return new NextResponse("Could not render invoice", { status: 500 });
  }
}
