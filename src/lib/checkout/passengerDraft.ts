/** Build booking-ready passenger fields from a quote draft. */
export function passengerDraftFromQuote(quote: {
  passengerTitle?: string | null;
  passengerFirstName?: string | null;
  passengerLastName?: string | null;
  passengerEmail?: string | null;
  passengerPhone?: string | null;
  passportNumber?: string | null;
  nationality?: string | null;
  seatsBooked?: number | null;
}) {
  const first = (quote.passengerFirstName ?? "").trim();
  const last = (quote.passengerLastName ?? "").trim();
  const title = (quote.passengerTitle ?? "").trim();
  const lastPart = last && last !== "—" ? last : "";
  const nameCore = [first, lastPart].filter(Boolean).join(" ");
  const passengerName = [title, nameCore].filter(Boolean).join(" ").trim();

  return {
    passengerName,
    email: (quote.passengerEmail ?? "").trim(),
    passengerPhone: (quote.passengerPhone ?? "").trim(),
    passportNumber: (quote.passportNumber ?? "").trim(),
    nationality: (quote.nationality ?? "").trim(),
    seatsBooked: Math.max(1, quote.seatsBooked || 1),
    complete: Boolean(first && quote.passengerEmail),
  };
}
