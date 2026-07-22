"use client";

import Link from "next/link";
import { useCallback, useMemo, useState, useTransition } from "react";
import { SquareCardFields } from "@/components/SquareCardFields";
import { payWithCardAction } from "@/lib/actions/payment";
import { calculateCardServiceFee } from "@/lib/payments/fees";
import { formatAud } from "@/lib/pricing";

const fieldClass =
  "w-full border-0 border-b border-line bg-transparent py-3 text-sm text-foreground outline-none transition focus:border-accent";

type CardCheckoutFormProps = {
  quoteId: string;
  maxSeats: number;
  unitPriceCents: number;
  square: {
    applicationId: string;
    locationId: string;
    environment: "sandbox" | "production";
  };
};

export function CardCheckoutForm({
  quoteId,
  maxSeats,
  unitPriceCents,
  square,
}: CardCheckoutFormProps) {
  const [passengerName, setPassengerName] = useState("");
  const [email, setEmail] = useState("");
  const [seatsBooked, setSeatsBooked] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const seatMax = Math.min(9, Math.max(1, maxSeats));
  const fareCents = unitPriceCents * seatsBooked;
  const fee = useMemo(() => calculateCardServiceFee(fareCents), [fareCents]);

  const passengerOk =
    passengerName.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleError = useCallback((message: string) => {
    setError(message || null);
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Card payment
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-semibold tracking-tight">
          Pay securely with Square
        </h2>
        <p className="mt-2 text-sm text-muted">
          Your card details never touch our servers.
        </p>
      </div>

      <div className="grid gap-5">
        <label className="space-y-1 text-sm">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Full name
          </span>
          <input
            value={passengerName}
            onChange={(e) => setPassengerName(e.target.value)}
            className={fieldClass}
            placeholder="Alex Morgan"
            autoComplete="name"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Email for invoice
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldClass}
            placeholder="you@email.com"
            autoComplete="email"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Seats
          </span>
          <input
            type="number"
            min={1}
            max={seatMax}
            value={seatsBooked}
            onChange={(e) =>
              setSeatsBooked(
                Math.min(seatMax, Math.max(1, Number(e.target.value) || 1)),
              )
            }
            className={`${fieldClass} w-28`}
          />
        </label>
      </div>

      <div className="border border-line bg-surface/70 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          Price breakdown
        </p>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Ticket fare</dt>
            <dd className="font-medium">{formatAud(fee.fareCents)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">
              Service fee{" "}
              <span className="text-foreground/70">({fee.rateLabel})</span>
            </dt>
            <dd className="font-medium">{formatAud(fee.serviceFeeCents)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-line pt-3">
            <dt className="font-semibold text-foreground">Total due</dt>
            <dd className="font-[family-name:var(--font-syne)] text-2xl font-semibold">
              {formatAud(fee.totalCents)}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-muted">
          The service fee covers card processing costs for Visa, Mastercard, and
          digital wallets.
        </p>
      </div>

      <div className="border border-line bg-white/80 p-5 sm:p-6">
        <SquareCardFields
          applicationId={square.applicationId}
          locationId={square.locationId}
          environment={square.environment}
          disabled={pending || !passengerOk}
          buttonLabel={
            pending ? "Processing…" : `Pay ${formatAud(fee.totalCents)}`
          }
          onError={handleError}
          onToken={async (token) => {
            if (!passengerOk) {
              setError("Enter a valid passenger name and email first");
              return;
            }
            startTransition(async () => {
              try {
                const result = await payWithCardAction({
                  quoteId,
                  passengerName: passengerName.trim(),
                  email: email.trim(),
                  seatsBooked,
                  sourceId: token,
                });
                if (result?.error) setError(result.error);
              } catch (err) {
                setError(
                  err instanceof Error
                    ? err.message
                    : "Payment failed unexpectedly",
                );
              }
            });
          }}
        />
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <p className="text-sm text-muted">
        Prefer invoice with no service fee?{" "}
        <Link
          href={`/checkout/${quoteId}/bank`}
          className="font-medium text-accent underline"
        >
          Pay by bank transfer
        </Link>
      </p>
    </div>
  );
}
