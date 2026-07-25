"use client";

import { useEffect, useId, useRef, useState } from "react";
import Script from "next/script";

export type SquareBillingContact = {
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

type SquareCardFieldsProps = {
  applicationId: string;
  locationId: string;
  environment: "sandbox" | "production";
  disabled?: boolean;
  buttonLabel: string;
  /** AUD cents — used for SCA / verification during tokenize */
  amountCents: number;
  billingContact: SquareBillingContact;
  onToken: (token: string) => void | Promise<void>;
  onError: (message: string) => void;
};

type SquareCardInstance = {
  attach: (selector: string) => Promise<void>;
  destroy: () => Promise<void>;
  configure?: (options: Record<string, unknown>) => Promise<void>;
  tokenize: (verificationDetails?: Record<string, unknown>) => Promise<{
    status: string;
    token?: string;
    errors?: { message?: string }[];
  }>;
};

type SquarePayments = {
  setLocale?: (locale: string) => Promise<void> | void;
  card: (options?: Record<string, unknown>) => Promise<SquareCardInstance>;
};

declare global {
  interface Window {
    Square?: {
      payments: (appId: string, locationId: string) => SquarePayments;
    };
  }
}

/** Square rejects multi-font stacks and custom web fonts — keep styles minimal. */
const cardStyle = {
  ".input-container": {
    borderColor: "#E2E8F0",
    borderRadius: "0px",
  },
  ".input-container.is-focus": {
    borderColor: "#2563EB",
  },
  ".input-container.is-error": {
    borderColor: "#b91c1c",
  },
  input: {
    fontSize: "16px",
    color: "#0F172A",
  },
  "input::placeholder": {
    color: "#64748B",
  },
  ".message-text": {
    color: "#64748B",
  },
};

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { givenName: "", familyName: "" };
  if (parts.length === 1) return { givenName: parts[0], familyName: "" };
  return {
    givenName: parts[0],
    familyName: parts.slice(1).join(" "),
  };
}

export function SquareCardFields({
  applicationId,
  locationId,
  environment,
  disabled,
  buttonLabel,
  amountCents,
  billingContact,
  onToken,
  onError,
}: SquareCardFieldsProps) {
  const [scriptReady, setScriptReady] = useState(false);
  const [cardReady, setCardReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const cardRef = useRef<SquareCardInstance | null>(null);
  const billingRef = useRef(billingContact);
  const amountRef = useRef(amountCents);
  const reactId = useId().replace(/:/g, "");
  const containerId = `square-card-${reactId}`;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  billingRef.current = billingContact;
  amountRef.current = amountCents;

  const scriptSrc =
    environment === "production"
      ? "https://web.squarecdn.com/v1/square.js"
      : "https://sandbox.web.squarecdn.com/v1/square.js";

  useEffect(() => {
    if (!scriptReady || !applicationId || !locationId) return;
    let cancelled = false;

    async function attachCard() {
      setLoadError(null);
      setCardReady(false);

      try {
        if (!window.Square?.payments) {
          throw new Error("Square.js failed to load");
        }

        const payments = window.Square.payments(applicationId, locationId);
        try {
          await payments.setLocale?.("en-AU");
        } catch {
          /* locale is best-effort */
        }

        const initialPostal = billingRef.current.postalCode?.trim() || undefined;
        const cardOptions: Record<string, unknown> = { style: cardStyle };
        // Prefill from billing address so the buyer isn't asked twice.
        if (initialPostal) cardOptions.postalCode = initialPostal;

        let card: SquareCardInstance;
        try {
          card = await payments.card(cardOptions);
        } catch {
          // Retry without custom styles if Square rejects them
          const fallback: Record<string, unknown> = {};
          if (initialPostal) fallback.postalCode = initialPostal;
          card = await payments.card(
            Object.keys(fallback).length ? fallback : undefined,
          );
        }

        if (cancelled) {
          try {
            await card.destroy();
          } catch {
            /* ignore */
          }
          return;
        }

        const el = document.getElementById(containerId);
        if (!el) {
          throw new Error("Card container missing");
        }

        await card.attach(`#${containerId}`);
        cardRef.current = card;
        setCardReady(true);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not load card form";
        if (!cancelled) {
          setLoadError(message);
          onErrorRef.current(message);
        }
      }
    }

    void attachCard();

    return () => {
      cancelled = true;
      const card = cardRef.current;
      cardRef.current = null;
      setCardReady(false);
      if (card) {
        void card.destroy().catch(() => undefined);
      }
    };
  }, [scriptReady, applicationId, locationId, containerId]);

  // Keep Square's postcode field in sync with the billing address section.
  useEffect(() => {
    const card = cardRef.current;
    const postal = billingContact.postalCode?.trim();
    if (!card?.configure || !postal || !cardReady) return;
    void card.configure({ postalCode: postal }).catch(() => undefined);
  }, [billingContact.postalCode, cardReady]);

  async function handlePay() {
    if (!cardRef.current || busy || disabled) return;
    setBusy(true);
    onErrorRef.current("");
    try {
      const billing = billingRef.current;
      const names = splitName(
        [billing.givenName, billing.familyName].filter(Boolean).join(" "),
      );
      const amount = (amountRef.current / 100).toFixed(2);
      const verificationDetails = {
        amount,
        currencyCode: "AUD",
        intent: "CHARGE",
        customerInitiated: true,
        sellerKeyedIn: false,
        billingContact: {
          givenName: billing.givenName || names.givenName || undefined,
          familyName: billing.familyName || names.familyName || undefined,
          email: billing.email || undefined,
          phone: billing.phone || undefined,
          addressLines: billing.addressLines?.filter(Boolean) || undefined,
          city: billing.city || undefined,
          state: billing.state || undefined,
          postalCode: billing.postalCode || undefined,
          countryCode: billing.countryCode || "AU",
        },
      };

      const result = await cardRef.current.tokenize(verificationDetails);
      if (result.status !== "OK" || !result.token) {
        onErrorRef.current(
          result.errors?.[0]?.message ?? "Card details are invalid",
        );
        return;
      }
      await onToken(result.token);
    } catch (error) {
      onErrorRef.current(
        error instanceof Error ? error.message : "Payment failed",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Script
        src={scriptSrc}
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => {
          const msg = "Could not load Square payment script";
          setLoadError(msg);
          onErrorRef.current(msg);
        }}
      />
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-muted">
          Card details
        </p>
        <div
          id={containerId}
          className="min-h-[72px] border border-line bg-white px-3 py-3"
        />
        <p className="mt-2 text-xs text-muted">
          Enter card number, expiry, and CVV. Postcode is taken from your
          billing address above.
        </p>
      </div>
      {!cardReady && !loadError && (
        <p className="text-sm text-muted">Loading secure card fields…</p>
      )}
      {loadError && (
        <p className="text-sm text-red-700">
          {loadError}. Try refreshing, or use bank transfer instead.
        </p>
      )}
      <button
        type="button"
        onClick={() => void handlePay()}
        disabled={!cardReady || busy || disabled || Boolean(loadError)}
        className="btn-cta w-full rounded-xl py-3.5 text-sm tracking-wide"
      >
        {busy ? "Processing…" : buttonLabel}
      </button>
    </div>
  );
}
