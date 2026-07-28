/**
 * Card processing surcharge passed through to the customer.
 * Update to match your actual Stripe rate — AU surcharging rules require this
 * to not exceed your real cost of acceptance.
 */
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
