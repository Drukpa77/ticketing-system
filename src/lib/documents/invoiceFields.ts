import { getBrand } from "@/lib/branding";

const CITY: Record<string, string> = {
  PBH: "Paro",
  PER: "Perth",
  SYD: "Sydney",
  MEL: "Melbourne",
  BNE: "Brisbane",
  SIN: "Singapore",
};

export function cityName(code: string) {
  return CITY[code.toUpperCase()] ?? code.toUpperCase();
}

export function buildRouteLabel(input: {
  origin: string;
  destination: string;
  tripType: "one_way" | "round_trip" | string;
}) {
  const from = cityName(input.origin);
  const to = cityName(input.destination);
  if (input.tripType === "round_trip") {
    return `${from}-${to}-${from}`;
  }
  return `${from}-${to}`;
}

export function invoiceLineSubtotal(lines: {
  airfareCents: number;
  airportTaxesCents: number;
  extraBaggageCents: number;
  travelInsuranceCents: number;
  otherChargesCents: number;
}) {
  return (
    lines.airfareCents +
    lines.airportTaxesCents +
    lines.extraBaggageCents +
    lines.travelInsuranceCents +
    lines.otherChargesCents
  );
}

/** GST portion of a GST-inclusive amount (bps, e.g. 1000 = 10%). */
export function gstIncludedPortion(amountCents: number, gstRateBps: number) {
  if (amountCents <= 0 || gstRateBps <= 0) return 0;
  return Math.round((amountCents * gstRateBps) / (10_000 + gstRateBps));
}

export function gstExclusiveAmount(amountCents: number, gstRateBps: number) {
  if (amountCents <= 0 || gstRateBps <= 0) return 0;
  return Math.round((amountCents * gstRateBps) / 10_000);
}

export function computeInvoiceTotals(input: {
  airfareCents: number;
  airportTaxesCents: number;
  extraBaggageCents: number;
  travelInsuranceCents: number;
  otherChargesCents: number;
  serviceFeeCents?: number;
  gstRateBps?: number;
  gstIncluded?: boolean;
}) {
  const lines = invoiceLineSubtotal(input);
  const serviceFeeCents = input.serviceFeeCents ?? 0;
  const gstRateBps = input.gstRateBps ?? 1000;
  const gstIncluded = input.gstIncluded ?? true;

  const gstCents = gstIncluded
    ? gstIncludedPortion(lines, gstRateBps)
    : gstExclusiveAmount(lines, gstRateBps);

  const subtotalCents = gstIncluded ? lines - gstCents : lines;
  const amountCents = gstIncluded
    ? lines + serviceFeeCents
    : lines + gstCents + serviceFeeCents;

  return {
    linesCents: lines,
    subtotalCents,
    gstCents,
    serviceFeeCents,
    amountCents,
    gstRateBps,
    gstIncluded,
  };
}

export function defaultInvoiceIdentity() {
  const brand = getBrand();
  return {
    accountNumber: brand.invoiceAccountNumber,
    businessTpn: brand.invoiceBusinessTpn,
  };
}

export function displayTicketCode(ticketNumber: string) {
  const cleaned = ticketNumber.replace(/^ET-/i, "").replace(/\D/g, "");
  if (cleaned.length >= 5) return `LBG${cleaned.slice(-5)}`;
  return ticketNumber;
}

export function defaultFareCalculationLine(input: {
  origin: string;
  destination: string;
  tripType: string;
  fareCents: number;
}) {
  const route =
    input.tripType === "round_trip"
      ? `${input.origin}${input.destination}${input.origin}`
      : `${input.origin}${input.destination}`;
  const aud = (input.fareCents / 100).toFixed(2);
  return `${route} ${aud}AUD END`;
}

export function defaultEndorsementText() {
  return "NON-TRANSFERABLE / SUBJECT TO FARE RULES";
}

export function defaultBaggageLabel(cabinClass: string, fareProductName?: string) {
  if (cabinClass === "business") return "2 PIECES (32kg each)";
  if (fareProductName?.toLowerCase().includes("flexi")) return "2 PIECES (23kg each)";
  if (fareProductName?.toLowerCase().includes("full")) return "2 PIECES (23kg each)";
  return "1 PIECE (23kg)";
}
