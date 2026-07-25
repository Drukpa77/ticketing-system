import { formatAud } from "@/lib/pricing";
import {
  formatDocDateTime,
  getBrand,
} from "@/lib/branding";
import { withAccessToken } from "@/lib/documentAccess";
import type { BookingDocumentData } from "@/lib/documents/templates";

function esc(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function bookingConfirmationEmail(data: BookingDocumentData) {
  const brand = getBrand();
  const subject = `Your ${brand.issuingAgent} Flight Booking is Confirmed – ${data.bookingRef}`;
  const route = `${data.flight.origin} → ${data.flight.destination}${
    data.returnFlight
      ? ` · Return ${data.returnFlight.origin} → ${data.returnFlight.destination}`
      : ""
  }`;
  const travelUrl = withAccessToken(
    `${brand.siteUrl}/documents/eticket/${encodeURIComponent(data.bookingRef)}`,
    data.accessToken,
  );
  const invoiceUrl = data.invoice
    ? withAccessToken(
        `${brand.siteUrl}/documents/invoice/${encodeURIComponent(data.invoice.invoiceNumber)}`,
        data.accessToken,
      )
    : brand.siteUrl;

  const html = `
  <div style="font-family:Georgia,serif;color:#0F172A;line-height:1.55;max-width:640px">
    <p style="margin:0 0 12px">
      <img src="${esc(brand.logoUrl)}" alt="${esc(brand.shortName)}" width="56" height="56" style="display:block;width:56px;height:56px;object-fit:contain" />
    </p>
    <p style="color:#2563EB;letter-spacing:0.12em;text-transform:uppercase;font-size:12px">${esc(brand.issuingAgent)}</p>
    <h1 style="font-size:24px;margin:8px 0 16px">Booking confirmed</h1>
    <p>Dear ${esc(data.passengerName)},</p>
    <p>Thank you for choosing <strong>${esc(brand.issuingAgent)}</strong>.</p>
    <p>We have successfully received your payment, and your booking is now confirmed. Your e-ticket is attached to this email.</p>
    <h2 style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#2563EB;border-bottom:1px solid #E2E8F0;padding-bottom:6px">Booking Summary</h2>
    <p><strong>Booking Reference:</strong> ${esc(data.bookingRef)}<br/>
    <strong>Route:</strong> ${esc(route)}<br/>
    <strong>Departure:</strong> ${esc(formatDocDateTime(data.flight.departureAt))}<br/>
    <strong>Total Paid:</strong> ${esc(formatAud(data.amountPaidCents))}</p>
    <p><strong>Attached / available online:</strong></p>
    <ul>
      <li><a href="${travelUrl}">E-Ticket, Itinerary, Receipts &amp; Tax Invoice</a></li>
      <li><a href="${invoiceUrl}">Airfare Invoice</a></li>
    </ul>
    <p>Please review passenger name, flight route, travel date, booking reference, and passport details carefully. Arrive at the airport at least ${brand.arriveHoursBefore} hours before departure.</p>
    <p>Kind regards,<br/>${esc(brand.reservationsTeam)}<br/>${esc(brand.issuingAgent)}</p>
  </div>`;

  const text = `Dear ${data.passengerName},

Thank you for choosing ${brand.issuingAgent}.
Your payment has been received and your booking is confirmed.

Booking Reference: ${data.bookingRef}
Route: ${route}
Departure: ${formatDocDateTime(data.flight.departureAt)}
Total Paid: ${formatAud(data.amountPaidCents)}

Travel document: ${travelUrl}
Airfare invoice: ${invoiceUrl}

Kind regards,
${brand.reservationsTeam}
${brand.issuingAgent}`;

  return { subject, html, text, ticketUrl: travelUrl, invoiceUrl };
}

export function bankTransferEmail(data: BookingDocumentData) {
  const brand = getBrand();
  const subject = `Payment Required – ${brand.issuingAgent} Booking ${data.bookingRef}`;
  const route = `${data.flight.origin} → ${data.flight.destination}`;
  const amount = data.invoice?.amountCents ?? data.amountPaidCents;
  const reference = data.invoice?.bankReference || data.bookingRef;
  const invoiceUrl = data.invoice
    ? withAccessToken(
        `${brand.siteUrl}/documents/invoice/${encodeURIComponent(data.invoice.invoiceNumber)}`,
        data.accessToken,
      )
    : brand.siteUrl;
  const due = data.invoice?.dueAt
    ? formatDocDateTime(data.invoice.dueAt)
    : "the due date on your invoice";

  const html = `
  <div style="font-family:Georgia,serif;color:#0F172A;line-height:1.55;max-width:640px">
    <p style="margin:0 0 12px">
      <img src="${esc(brand.logoUrl)}" alt="${esc(brand.shortName)}" width="56" height="56" style="display:block;width:56px;height:56px;object-fit:contain" />
    </p>
    <p style="color:#2563EB;letter-spacing:0.12em;text-transform:uppercase;font-size:12px">${esc(brand.issuingAgent)}</p>
    <h1 style="font-size:24px;margin:8px 0 16px">Payment required</h1>
    <p>Dear ${esc(data.passengerName)},</p>
    <p>Thank you for choosing <strong>${esc(brand.issuingAgent)}</strong>.</p>
    <p>Your booking has been created and is currently <strong>Pending Payment</strong>.</p>
    <p>As you selected Bank Transfer, your airfare invoice containing our bank account details and payment instructions is attached / available online.</p>
    <h2 style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#2563EB;border-bottom:1px solid #E2E8F0;padding-bottom:6px">Booking Summary</h2>
    <p><strong>Booking Reference:</strong> ${esc(data.bookingRef)}<br/>
    <strong>Route:</strong> ${esc(route)}<br/>
    <strong>Departure:</strong> ${esc(formatDocDateTime(data.flight.departureAt))}<br/>
    <strong>Amount Due:</strong> ${esc(formatAud(amount))}</p>
    <p>Please transfer the total amount using the reference:<br/><strong>${esc(reference)}</strong></p>
    <p><a href="${invoiceUrl}">View Airfare Invoice &amp; bank details</a></p>
    <h2 style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#2563EB;border-bottom:1px solid #E2E8F0;padding-bottom:6px;margin-top:24px">Transaction instructions</h2>
    <p>No online payment was taken. After you complete the bank transfer, email a <strong>screenshot of the payment</strong> to <a href="mailto:${esc(brand.paymentProofEmail)}"><strong>${esc(brand.paymentProofEmail)}</strong></a> so we can confirm your booking and send your e-ticket.</p>
    <p>Your seats are held for <strong>48 hours</strong>. Once payment has been received and verified, we will email your booking confirmation and electronic ticket.</p>
    <p>If payment is not confirmed before ${esc(due)}, the hold will be released, seats return to the ticket pool, and you will need to book again.</p>
    <p>Kind regards,<br/>${esc(brand.reservationsTeam)}<br/>${esc(brand.issuingAgent)}</p>
  </div>`;

  const text = `Dear ${data.passengerName},

Your ${brand.issuingAgent} booking ${data.bookingRef} is Pending Payment.

Route: ${route}
Departure: ${formatDocDateTime(data.flight.departureAt)}
Amount Due: ${formatAud(amount)}
Payment reference: ${reference}

After transferring, email a payment screenshot to ${brand.paymentProofEmail} so we can confirm your booking.

Airfare invoice: ${invoiceUrl}

Kind regards,
${brand.reservationsTeam}
${brand.issuingAgent}`;

  return { subject, html, text, invoiceUrl };
}
