"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { payWithBankTransferAction } from "@/lib/actions/payment";
import { formatAud } from "@/lib/pricing";

const fieldClass =
  "w-full border-0 border-b border-line bg-transparent py-3 text-sm text-foreground outline-none transition focus:border-accent";

type BankCheckoutFormProps = {
  quoteId: string;
  maxSeats: number;
  unitPriceCents: number;
  bankPreview: {
    bankName: string;
    accountName: string;
    bsb: string;
    accountNumber: string;
  };
};

export function BankCheckoutForm({
  quoteId,
  maxSeats,
  unitPriceCents,
  bankPreview,
}: BankCheckoutFormProps) {
  const [passengerName, setPassengerName] = useState("");
  const [email, setEmail] = useState("");
  const [seatsBooked, setSeatsBooked] = useState(1);
  const [state, action, pending] = useActionState(
    payWithBankTransferAction,
    null,
  );

  const seatMax = Math.min(9, Math.max(1, maxSeats));
  const totalCents = unitPriceCents * seatsBooked;
  const passengerOk =
    passengerName.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  return (
    <form action={action} className="space-y-8">
      <input type="hidden" name="quoteId" value={quoteId} />
      <input type="hidden" name="passengerName" value={passengerName} />
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="seatsBooked" value={seatsBooked} />

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Bank transfer
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-semibold tracking-tight">
          Request an invoice
        </h2>
        <p className="mt-2 text-sm text-muted">
          We reserve your seats and give you account details plus a payment
          reference.
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
            required
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
            required
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
              required
            />
          </label>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Outstanding
            </p>
            <p className="font-[family-name:var(--font-syne)] text-3xl font-semibold">
              {formatAud(totalCents)}
            </p>
          </div>
        </div>
      </div>

      <dl className="grid gap-2 border border-line bg-surface/60 p-5 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Bank</dt>
          <dd className="font-medium">{bankPreview.bankName}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Account name</dt>
          <dd className="font-medium">{bankPreview.accountName}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">BSB</dt>
          <dd className="font-medium">{bankPreview.bsb}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Account</dt>
          <dd className="font-medium">{bankPreview.accountNumber}</dd>
        </div>
      </dl>

      {state?.error && <p className="text-sm text-red-700">{state.error}</p>}

      <button
        type="submit"
        disabled={pending || !passengerOk}
        className="w-full bg-accent-deep py-3.5 text-sm font-semibold tracking-wide text-white transition hover:bg-accent disabled:bg-muted"
      >
        {pending
          ? "Creating invoice…"
          : `Request invoice · ${formatAud(totalCents)}`}
      </button>

      <p className="text-sm text-muted">
        Prefer card?{" "}
        <Link
          href={`/checkout/${quoteId}/card`}
          className="font-medium text-accent underline"
        >
          Pay by card
        </Link>
      </p>
    </form>
  );
}
