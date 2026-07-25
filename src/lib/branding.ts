export function getBrand() {
  return {
    airlineName:
      process.env.BRAND_AIRLINE_NAME?.trim() ||
      "Drukair – Royal Bhutan Airlines",
    shortName: process.env.BRAND_SHORT_NAME?.trim() || "Drukair",
    bookingPrefix: process.env.BRAND_BOOKING_PREFIX?.trim() || "DRK",
    reservationsTeam:
      process.env.BRAND_RESERVATIONS_TEAM?.trim() || "Reservations Team",
    supportEmail:
      process.env.BRAND_SUPPORT_EMAIL?.trim() ||
      "reservations@drukair.com.bt",
    siteUrl:
      process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      process.env.SITE_URL?.trim() ||
      "http://localhost:3000",
    carryOnKg: process.env.BRAND_CARRY_ON_KG?.trim() || "7kg",
    checkedKg: process.env.BRAND_CHECKED_KG?.trim() || "30kg",
    arriveHoursBefore: Number(process.env.BRAND_ARRIVE_HOURS || "3"),
  };
}

export function formatDocDate(date: Date) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Australia/Sydney",
  }).format(date);
}

export function formatDocDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Australia/Sydney",
  }).format(date);
}

export function makeBookingRef(prefix = getBrand().bookingPrefix) {
  const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `${prefix}-${stamp}-${rand}`;
}

export function makeTicketNumber() {
  const rand = Math.floor(Math.random() * 900000000 + 100000000);
  return `ET-${rand}`;
}

export function makeInvoiceNumber() {
  const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const rand = Math.floor(Math.random() * 90000 + 10000);
  return `INV-${stamp}-${rand}`;
}

/** Bank-transfer seat hold window (default 48 hours). */
export function bankHoldExpiresAt(from = new Date(), hours = 48) {
  return new Date(from.getTime() + hours * 60 * 60 * 1000);
}

/** @deprecated use bankHoldExpiresAt — kept for call sites expecting a due date */
export function invoiceDueDate(from = new Date(), _days = 2) {
  return bankHoldExpiresAt(from, 48);
}
