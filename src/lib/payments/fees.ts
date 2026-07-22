/** Square online rate passed through to the customer as a labelled service fee. */
export const CARD_SERVICE_FEE_RATE = 0.022;

export function calculateCardServiceFee(fareCents: number) {
  const safeFare = Math.max(0, Math.round(fareCents));
  const serviceFeeCents = Math.round(safeFare * CARD_SERVICE_FEE_RATE);
  return {
    fareCents: safeFare,
    serviceFeeCents,
    totalCents: safeFare + serviceFeeCents,
    ratePercent: 2.2,
    rateLabel: "2.2%",
  };
}
