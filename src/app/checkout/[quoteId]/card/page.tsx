import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CardCheckoutForm } from "@/components/checkout/CardCheckoutForm";
import {
  CheckoutShell,
  QuoteBlockedMessage,
  QuoteSummaryCard,
} from "@/components/checkout/CheckoutShell";
import { getCheckoutQuoteState } from "@/lib/checkout/loadQuote";
import { passengerDraftFromQuote } from "@/lib/checkout/passengerDraft";
import { getSquarePublicConfig } from "@/lib/payments/square";

export default async function CardCheckoutPage({
  params,
}: {
  params: Promise<{ quoteId: string }>;
}) {
  const { quoteId } = await params;
  const state = await getCheckoutQuoteState(quoteId);
  if (!state) notFound();

  const draft = passengerDraftFromQuote(state.quote);
  if (state.available && !draft.complete) {
    redirect(`/checkout/${quoteId}/passengers`);
  }

  const square = getSquarePublicConfig();
  if (!square.configured) {
    redirect(`/checkout/${quoteId}`);
  }

  return (
    <CheckoutShell
      backHref={`/checkout/${quoteId}`}
      backLabel="Back to payment options"
    >
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
        <div className="order-2 lg:order-1">
          <QuoteSummaryCard state={state} title="Pay by card" />
        </div>
        <div className="order-1 min-w-0 rounded-2xl border border-line bg-white/70 p-5 backdrop-blur-sm sm:rounded-none sm:p-8 lg:order-2">
          {!state.available ? (
            <QuoteBlockedMessage state={state} />
          ) : (
            <CardCheckoutForm
              quoteId={quoteId}
              maxSeats={state.maxSeats}
              unitPriceCents={state.quote.quotedPriceCents}
              initialPassenger={draft}
              square={{
                applicationId: square.applicationId,
                locationId: square.locationId,
                environment: square.environment,
              }}
            />
          )}
          {state.available && (
            <p className="mt-6 text-center text-sm text-muted">
              <Link href={`/checkout/${quoteId}/bank`} className="underline">
                Switch to bank transfer
              </Link>
            </p>
          )}
        </div>
      </div>
    </CheckoutShell>
  );
}
