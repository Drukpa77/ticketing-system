import { formatAud } from "@/lib/pricing";
import {
  formatDocDate,
  formatDocDateTime,
  formatDocTime,
  getBrand,
} from "@/lib/branding";
import {
  cityName,
  computeInvoiceTotals,
  defaultBaggageLabel,
  displayTicketCode,
} from "@/lib/documents/invoiceFields";

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
  fareProductName?: string;
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
    airfareCents: number;
    airportTaxesCents: number;
    extraBaggageCents: number;
    travelInsuranceCents: number;
    otherChargesCents: number;
    gstRateBps: number;
    gstIncluded: boolean;
    accountNumber: string;
    businessTpn: string;
    routeLabel: string;
    seatLabel: string;
    nameRef: string;
    endorsementText: string;
    fareCalculationLine: string;
    status: string;
    dueAt: Date | null;
    createdAt: Date;
    bankAccountName: string | null;
    bankBsb: string | null;
    bankAccountNumber: string | null;
    bankReference: string | null;
    customerPhone?: string | null;
    squarePaymentId?: string | null;
    notes?: string | null;
  } | null;
};

function esc(value: string | number | null | undefined) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function paymentMethodLabel(method: string | null) {
  if (method === "card") return "Credit Card";
  if (method === "bank_transfer") return "Bank Transfer";
  if (method === "cash") return "Cash";
  return "—";
}

function cabinLabel(cabin: string) {
  return cabin.replaceAll("_", " ").toUpperCase();
}

function sharedStyles() {
  return `
    * { box-sizing: border-box; }
    body { font-family: "Segoe UI", Arial, sans-serif; color: #12241c; background: #eef3f0; margin: 0; padding: 20px; }
    .sheet { max-width: 820px; margin: 0 auto 28px; background: #fff; border: 1px solid #c5d5cc; padding: 28px 32px; }
    .topbar { display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; font-size: 12px; color: #4d6359; border-bottom: 2px solid #0f3d2e; padding-bottom: 12px; margin-bottom: 18px; }
    .topbar strong { color: #0f3d2e; }
    h1 { font-size: 18px; letter-spacing: 0.06em; margin: 0 0 6px; text-transform: uppercase; color: #0f3d2e; }
    h2 { font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; color: #1a6b4a; margin: 22px 0 10px; border-bottom: 1px solid #c5d5cc; padding-bottom: 6px; }
    h3 { font-size: 13px; margin: 0 0 8px; color: #0f3d2e; }
    .muted { color: #4d6359; font-size: 12px; line-height: 1.45; }
    .tagline { font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: #1a6b4a; margin: 0 0 16px; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 20px; }
    .row { display: flex; justify-content: space-between; gap: 12px; margin: 5px 0; font-size: 13px; }
    .label { color: #4d6359; }
    .pill { display: inline-block; padding: 3px 8px; background: #e9f0ec; color: #0f3d2e; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; }
    .flight-card { border: 1px solid #c5d5cc; padding: 14px; margin: 10px 0; background: #f7faf8; }
    .route-big { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; margin-bottom: 10px; }
    .city { font-size: 22px; font-weight: 700; color: #0f3d2e; line-height: 1.1; }
    .city small { display: block; font-size: 11px; font-weight: 500; color: #4d6359; letter-spacing: 0.08em; text-transform: uppercase; }
    .arrow { font-size: 18px; color: #1a6b4a; padding-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { border-bottom: 1px solid #d7e3dc; padding: 8px 6px; text-align: left; }
    th { color: #4d6359; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; }
    td.num, th.num { text-align: right; }
    .total { font-size: 16px; font-weight: 700; margin-top: 10px; }
    .notice { margin-top: 10px; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #8a3b12; font-weight: 700; }
    .cols3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .box { border: 1px solid #c5d5cc; padding: 10px; min-height: 80px; }
    .box ul { margin: 0; padding-left: 16px; font-size: 11px; line-height: 1.45; }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; margin: 8px 0; }
    .chip { border: 1px solid #0f3d2e; padding: 6px 10px; font-size: 12px; }
    .chip.active { background: #0f3d2e; color: #fff; }
    ul.terms { padding-left: 18px; font-size: 12px; line-height: 1.5; }
    @media print {
      body { background: #fff; padding: 0; }
      .sheet { border: none; margin: 0; page-break-after: always; }
      .sheet:last-child { page-break-after: auto; }
    }
    @media (max-width: 640px) {
      .grid2, .cols3 { grid-template-columns: 1fr; }
      .route-big { flex-direction: column; align-items: flex-start; }
    }
  `;
}

function contactTopbar() {
  const brand = getBrand();
  return `
    <div class="topbar">
      <div>
        <strong>${esc(brand.issuingAgent)}</strong><br />
        ${esc(brand.agentEmail)}
      </div>
      <div>
        ${esc(brand.agentPhonePrimary)} | ${esc(brand.agentPhoneSecondary)}<br />
        ${esc(brand.agentWebsite)}
      </div>
      <div>
        Date: <strong>${esc(formatDocDate(new Date()))}</strong>
      </div>
    </div>
  `;
}

function itineraryCard(
  flight: BookingDocumentData["flight"],
  opts: {
    ticketCode: string;
    seat: string;
    fareName: string;
  },
) {
  return `
    <div class="flight-card">
      <div class="route-big">
        <div class="city">${esc(flight.origin)}<small>${esc(cityName(flight.origin))}<br />${esc(
          flight.origin.toUpperCase() === "PBH" ? "Bhutan" : flight.origin.toUpperCase() === "PER" ? "Australia" : "",
        )}</small></div>
        <div class="arrow">→</div>
        <div class="city" style="text-align:right">${esc(flight.destination)}<small>${esc(
          cityName(flight.destination),
        )}<br />${esc(
          flight.destination.toUpperCase() === "PBH"
            ? "Bhutan"
            : flight.destination.toUpperCase() === "PER"
              ? "Australia"
              : "",
        )}</small></div>
      </div>
      <div class="grid2">
        <div class="row"><span class="label">Flight No</span><span>${esc(flight.flightNumber)}</span></div>
        <div class="row"><span class="label">Ticket No</span><span>${esc(opts.ticketCode)}</span></div>
        <div class="row"><span class="label">Date</span><span>${esc(formatDocDate(flight.departureAt))}</span></div>
        <div class="row"><span class="label">Class</span><span>${esc(cabinLabel(flight.cabinClass))}${
          opts.fareName ? ` · ${esc(opts.fareName)}` : ""
        }</span></div>
        <div class="row"><span class="label">Departure</span><span>${esc(formatDocTime(flight.departureAt))}</span></div>
        <div class="row"><span class="label">Arrival</span><span>${esc(formatDocTime(flight.arrivalAt))}</span></div>
        <div class="row"><span class="label">Seat</span><span>${esc(opts.seat)}</span></div>
        <div class="row"><span class="label">Airline</span><span>${esc(flight.airline || getBrand().issuingAirline)}</span></div>
      </div>
      <p class="notice">This is not a boarding pass</p>
    </div>
  `;
}

export function renderTravelDocumentHtml(data: BookingDocumentData) {
  const brand = getBrand();
  const invoice = data.invoice;
  const ticketCode = displayTicketCode(data.ticketNumber);
  const seat = invoice?.seatLabel?.trim() || "Auto assigned";
  const nameRef = invoice?.nameRef?.trim() || data.bookingRef.slice(-7);
  const fareName = data.fareProductName || data.fareReleaseName || "";
  const baggage = defaultBaggageLabel(data.flight.cabinClass, fareName);
  const unpaid = data.status !== "confirmed" && invoice?.status !== "paid";

  const lines = {
    airfareCents: invoice?.airfareCents ?? invoice?.fareCents ?? 0,
    airportTaxesCents: invoice?.airportTaxesCents ?? 0,
    extraBaggageCents: invoice?.extraBaggageCents ?? 0,
    travelInsuranceCents: invoice?.travelInsuranceCents ?? 0,
    otherChargesCents: invoice?.otherChargesCents ?? 0,
  };
  const serviceFee =
    data.serviceFeeCents || invoice?.serviceFeeCents || 0;
  const totals = computeInvoiceTotals({
    ...lines,
    serviceFeeCents: serviceFee,
    gstRateBps: invoice?.gstRateBps ?? 1000,
    gstIncluded: invoice?.gstIncluded ?? true,
  });
  const totalCents = invoice?.amountCents || data.amountPaidCents || totals.amountCents;
  const fop = paymentMethodLabel(data.paymentMethod);
  const endorsement =
    invoice?.endorsementText?.trim() ||
    "NON-TRANSFERABLE / SUBJECT TO FARE RULES";
  const fareCalc =
    invoice?.fareCalculationLine?.trim() ||
    `${data.flight.origin}${data.flight.destination} ${(totals.linesCents / 100).toFixed(2)}AUD END`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>E-Ticket ${esc(data.bookingRef)}</title>
  <style>${sharedStyles()}</style>
</head>
<body>
  <div class="sheet">
    ${contactTopbar()}
    <p class="muted" style="margin:0 0 8px">Dear Valued Customer,</p>
    <p class="muted">
      Thank you for choosing ${esc(brand.issuingAgent)}. Your booking is
      ${unpaid ? "reserved pending payment" : "confirmed"}. Please review passenger name,
      flight route, travel date, booking reference, and passport details carefully.
    </p>
    <h1>Chartered Flight<br />E-Ticket, Itinerary, Receipts and Tax Invoice</h1>
    <p class="tagline">Chartered Flight · Paro ⇄ Perth · ${esc(brand.charterTagline)}</p>
    <p><span class="pill">${unpaid ? "Pending Payment" : "Confirmed"}</span></p>

    <h2>Itinerary</h2>
    ${itineraryCard(data.flight, { ticketCode, seat, fareName })}
    ${
      data.returnFlight
        ? itineraryCard(data.returnFlight, { ticketCode, seat, fareName })
        : ""
    }

    <h2>Guest Information</h2>
    <div class="grid2">
      <div class="row"><span class="label">Ticket Number</span><span>${esc(ticketCode)}</span></div>
      <div class="row"><span class="label">Reservation Number</span><span>${esc(data.bookingRef)}</span></div>
      <div class="row"><span class="label">Guest Name</span><span>${esc(data.passengerName)}</span></div>
      <div class="row"><span class="label">Name REF</span><span>${esc(nameRef)}</span></div>
      <div class="row"><span class="label">Issue Date</span><span>${esc(formatDocDate(data.createdAt))}</span></div>
      <div class="row"><span class="label">Issuing Airline</span><span>${esc(brand.issuingAirline)}</span></div>
      <div class="row"><span class="label">Issuing Agent</span><span>${esc(brand.issuingAgent)}</span></div>
      <div class="row"><span class="label">Included Baggage</span><span>${esc(baggage)}</span></div>
      <div class="row"><span class="label">Passport</span><span>${esc(data.passportNumber || "—")}</span></div>
      <div class="row"><span class="label">Email / Phone</span><span>${esc(data.email)} · ${esc(data.passengerPhone || "—")}</span></div>
    </div>

    <h2>Terms &amp; Conditions</h2>
    <ul class="terms">
      <li>This e-ticket is non-transferable and valid only for the named passenger.</li>
      <li>Please arrive at the airport at least ${esc(String(brand.arriveHoursBefore))} hours before departure.</li>
      <li>Check-in closes 60 minutes prior to departure.</li>
      <li>Baggage allowance as per the purchased fare.</li>
      <li>Changes or cancellations are subject to the fare rules.</li>
      <li>${esc(brand.issuingAgent)} reserves the right to make operational changes due to unforeseen circumstances.</li>
      <li>For assistance, contact ${esc(brand.issuingAgent)} · ${esc(brand.agentEmail)}</li>
    </ul>

    <h2>Baggage Allowance</h2>
    <div class="grid2">
      <div class="box">
        <h3>Economy Class</h3>
        <p class="muted">Check-In Baggage · Max 2 Pieces · 23 KG</p>
        <p class="muted">Cabin Baggage · ${esc(brand.carryOnKg)}</p>
      </div>
      <div class="box">
        <h3>Business Class</h3>
        <p class="muted">Check-In Baggage · Max 2 Pieces · 32 KG</p>
        <p class="muted">Cabin Baggage · ${esc(brand.carryOnKg)}</p>
      </div>
    </div>

    <h2>Receipt and Tax Invoice Details</h2>
    <div class="row"><span class="label">Fare</span><span>${esc(formatAud(lines.airfareCents || totals.linesCents))}</span></div>
    <div class="row"><span class="label">Taxes/Fees/Carrier-Imposed Charges</span><span>${esc(formatAud(lines.airportTaxesCents))}</span></div>
    <div class="row"><span class="label">Fare Calculation Line</span><span>${esc(fareCalc)}</span></div>
    <div class="row"><span class="label">Endorsement / Restrictions</span><span>${esc(endorsement)}</span></div>
    <div class="row"><span class="label">Form of Payment</span><span>${esc(fop)}</span></div>
    <div class="row"><span class="label">Total / Transaction Currency</span><span>${esc(formatAud(totalCents))} AUD</span></div>

    <h2>Other Charges</h2>
    <div class="row"><span class="label">Preferred Seat</span><span>${esc(formatAud(0))}</span></div>
    <div class="row"><span class="label">Extra Baggage / Insurance / Other</span><span>${esc(
      formatAud(
        lines.extraBaggageCents +
          lines.travelInsuranceCents +
          lines.otherChargesCents,
      ),
    )}</span></div>
    <div class="row"><span class="label">Payment Surcharge</span><span>${esc(formatAud(serviceFee))}</span></div>
    <div class="total">Total Fare and Other Charges: ${esc(formatAud(totalCents))}</div>
    <p class="muted">GST ${totals.gstIncluded ? "included" : "added"} in this transaction${
      totals.gstCents > 0 ? ` · GST component ${esc(formatAud(totals.gstCents))}` : ""
    }.</p>
    ${
      invoice
        ? `<p class="muted">Invoice ${esc(invoice.invoiceNumber)} · Issued ${esc(formatDocDate(invoice.createdAt))}</p>`
        : ""
    }
  </div>

  <div class="sheet">
    <h1>Travel Checklist</h1>
    <div class="cols3">
      <div class="box">
        <h3>1. Check-in Documents</h3>
        <ul>
          <li>Passport</li>
          <li>Boarding Pass</li>
          <li>Visa Approval Letter</li>
          <li>Student COE</li>
          <li>Employment Documents</li>
          <li>Invitation Letter (If Visiting)</li>
          <li>Travel Insurance</li>
          <li>Hotel Booking / Accommodation</li>
          <li>Return Ticket (If Applicable)</li>
          <li>Financial Documents</li>
          <li>Flight E-Ticket</li>
          <li>Address in Australia</li>
          <li>Australian Customs Declaration</li>
        </ul>
      </div>
      <div class="box">
        <h3>2. Cabin Baggage</h3>
        <ul>
          <li>Passport / Wallet</li>
          <li>Mobile Phone</li>
          <li>Laptop / Tablet</li>
          <li>Chargers &amp; Power Bank</li>
          <li>Medication &amp; Prescription</li>
          <li>Glasses / Contact Lenses</li>
          <li>Important Documents</li>
          <li>Pen / Valuables</li>
          <li>Toiletries (Within Limit)</li>
        </ul>
      </div>
      <div class="box">
        <h3>3. Checked Baggage</h3>
        <ul>
          <li>Clothing</li>
          <li>Gifts (Declare if required)</li>
          <li>Electronics packed safely</li>
          <li>Remove old baggage tags</li>
          <li>Attach name tag / Lock luggage</li>
          <li>Liquids sealed properly</li>
          <li>Batteries removed if required</li>
          <li>Weight within allowance</li>
          <li>Fragile items declared</li>
        </ul>
      </div>
    </div>

    <h2>4. Dangerous Goods</h2>
    <div class="grid2">
      <div class="box">
        <h3>Not allowed in checked baggage</h3>
        <ul>
          <li>Spare Lithium Batteries</li>
          <li>E-Cigarettes / Vapes</li>
          <li>Loose Batteries</li>
          <li>Smart bags without removable batteries</li>
          <li>Power Banks</li>
        </ul>
      </div>
      <div class="box">
        <h3>Not allowed at all</h3>
        <ul>
          <li>Fuel / Gas Canisters</li>
          <li>Weapons / Ammunition / Explosives</li>
          <li>Flammable Liquids</li>
          <li>Sharp Objects</li>
          <li>Poison / Toxic Substances</li>
          <li>Fireworks</li>
        </ul>
      </div>
    </div>

    <h2>5. Australian Border Force &amp; Biosecurity</h2>
    <p class="muted">Always declare if you are carrying food, meat or dairy, fruits &amp; vegetables, seeds/plants/flowers, wooden items, animal products, medicines, herbs/traditional medicines, equipment with soil, or religious offerings containing seeds/plants. Declare even if unsure — failure to declare may result in heavy fines, visa cancellation or prosecution.</p>

    <h2>6. Money</h2>
    <p class="muted">Cash or monetary instruments over AUD 10,000 must be declared.</p>

    <h2>7. On Arrival in Perth</h2>
    <p class="muted">Immigration → Baggage Claim → Biosecurity Screening → Customs → Exit to Arrival Hall</p>

    <p class="muted" style="margin-top:24px">
      Kind regards,<br />
      <strong>${esc(brand.issuingAgent)}</strong><br />
      ${esc(brand.reservationsTeam)}
    </p>
  </div>
</body>
</html>`;

  return html;
}

export function renderAirfareInvoiceHtml(data: BookingDocumentData) {
  const brand = getBrand();
  const invoice = data.invoice;
  if (!invoice) {
    throw new Error("Invoice missing for airfare invoice document");
  }

  const lines = {
    airfareCents: invoice.airfareCents || invoice.fareCents || 0,
    airportTaxesCents: invoice.airportTaxesCents || 0,
    extraBaggageCents: invoice.extraBaggageCents || 0,
    travelInsuranceCents: invoice.travelInsuranceCents || 0,
    otherChargesCents: invoice.otherChargesCents || 0,
  };
  const totals = computeInvoiceTotals({
    ...lines,
    serviceFeeCents: invoice.serviceFeeCents || 0,
    gstRateBps: invoice.gstRateBps,
    gstIncluded: invoice.gstIncluded,
  });
  const unpaid = invoice.status === "unpaid";
  const bankName =
    process.env.BANK_NAME?.trim() || `${brand.issuingAgent}`;
  const routeLabel =
    invoice.routeLabel ||
    `${cityName(data.flight.origin)}-${cityName(data.flight.destination)}`;
  const routeOptions = [
    "Paro-Perth",
    "Perth-Paro",
    "Perth-Paro-Perth",
    "Paro-Perth-Paro",
  ];

  const lineRows: Array<[string, number]> = [
    ["Airfare", lines.airfareCents],
    ["Airport Taxes", lines.airportTaxesCents],
    ["Extra Baggage", lines.extraBaggageCents],
    ["Travel Insurance", lines.travelInsuranceCents],
    ["Other Charges", lines.otherChargesCents],
  ];
  if (invoice.serviceFeeCents > 0) {
    lineRows.push(["Payment Surcharge", invoice.serviceFeeCents]);
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Invoice ${esc(invoice.invoiceNumber)}</title>
  <style>${sharedStyles()}</style>
</head>
<body>
  <div class="sheet">
    ${contactTopbar()}
    <h1>Invoice</h1>
    <p class="tagline">${esc(brand.issuingAgent)} · Airfare Invoice</p>

    <div class="grid2">
      <div>
        <h2 style="margin-top:0">Invoice To</h2>
        <div class="row"><span class="label">Name</span><span>${esc(data.passengerName)}</span></div>
        <div class="row"><span class="label">Passport No</span><span>${esc(data.passportNumber || "—")}</span></div>
        <div class="row"><span class="label">Email</span><span>${esc(data.email)}</span></div>
        <div class="row"><span class="label">Phone</span><span>${esc(data.passengerPhone || invoice.customerPhone || "—")}</span></div>
      </div>
      <div>
        <h2 style="margin-top:0">Invoice Details</h2>
        <div class="row"><span class="label">Invoice Date</span><span>${esc(formatDocDate(invoice.createdAt))}</span></div>
        ${
          invoice.dueAt
            ? `<div class="row"><span class="label">Invoice Due Date</span><span>${esc(formatDocDate(invoice.dueAt))}</span></div>`
            : ""
        }
        <div class="row"><span class="label">Invoice Number</span><strong>${esc(invoice.invoiceNumber)}</strong></div>
        <div class="row"><span class="label">Account Number</span><span>${esc(invoice.accountNumber || brand.invoiceAccountNumber)}</span></div>
        <div class="row"><span class="label">Business TPN Number</span><span>${esc(invoice.businessTpn || brand.invoiceBusinessTpn)}</span></div>
        <div class="row"><span class="label">Status</span><span class="pill">${unpaid ? "Unpaid" : "Paid"}</span></div>
      </div>
    </div>

    <h2>Line Items</h2>
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th class="num">Qty</th>
          <th class="num">Unit Price</th>
          <th class="num">Total</th>
        </tr>
      </thead>
      <tbody>
        ${lineRows
          .map(
            ([name, cents]) => `
          <tr>
            <td>${esc(name)}</td>
            <td class="num">${cents > 0 ? data.seatsBooked : 0}</td>
            <td class="num">${esc(
              formatAud(
                cents > 0 && data.seatsBooked > 0
                  ? Math.round(cents / data.seatsBooked)
                  : 0,
              ),
            )}</td>
            <td class="num">${esc(formatAud(cents))}</td>
          </tr>`,
          )
          .join("")}
      </tbody>
    </table>

    <div style="max-width:320px;margin-left:auto;margin-top:14px">
      <div class="row"><span class="label">Subtotal</span><span>${esc(formatAud(totals.linesCents))}</span></div>
      <div class="row"><span class="label">Tax ${esc(((invoice.gstRateBps || 1000) / 100).toFixed(0))}%</span><span>${esc(formatAud(totals.gstCents))}</span></div>
      ${
        invoice.serviceFeeCents > 0
          ? `<div class="row"><span class="label">Payment Surcharge</span><span>${esc(formatAud(invoice.serviceFeeCents))}</span></div>`
          : ""
      }
      <div class="total">${unpaid ? "Total Due" : "Total Paid"}: ${esc(formatAud(invoice.amountCents))}</div>
      <p class="muted">${totals.gstIncluded ? "GST included in this transaction." : "GST added to this transaction."}</p>
    </div>

    <h2>Flight Details</h2>
    <div class="chips">
      ${routeOptions
        .map((r) => {
          const active =
            routeLabel.replaceAll(" ", "").toLowerCase() ===
            r.replaceAll(" ", "").toLowerCase();
          return `<span class="chip${active ? " active" : ""}">${esc(r)}</span>`;
        })
        .join("")}
      ${
        !routeOptions.some(
          (r) =>
            r.replaceAll(" ", "").toLowerCase() ===
            routeLabel.replaceAll(" ", "").toLowerCase(),
        )
          ? `<span class="chip active">${esc(routeLabel)}</span>`
          : ""
      }
    </div>
    <div class="row"><span class="label">Route</span><span>${esc(routeLabel)}</span></div>
    <div class="row"><span class="label">Travel Date</span><span>${esc(formatDocDateTime(data.flight.departureAt))}</span></div>
    <div class="row"><span class="label">Booking Reference</span><strong>${esc(data.bookingRef)}</strong></div>
    <div class="row"><span class="label">Flight</span><span>${esc(data.flight.airline || brand.issuingAirline)} ${esc(data.flight.flightNumber)} · ${esc(data.flight.origin)} → ${esc(data.flight.destination)}</span></div>
    ${
      data.returnFlight
        ? `<div class="row"><span class="label">Return</span><span>${esc(data.returnFlight.flightNumber)} · ${esc(data.returnFlight.origin)} → ${esc(data.returnFlight.destination)} · ${esc(formatDocDateTime(data.returnFlight.departureAt))}</span></div>`
        : ""
    }

    <h2>Payment Information</h2>
    ${
      unpaid
        ? `
    <div class="row"><span class="label">Account Name</span><span>${esc(invoice.bankAccountName || "—")}</span></div>
    <div class="row"><span class="label">Bank</span><span>${esc(bankName)}</span></div>
    <div class="row"><span class="label">BSB</span><span>${esc(invoice.bankBsb || "—")}</span></div>
    <div class="row"><span class="label">Account no.</span><span>${esc(invoice.bankAccountNumber || "—")}</span></div>
    <div class="row"><span class="label">Reference</span><strong>${esc(invoice.bankReference || invoice.invoiceNumber)} / ${esc(data.passengerName)}</strong></div>
    <p class="muted">Please use Invoice Number / Passenger Name as the payment reference. Seats are held until the due date.</p>`
        : `
    <div class="row"><span class="label">Form of Payment</span><span>${esc(paymentMethodLabel(data.paymentMethod))}</span></div>
    <div class="row"><span class="label">Transaction ID</span><span>${esc(invoice.squarePaymentId || data.bookingRef)}</span></div>`
    }
    ${
      invoice.notes
        ? `<p class="muted" style="margin-top:16px">${esc(invoice.notes)}</p>`
        : ""
    }
  </div>
</body>
</html>`;

  return html;
}

/** @deprecated alias — travel document combo */
export function renderETicketHtml(data: BookingDocumentData) {
  return renderTravelDocumentHtml(data);
}

/** @deprecated alias — airfare invoice */
export function renderTaxInvoiceHtml(data: BookingDocumentData) {
  return renderAirfareInvoiceHtml(data);
}
