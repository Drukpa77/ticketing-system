import { formatAud } from "@/lib/pricing";
import {
  formatDocDate,
  formatDocDateTime,
  getBrand,
} from "@/lib/branding";
import { airportLabel } from "@/lib/format";

export type BookingDocumentData = {
  bookingRef: string;
  ticketNumber: string;
  createdAt: Date;
  status: string;
  passengerName: string;
  email: string;
  passengerPhone?: string | null;
  passportNumber?: string | null;
  nationality?: string | null;
  seatsBooked: number;
  fareReleaseName: string;
  paymentMethod: string | null;
  amountPaidCents: number;
  serviceFeeCents: number;
  tripType: string;
  squarePaymentId?: string | null;
  flight: {
    airline: string;
    flightNumber: string;
    origin: string;
    destination: string;
    departureAt: Date;
    arrivalAt: Date;
    cabinClass: string;
  };
  returnFlight?: {
    airline: string;
    flightNumber: string;
    origin: string;
    destination: string;
    departureAt: Date;
    arrivalAt: Date;
    cabinClass: string;
  } | null;
  invoice?: {
    invoiceNumber: string;
    amountCents: number;
    fareCents: number;
    serviceFeeCents: number;
    status: string;
    dueAt: Date | null;
    createdAt: Date;
    bankAccountName: string | null;
    bankBsb: string | null;
    bankAccountNumber: string | null;
    bankReference: string | null;
    customerPhone?: string | null;
    squarePaymentId?: string | null;
  } | null;
};

function shell(title: string, body: string) {
  const brand = getBrand();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    body { font-family: Georgia, "Times New Roman", serif; color: #10231c; background: #e9f0ec; margin: 0; padding: 24px; }
    .sheet { max-width: 760px; margin: 0 auto; background: #fff; border: 1px solid #c5d5cc; padding: 32px; }
    h1 { font-size: 22px; letter-spacing: 0.04em; margin: 0 0 8px; text-transform: uppercase; }
    h2 { font-size: 14px; letter-spacing: 0.14em; text-transform: uppercase; color: #1a6b4a; margin: 28px 0 10px; border-bottom: 1px solid #c5d5cc; padding-bottom: 6px; }
    .brand { color: #0f3d2e; font-weight: 700; margin-bottom: 4px; }
    .muted { color: #4d6359; font-size: 13px; }
    .row { display: flex; justify-content: space-between; gap: 16px; margin: 6px 0; font-size: 14px; }
    .label { color: #4d6359; }
    ul { padding-left: 18px; font-size: 14px; line-height: 1.55; }
    .total { font-size: 18px; font-weight: 700; margin-top: 12px; }
    .badge { display: inline-block; padding: 4px 10px; background: #e9f0ec; color: #0f3d2e; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; }
    @media print { body { background: #fff; padding: 0; } .sheet { border: none; } }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="brand">${brand.airlineName}</div>
    ${body}
    <p class="muted" style="margin-top:32px">${brand.reservationsTeam} · ${brand.supportEmail}</p>
  </div>
</body>
</html>`;
}

function flightBlock(
  title: string,
  flight: BookingDocumentData["flight"],
  fareName: string,
) {
  return `
    <h2>${title}</h2>
    <div class="row"><span class="label">Airline</span><span>${flight.airline || getBrand().airlineName}</span></div>
    <div class="row"><span class="label">Flight</span><span>${flight.flightNumber}</span></div>
    <div class="row"><span class="label">From</span><span>${airportLabel(flight.origin)} (${flight.origin})</span></div>
    <div class="row"><span class="label">To</span><span>${airportLabel(flight.destination)} (${flight.destination})</span></div>
    <div class="row"><span class="label">Departure</span><span>${formatDocDateTime(flight.departureAt)}</span></div>
    <div class="row"><span class="label">Arrival</span><span>${formatDocDateTime(flight.arrivalAt)}</span></div>
    <div class="row"><span class="label">Class</span><span>${flight.cabinClass.replaceAll("_", " ")} · ${fareName || "Standard"}</span></div>
    <div class="row"><span class="label">Seat</span><span>Assigned at check-in</span></div>
    <div class="row"><span class="label">Terminal / Gate</span><span>See airport screens on the day</span></div>
    <div class="row"><span class="label">Boarding</span><span>Arrive ${getBrand().arriveHoursBefore} hours before departure</span></div>
  `;
}

export function renderETicketHtml(data: BookingDocumentData) {
  const brand = getBrand();
  const fareCents =
    data.invoice?.fareCents && data.invoice.fareCents > 0
      ? data.invoice.fareCents
      : Math.max(0, data.amountPaidCents - (data.serviceFeeCents || 0));
  const serviceFee = data.serviceFeeCents || data.invoice?.serviceFeeCents || 0;
  const statusLabel =
    data.status === "confirmed"
      ? "Confirmed"
      : data.status === "pending_payment"
        ? "Pending Payment"
        : data.status;

  const body = `
    <h1>Electronic Flight Ticket (E-Ticket)</h1>
    <p><span class="badge">${statusLabel}</span></p>
    <div class="row"><span class="label">Booking Reference</span><strong>${data.bookingRef}</strong></div>
    <div class="row"><span class="label">Ticket Number</span><span>${data.ticketNumber}</span></div>
    <div class="row"><span class="label">Booking Date</span><span>${formatDocDate(data.createdAt)}</span></div>

    <h2>Passenger</h2>
    <div class="row"><span class="label">Name</span><span>${data.passengerName}</span></div>
    <div class="row"><span class="label">Email</span><span>${data.email}</span></div>
    <div class="row"><span class="label">Phone</span><span>${data.passengerPhone || "—"}</span></div>
    <div class="row"><span class="label">Passport</span><span>${data.passportNumber || "—"}</span></div>
    <div class="row"><span class="label">Nationality</span><span>${data.nationality || "—"}</span></div>
    <div class="row"><span class="label">Seats booked</span><span>${data.seatsBooked}</span></div>

    ${flightBlock("Flight", data.flight, data.fareReleaseName)}
    ${
      data.returnFlight
        ? flightBlock("Return Flight", data.returnFlight, data.fareReleaseName)
        : ""
    }

    <h2>Baggage</h2>
    <div class="row"><span class="label">Carry-on</span><span>${brand.carryOnKg}</span></div>
    <div class="row"><span class="label">Checked</span><span>${brand.checkedKg}</span></div>

    <h2>Fare</h2>
    <div class="row"><span class="label">${data.fareReleaseName || "Ticket"} Fare</span><span>${formatAud(fareCents)}</span></div>
    ${
      serviceFee > 0
        ? `<div class="row"><span class="label">Credit Card Fee (2.2%)</span><span>${formatAud(serviceFee)}</span></div>`
        : ""
    }
    <div class="total">Total Paid: ${formatAud(data.amountPaidCents)}</div>

    <h2>Payment</h2>
    <div class="row"><span class="label">Status</span><span>${data.status === "confirmed" ? "Paid" : "Pending Payment"}</span></div>
    <div class="row"><span class="label">Method</span><span>${
      data.paymentMethod === "card"
        ? "Card (Square)"
        : data.paymentMethod === "bank_transfer"
          ? "Bank Transfer"
          : "—"
    }</span></div>
    <div class="row"><span class="label">Transaction ID</span><span>${data.squarePaymentId || data.invoice?.squarePaymentId || data.bookingRef}</span></div>

    <h2>Important Information</h2>
    <ul>
      <li>Arrive ${brand.arriveHoursBefore} hours before departure.</li>
      <li>Carry a valid passport and required travel documents.</li>
      <li>Boarding closes 20 minutes before departure.</li>
      <li>Passport should be valid for at least 6 months.</li>
    </ul>
  `;

  return shell(`E-Ticket ${data.bookingRef}`, body);
}

export function renderTaxInvoiceHtml(data: BookingDocumentData) {
  const brand = getBrand();
  const invoice = data.invoice;
  if (!invoice) {
    throw new Error("Invoice missing for tax invoice document");
  }

  const fareCents =
    invoice.fareCents > 0
      ? invoice.fareCents
      : Math.max(0, invoice.amountCents - invoice.serviceFeeCents);
  const unpaid = invoice.status === "unpaid";
  const bankName =
    process.env.BANK_NAME?.trim() || brand.shortName + " Australia";

  const body = `
    <h1>Tax Invoice${unpaid ? " (Bank Transfer)" : " / Receipt"}</h1>
    <div class="row"><span class="label">Invoice Number</span><strong>${invoice.invoiceNumber}</strong></div>
    <div class="row"><span class="label">Invoice Date</span><span>${formatDocDate(invoice.createdAt)}</span></div>
    ${
      invoice.dueAt
        ? `<div class="row"><span class="label">Due Date</span><span>${formatDocDate(invoice.dueAt)}</span></div>`
        : ""
    }
    <div class="row"><span class="label">Booking Reference</span><span>${data.bookingRef}</span></div>
    <p><span class="badge">${unpaid ? "Pending Payment" : "Paid"}</span></p>

    <h2>Customer</h2>
    <div class="row"><span class="label">Name</span><span>${data.passengerName}</span></div>
    <div class="row"><span class="label">Email</span><span>${data.email}</span></div>
    <div class="row"><span class="label">Phone</span><span>${data.passengerPhone || invoice.customerPhone || "—"}</span></div>

    <h2>Flight</h2>
    <div class="row"><span class="label">Airline</span><span>${data.flight.airline || brand.airlineName}</span></div>
    <div class="row"><span class="label">Route</span><span>${data.flight.origin} → ${data.flight.destination}${
      data.returnFlight
        ? ` · Return ${data.returnFlight.origin} → ${data.returnFlight.destination}`
        : ""
    }</span></div>
    <div class="row"><span class="label">Departure</span><span>${formatDocDateTime(data.flight.departureAt)}</span></div>

    <h2>Charges</h2>
    <div class="row"><span class="label">${data.fareReleaseName || "Flight"} Ticket</span><span>${formatAud(fareCents)}</span></div>
    ${
      invoice.serviceFeeCents > 0
        ? `<div class="row"><span class="label">Credit Card Fee (2.2%)</span><span>${formatAud(invoice.serviceFeeCents)}</span></div>`
        : ""
    }
    <div class="total">${unpaid ? "TOTAL DUE" : "TOTAL PAID"}: ${formatAud(invoice.amountCents)}</div>

    ${
      unpaid
        ? `
    <h2>Bank Details</h2>
    <div class="row"><span class="label">Account Name</span><span>${invoice.bankAccountName || "—"}</span></div>
    <div class="row"><span class="label">Bank</span><span>${bankName}</span></div>
    <div class="row"><span class="label">BSB</span><span>${invoice.bankBsb || "—"}</span></div>
    <div class="row"><span class="label">Account Number</span><span>${invoice.bankAccountNumber || "—"}</span></div>
    <div class="row"><span class="label">Reference</span><strong>${invoice.bankReference || data.bookingRef}</strong></div>

    <h2>Payment Instructions</h2>
    <ul>
      <li>Use your Booking Reference as the payment reference.</li>
      <li>Booking remains Pending Payment until payment is verified.</li>
      <li>Seats are held for 48 hours. If payment is not confirmed by the due date, the hold is released and seats return to the ticket pool.</li>
    </ul>`
        : `
    <h2>Payment</h2>
    <div class="row"><span class="label">Method</span><span>${
      data.paymentMethod === "card" ? "Card (Square)" : "Bank Transfer"
    }</span></div>
    <div class="row"><span class="label">Transaction ID</span><span>${invoice.squarePaymentId || data.bookingRef}</span></div>`
    }
  `;

  return shell(`Invoice ${invoice.invoiceNumber}`, body);
}
