import { prisma } from "@/lib/db";
import type { BookingDocumentData } from "@/lib/documents/templates";
import {
  renderAirfareInvoiceHtml,
  renderTravelDocumentHtml,
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
    accessToken: booking.accessToken,
    createdAt: booking.createdAt,
    status: booking.status,
    passengerName: booking.passengerName,
    email: booking.email,
    passengerPhone: booking.passengerPhone,
    passportNumber: booking.passportNumber,
    nationality: booking.nationality,
    seatsBooked: booking.seatsBooked,
    fareReleaseName: booking.fareReleaseName,
    fareProductName: booking.fareProductName,
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
          airfareCents: booking.invoice.airfareCents,
          airportTaxesCents: booking.invoice.airportTaxesCents,
          extraBaggageCents: booking.invoice.extraBaggageCents,
          travelInsuranceCents: booking.invoice.travelInsuranceCents,
          otherChargesCents: booking.invoice.otherChargesCents,
          gstRateBps: booking.invoice.gstRateBps,
          gstIncluded: booking.invoice.gstIncluded,
          accountNumber: booking.invoice.accountNumber,
          businessTpn: booking.invoice.businessTpn,
          routeLabel: booking.invoice.routeLabel,
          seatLabel: booking.invoice.seatLabel,
          nameRef: booking.invoice.nameRef,
          endorsementText: booking.invoice.endorsementText,
          fareCalculationLine: booking.invoice.fareCalculationLine,
          status: booking.invoice.status,
          dueAt: booking.invoice.dueAt,
          createdAt: booking.invoice.createdAt,
          bankAccountName: booking.invoice.bankAccountName,
          bankBsb: booking.invoice.bankBsb,
          bankAccountNumber: booking.invoice.bankAccountNumber,
          bankReference: booking.invoice.bankReference,
          customerPhone: booking.invoice.customerPhone,
          squarePaymentId: booking.invoice.squarePaymentId,
          notes: booking.invoice.notes,
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
  const travelDoc = renderTravelDocumentHtml(data);
  const airfareHtml = data.invoice ? renderAirfareInvoiceHtml(data) : null;

  const result = await sendEmail({
    to: data.email,
    subject: email.subject,
    html: email.html,
    text: email.text,
    attachments: [
      {
        filename: `E-Ticket-Itinerary-${data.bookingRef}.html`,
        content: travelDoc,
        contentType: "text/html",
      },
      ...(airfareHtml
        ? [
            {
              filename: `Airfare-Invoice-${data.invoice!.invoiceNumber}.html`,
              content: airfareHtml,
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
  const airfareHtml = renderAirfareInvoiceHtml(data);

  // Invoice only until payment is confirmed — do not attach boarding passes.
  const result = await sendEmail({
    to: data.email,
    subject: email.subject,
    html: email.html,
    text: email.text,
    attachments: [
      {
        filename: `Airfare-Invoice-${data.invoice.invoiceNumber}.html`,
        content: airfareHtml,
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
