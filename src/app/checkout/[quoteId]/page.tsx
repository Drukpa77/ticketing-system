import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckoutShell,
  QuoteBlockedMessage,
  QuoteSummaryCard,
} from "@/components/checkout/CheckoutShell";
import { getCheckoutQuoteState } from "@/lib/checkout/loadQuote";
import { isBankTransferConfigured } from "@/lib/payments/bank";
import { getSquarePublicConfig } from "@/lib/payments/square";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ quoteId: string }>;
}) {
  const { quoteId } = await params;
  const state = await getCheckoutQuoteState(quoteId);
  if (!state) notFound();

  const square = getSquarePublicConfig();
  const bankConfigured = isBankTransferConfigured();

  return (
    <CheckoutShell backHref="/" backLabel="Back to search">
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <QuoteSummaryCard state={state} title="Checkout" />

        <div className="border border-line bg-white/70 p-6 backdrop-blur-sm sm:p-8">
          {!state.available ? (
            <QuoteBlockedMessage state={state} />
          ) : (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                  Step 1
                </p>
                <h2 className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-semibold tracking-tight">
                  Choose how to pay
                </h2>
                <p className="mt-2 text-sm text-muted">
                  Card charges instantly. Bank transfer creates an unpaid
                  invoice for you to settle.
                </p>
              </div>

              <div className="grid gap-3">
                {square.configured ? (
                  <Link
                    href={`/checkout/${quoteId}/card`}
                    className="border border-line bg-surface/70 px-5 py-5 transition hover:border-accent hover:bg-accent/10"
                  >
                    <p className="font-[family-name:var(--font-syne)] text-lg font-semibold">
                      Pay by card
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Secure Square checkout · invoice marked paid automatically
                    </p>
                  </Link>
                ) : (
                  <div className="border border-line bg-surface/40 px-5 py-5 opacity-60">
                    <p className="font-semibold">Pay by card</p>
                    <p className="mt-1 text-sm text-muted">
                      Square is not configured yet
                    </p>
                  </div>
                )}

                {bankConfigured ? (
                  <Link
                    href={`/checkout/${quoteId}/bank`}
                    className="border border-line bg-surface/70 px-5 py-5 transition hover:border-accent hover:bg-accent/10"
                  >
                    <p className="font-[family-name:var(--font-syne)] text-lg font-semibold">
                      Bank transfer
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Get an invoice with BSB, account, and payment reference
                    </p>
                  </Link>
                ) : (
                  <div className="border border-line bg-surface/40 px-5 py-5 opacity-60">
                    <p className="font-semibold">Bank transfer</p>
                    <p className="mt-1 text-sm text-muted">
                      Bank details are not configured yet
                    </p>
                  </div>
                )}
              </div>

              {!square.configured && !bankConfigured && (
                <p className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  No payment methods are available. Ask admin to configure Square
                  or bank details.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </CheckoutShell>
  );
}
