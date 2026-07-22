import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BankCheckoutForm } from "@/components/checkout/BankCheckoutForm";
import {
  CheckoutShell,
  QuoteBlockedMessage,
  QuoteSummaryCard,
} from "@/components/checkout/CheckoutShell";
import { getCheckoutQuoteState } from "@/lib/checkout/loadQuote";
import {
  getBankTransferDetails,
  isBankTransferConfigured,
} from "@/lib/payments/bank";

export default async function BankCheckoutPage({
  params,
}: {
  params: Promise<{ quoteId: string }>;
}) {
  const { quoteId } = await params;
  const state = await getCheckoutQuoteState(quoteId);
  if (!state) notFound();

  if (!isBankTransferConfigured()) {
    redirect(`/checkout/${quoteId}`);
  }

  const bank = getBankTransferDetails();
  if (!bank) {
    redirect(`/checkout/${quoteId}`);
  }

  return (
    <CheckoutShell
      backHref={`/checkout/${quoteId}`}
      backLabel="Back to payment options"
    >
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <QuoteSummaryCard state={state} title="Bank transfer" />
        <div className="border border-line bg-white/70 p-6 backdrop-blur-sm sm:p-8">
          {!state.available ? (
            <QuoteBlockedMessage state={state} />
          ) : (
            <BankCheckoutForm
              quoteId={quoteId}
              maxSeats={state.maxSeats}
              unitPriceCents={state.quote.quotedPriceCents}
              bankPreview={bank}
            />
          )}
          {state.available && (
            <p className="mt-6 text-center text-sm text-muted">
              <Link href={`/checkout/${quoteId}/card`} className="underline">
                Switch to card payment
              </Link>
            </p>
          )}
        </div>
      </div>
    </CheckoutShell>
  );
}
