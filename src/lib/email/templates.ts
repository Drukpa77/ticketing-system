import { formatAud } from "@/lib/pricing";
import {
  formatDocDateTime,
  getBrand,
} from "@/lib/branding";
import type { BookingDocumentData } from "@/lib/documents/templates";

export function bookingConfirmationEmail(data: BookingDocumentData) {
  const brand = getBrand();
  const subject = `Your ${brand.shortName} Flight Booking is Confirmed – ${data.bookingRef}`;
  const route = `${data.flight.origin} → ${data.flight.destination}${
    data.returnFlight
      ? ` · Return ${data.returnFlight.origin} → ${data.returnFlight.destination}`
      : ""
  }`;
  const ticketUrl = `${brand.siteUrl}/documents/ticket/${data.bookingRef}`;
  const invoiceUrl = data.invoice
    ? `${brand.siteUrl}/documents/invoice/${data.invoice.invoiceNumber}`
    : brand.siteUrl;

  const html = `
  <div style="font-family:Georgia,serif;color:#10231c;line-height:1.55;max-width:640px">
    <p style="color:#1a6b4a;letter-spacing:0.12em;text-transform:uppercase;font-size:12px">${brand.airlineName}</p>
    <h1 style="font-size:24px;margin:8px 0 16px">Booking confirmed</h1>
    <p>Dear ${data.passengerName},</p>
    <p>Thank you for booking your flight with <strong>${brand.airlineName}</strong>.</p>
    <p>We are pleased to confirm that your payment has been received and your booking is now confirmed.</p>
    <h2 style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#1a6b4a;border-bottom:1px solid #c5d5cc;padding-bottom:6px">Booking Summary</h2>
    <p><strong>Booking Reference:</strong> ${data.bookingRef}<br/>
    <strong>Route:</strong> ${route}<br/>
    <strong>Departure:</strong> ${formatDocDateTime(data.flight.departureAt)}<br/>
    <strong>Total Paid:</strong> ${formatAud(data.amountPaidCents)}</p>
    <p><strong>Attached / available online:</strong></p>
    <ul>
      <li><a href="${ticketUrl}">Electronic Ticket (E-Ticket)</a></li>
      <li><a href="${invoiceUrl}">Tax Invoice / Receipt</a></li>
    </ul>
    <p>Please review your travel details carefully. We recommend arriving at the airport at least ${brand.arriveHoursBefore} hours before departure.</p>
    <p>Thank you for choosing ${brand.airlineName}.</p>
    <p>Kind regards,<br/>${brand.reservationsTeam}<br/>${brand.airlineName}</p>
  </div>`;

  const text = `Dear ${data.passengerName},

Thank you for booking your flight with ${brand.airlineName}.
Your payment has been received and your booking is confirmed.

Booking Reference: ${data.bookingRef}
Route: ${route}
Departure: ${formatDocDateTime(data.flight.departureAt)}
Total Paid: ${formatAud(data.amountPaidCents)}

E-Ticket: ${ticketUrl}
Tax Invoice: ${invoiceUrl}

Kind regards,
${brand.reservationsTeam}
${brand.airlineName}`;

  return { subject, html, text, ticketUrl, invoiceUrl };
}

export function bankTransferEmail(data: BookingDocumentData) {
  const brand = getBrand();
  const subject = `Payment Required – ${brand.shortName} Booking ${data.bookingRef}`;
  const route = `${data.flight.origin} → ${data.flight.destination}`;
  const amount = data.invoice?.amountCents ?? data.amountPaidCents;
  const reference = data.invoice?.bankReference || data.bookingRef;
  const invoiceUrl = data.invoice
    ? `${brand.siteUrl}/documents/invoice/${data.invoice.invoiceNumber}`
    : brand.siteUrl;
  const due = data.invoice?.dueAt
    ? formatDocDateTime(data.invoice.dueAt)
    : "the due date on your invoice";

  const html = `
  <div style="font-family:Georgia,serif;color:#10231c;line-height:1.55;max-width:640px">
    <p style="color:#1a6b4a;letter-spacing:0.12em;text-transform:uppercase;font-size:12px">${brand.airlineName}</p>
    <h1 style="font-size:24px;margin:8px 0 16px">Payment required</h1>
    <p>Dear ${data.passengerName},</p>
    <p>Thank you for choosing <strong>${brand.airlineName}</strong>.</p>
    <p>Your booking has been created and is currently <strong>Pending Payment</strong>.</p>
    <p>As you selected Bank Transfer, your invoice containing our bank account details and payment instructions is attached / available online.</p>
    <h2 style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#1a6b4a;border-bottom:1px solid #c5d5cc;padding-bottom:6px">Booking Summary</h2>
    <p><strong>Booking Reference:</strong> ${data.bookingRef}<br/>
    <strong>Route:</strong> ${route}<br/>
    <strong>Departure:</strong> ${formatDocDateTime(data.flight.departureAt)}<br/>
    <strong>Amount Due:</strong> ${formatAud(amount)}</p>
    <p>Please transfer the total amount using the reference:<br/><strong>${reference}</strong></p>
    <p><a href="${invoiceUrl}">View Tax Invoice &amp; bank details</a></p>
    <p>Your seats are held for <strong>48 hours</strong>. Once payment has been received and verified, we will email your booking confirmation and electronic ticket.</p>
    <p>If payment is not confirmed before ${due}, the hold will be released, seats return to the ticket pool, and you will need to book again.</p>
    <p>Kind regards,<br/>${brand.reservationsTeam}<br/>${brand.airlineName}</p>
  </div>`;

  const text = `Dear ${data.passengerName},

Your ${brand.shortName} booking ${data.bookingRef} is Pending Payment.

Route: ${route}
Departure: ${formatDocDateTime(data.flight.departureAt)}
Amount Due: ${formatAud(amount)}
Payment reference: ${reference}

Invoice: ${invoiceUrl}

Kind regards,
${brand.reservationsTeam}
${brand.airlineName}`;

  return { subject, html, text, invoiceUrl };
}
