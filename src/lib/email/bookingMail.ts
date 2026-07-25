import { prisma } from "@/lib/db";
import type { BookingDocumentData } from "@/lib/documents/templates";
import {
  renderETicketHtml,
  renderTaxInvoiceHtml,
} from "@/lib/documents/templates";
import {
  bankTransferEmail,
  bookingConfirmationEmail,
} from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/send";

export async function loadBookingDocumentData(
  bookingId: string,
): Promise<BookingDocumentData | null> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      flight: true,
      returnFlight: true,
      invoice: true,
    },
  });
  if (!booking) return null;

  return {
    bookingRef: booking.bookingRef,
    ticketNumber: booking.ticketNumber,
    createdAt: booking.createdAt,
    status: booking.status,
    passengerName: booking.passengerName,
    email: booking.email,
    passengerPhone: booking.passengerPhone,
    passportNumber: booking.passportNumber,
    nationality: booking.nationality,
    seatsBooked: booking.seatsBooked,
    fareReleaseName: booking.fareReleaseName,
    paymentMethod: booking.paymentMethod,
    amountPaidCents: booking.amountPaidCents,
    serviceFeeCents: booking.serviceFeeCents,
    tripType: booking.tripType,
    squarePaymentId: booking.invoice?.squarePaymentId,
    flight: booking.flight,
    returnFlight: booking.returnFlight,
    invoice: booking.invoice
      ? {
          invoiceNumber: booking.invoice.invoiceNumber,
          amountCents: booking.invoice.amountCents,
          fareCents: booking.invoice.fareCents,
          serviceFeeCents: booking.invoice.serviceFeeCents,
          status: booking.invoice.status,
          dueAt: booking.invoice.dueAt,
          createdAt: booking.invoice.createdAt,
          bankAccountName: booking.invoice.bankAccountName,
          bankBsb: booking.invoice.bankBsb,
          bankAccountNumber: booking.invoice.bankAccountNumber,
          bankReference: booking.invoice.bankReference,
          customerPhone: booking.invoice.customerPhone,
          squarePaymentId: booking.invoice.squarePaymentId,
        }
      : null,
  };
}

export async function sendBookingConfirmationBundle(bookingId: string) {
  const data = await loadBookingDocumentData(bookingId);
  if (!data) return { ok: false as const, error: "Booking not found" };
  if (data.status !== "confirmed") {
    return {
      ok: false as const,
      error: "Booking is not confirmed yet — pay first, then send confirmation",
    };
  }

  const email = bookingConfirmationEmail(data);
  const eticket = renderETicketHtml(data);
  const invoiceHtml = data.invoice ? renderTaxInvoiceHtml(data) : null;

  const result = await sendEmail({
    to: data.email,
    subject: email.subject,
    html: email.html,
    text: email.text,
    attachments: [
      {
        filename: `E-Ticket-${data.bookingRef}.html`,
        content: eticket,
        contentType: "text/html",
      },
      ...(invoiceHtml
        ? [
            {
              filename: `Tax-Invoice-${data.invoice!.invoiceNumber}.html`,
              content: invoiceHtml,
              contentType: "text/html",
            },
          ]
        : []),
    ],
  });

  if (result.ok && data.invoice) {
    await prisma.invoice.update({
      where: { invoiceNumber: data.invoice.invoiceNumber },
      data: { sentAt: new Date() },
    });
  }

  return result;
}

export async function sendBankTransferBundle(bookingId: string) {
  const data = await loadBookingDocumentData(bookingId);
  if (!data) return { ok: false as const, error: "Booking not found" };
  if (!data.invoice) {
    return { ok: false as const, error: "Invoice not found" };
  }

  const email = bankTransferEmail(data);
  const invoiceHtml = renderTaxInvoiceHtml(data);

  const result = await sendEmail({
    to: data.email,
    subject: email.subject,
    html: email.html,
    text: email.text,
    attachments: [
      {
        filename: `Tax-Invoice-${data.invoice.invoiceNumber}.html`,
        content: invoiceHtml,
        contentType: "text/html",
      },
    ],
  });

  if (result.ok) {
    await prisma.invoice.update({
      where: { invoiceNumber: data.invoice.invoiceNumber },
      data: { sentAt: new Date() },
    });
  }

  return result;
}

/** Sends the right template for the booking/invoice state. */
export async function sendInvoiceEmailForBooking(bookingId: string) {
  const data = await loadBookingDocumentData(bookingId);
  if (!data) return { ok: false as const, error: "Booking not found" };

  if (data.status === "confirmed") {
    return sendBookingConfirmationBundle(bookingId);
  }
  if (data.paymentMethod === "bank_transfer") {
    return sendBankTransferBundle(bookingId);
  }
  return {
    ok: false as const,
    error: "No matching email template for this booking state",
  };
}
