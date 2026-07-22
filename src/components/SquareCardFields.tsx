"use client";

import { useEffect, useId, useRef, useState } from "react";
import Script from "next/script";

type SquareCardFieldsProps = {
  applicationId: string;
  locationId: string;
  environment: "sandbox" | "production";
  disabled?: boolean;
  buttonLabel: string;
  onToken: (token: string) => void | Promise<void>;
  onError: (message: string) => void;
};

type SquareCardInstance = {
  attach: (selector: string) => Promise<void>;
  destroy: () => Promise<void>;
  tokenize: () => Promise<{
    status: string;
    token?: string;
    errors?: { message?: string }[];
  }>;
};

type SquarePayments = {
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
    borderColor: "#c5d5cc",
    borderRadius: "0px",
  },
  ".input-container.is-focus": {
    borderColor: "#1a6b4a",
  },
  ".input-container.is-error": {
    borderColor: "#b91c1c",
  },
  input: {
    fontSize: "16px",
    color: "#10231c",
  },
  "input::placeholder": {
    color: "#4d6359",
  },
  ".message-text": {
    color: "#4d6359",
  },
};

export function SquareCardFields({
  applicationId,
  locationId,
  environment,
  disabled,
  buttonLabel,
  onToken,
  onError,
}: SquareCardFieldsProps) {
  const [scriptReady, setScriptReady] = useState(false);
  const [cardReady, setCardReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const cardRef = useRef<SquareCardInstance | null>(null);
  const reactId = useId().replace(/:/g, "");
  const containerId = `square-card-${reactId}`;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

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

        let card: SquareCardInstance;
        try {
          card = await payments.card({ style: cardStyle });
        } catch {
          // Retry without custom styles if Square rejects them
          card = await payments.card();
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

  async function handlePay() {
    if (!cardRef.current || busy || disabled) return;
    setBusy(true);
    onErrorRef.current("");
    try {
      const result = await cardRef.current.tokenize();
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
      <div
        id={containerId}
        className="min-h-[96px] border border-line bg-white px-3 py-3"
      />
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
        className="w-full bg-accent-deep py-3.5 text-sm font-semibold tracking-wide text-white transition hover:bg-accent disabled:bg-muted"
      >
        {busy ? "Processing…" : buttonLabel}
      </button>
    </div>
  );
}
