"use client";

import Link from "next/link";
import { useCallback, useState, useTransition } from "react";
import { SquareCardFields } from "@/components/SquareCardFields";
import { payWithCardAction } from "@/lib/actions/payment";
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
  const totalCents = unitPriceCents * seatsBooked;
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
        <div className="flex flex-wrap items-end justify-between gap-4">
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
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Total due
            </p>
            <p className="font-[family-name:var(--font-syne)] text-3xl font-semibold">
              {formatAud(totalCents)}
            </p>
          </div>
        </div>
      </div>

      <div className="border border-line bg-white/80 p-5 sm:p-6">
        <SquareCardFields
          applicationId={square.applicationId}
          locationId={square.locationId}
          environment={square.environment}
          disabled={pending || !passengerOk}
          buttonLabel={pending ? "Processing…" : `Pay ${formatAud(totalCents)}`}
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
        Prefer invoice?{" "}
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
