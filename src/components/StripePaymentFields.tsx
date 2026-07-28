"use client";

import { loadStripe, type Stripe as StripeJs } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useMemo, useRef, useState } from "react";

export type StripeBillingContact = {
  givenName?: string;
  familyName?: string;
  email?: string;
  phone?: string;
  addressLines?: string[];
  city?: string;
  state?: string;
  postalCode?: string;
  countryCode?: string;
};

type StripePaymentFieldsProps = {
  publishableKey: string;
  clientSecret: string;
  disabled?: boolean;
  buttonLabel: string;
  billingContact: StripeBillingContact;
  onSuccess: (paymentIntentId: string) => void | Promise<void>;
  onError: (message: string) => void;
};

// Cache the Stripe.js singleton per publishable key across remounts.
let stripePromiseCache: {
  key: string;
  promise: Promise<StripeJs | null>;
} | null = null;

function getStripePromise(publishableKey: string) {
  if (!stripePromiseCache || stripePromiseCache.key !== publishableKey) {
    stripePromiseCache = {
      key: publishableKey,
      promise: loadStripe(publishableKey),
    };
  }
  return stripePromiseCache.promise;
}

export function StripePaymentFields({
  publishableKey,
  clientSecret,
  disabled,
  buttonLabel,
  billingContact,
  onSuccess,
  onError,
}: StripePaymentFieldsProps) {
  const stripePromise = useMemo(
    () => getStripePromise(publishableKey),
    [publishableKey],
  );

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#2563EB",
            colorDanger: "#b91c1c",
            colorText: "#0F172A",
            colorTextPlaceholder: "#64748B",
            fontFamily: "inherit",
            fontSizeBase: "16px",
            borderRadius: "0px",
            spacingUnit: "4px",
          },
          rules: {
            ".Input": {
              border: "1px solid #E2E8F0",
              boxShadow: "none",
            },
            ".Input:focus": {
              border: "1px solid #2563EB",
              boxShadow: "none",
            },
          },
        },
      }}
    >
      <StripePaymentInner
        disabled={disabled}
        buttonLabel={buttonLabel}
        billingContact={billingContact}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}

function StripePaymentInner({
  disabled,
  buttonLabel,
  billingContact,
  onSuccess,
  onError,
}: Omit<StripePaymentFieldsProps, "publishableKey" | "clientSecret">) {
  const stripe = useStripe();
  const elements = useElements();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const billingRef = useRef(billingContact);
  billingRef.current = billingContact;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  async function handlePay() {
    if (!stripe || !elements || busy || disabled) return;
    setBusy(true);
    onErrorRef.current("");
    try {
      const billing = billingRef.current;
      const name =
        [billing.givenName, billing.familyName].filter(Boolean).join(" ") ||
        undefined;

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
        confirmParams: {
          payment_method_data: {
            billing_details: {
              name,
              email: billing.email || undefined,
              phone: billing.phone || undefined,
              address: {
                line1: billing.addressLines?.[0] || undefined,
                line2: billing.addressLines?.[1] || undefined,
                city: billing.city || undefined,
                state: billing.state || undefined,
                postal_code: billing.postalCode || undefined,
                country: billing.countryCode || "AU",
              },
            },
          },
        },
      });

      if (error) {
        onErrorRef.current(error.message ?? "Card details are invalid");
        return;
      }
      if (!paymentIntent || paymentIntent.status !== "succeeded") {
        onErrorRef.current(
          `Payment was not completed (status: ${paymentIntent?.status ?? "unknown"}).`,
        );
        return;
      }
      await onSuccess(paymentIntent.id);
    } catch (err) {
      onErrorRef.current(
        err instanceof Error ? err.message : "Payment failed",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-muted">
          Card details
        </p>
        <div className="min-h-[72px] border border-line bg-white px-3 py-3">
          <PaymentElement
            options={{ fields: { billingDetails: "never" } }}
            onReady={() => setReady(true)}
          />
        </div>
        <p className="mt-2 text-xs text-muted">
          Enter card number, expiry, and CVC. Your billing address above is
          used for verification.
        </p>
      </div>
      {!ready && (
        <p className="text-sm text-muted">Loading secure card fields…</p>
      )}
      <button
        type="button"
        onClick={() => void handlePay()}
        disabled={!stripe || !elements || !ready || busy || disabled}
        className="btn-cta w-full rounded-xl py-3.5 text-sm tracking-wide"
      >
        {busy ? "Processing…" : buttonLabel}
      </button>
    </div>
  );
}
