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
  paymentProofEmail: string;
  initialPassenger?: {
    passengerName?: string;
    email?: string;
    passengerPhone?: string;
    passportNumber?: string;
    nationality?: string;
    seatsBooked?: number;
  };
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
  paymentProofEmail,
  initialPassenger,
  bankPreview,
}: BankCheckoutFormProps) {
  const [passengerName, setPassengerName] = useState(
    initialPassenger?.passengerName ?? "",
  );
  const [email, setEmail] = useState(initialPassenger?.email ?? "");
  const [passengerPhone, setPassengerPhone] = useState(
    initialPassenger?.passengerPhone ?? "",
  );
  const [passportNumber, setPassportNumber] = useState(
    initialPassenger?.passportNumber ?? "",
  );
  const [nationality, setNationality] = useState(
    initialPassenger?.nationality ?? "",
  );
  const [seatsBooked, setSeatsBooked] = useState(
    initialPassenger?.seatsBooked ?? 1,
  );
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

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Bank transfer
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-semibold tracking-tight">
          Request an invoice
        </h2>
        <p className="mt-2 text-sm text-muted">
          You are not charged online. We create an unpaid invoice with our bank
          details, hold your seats for 48 hours, and confirm the booking after
          your transfer is verified.
        </p>
      </div>

      <div className="grid gap-5">
        <label className="space-y-1 text-sm">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Full name
          </span>
          <input
            name="passengerName"
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
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldClass}
            placeholder="you@email.com"
            autoComplete="email"
            required
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Phone
          </span>
          <input
            name="passengerPhone"
            value={passengerPhone}
            onChange={(e) => setPassengerPhone(e.target.value)}
            className={fieldClass}
            placeholder="+61 412 345 678"
            autoComplete="tel"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Passport number
          </span>
          <input
            name="passportNumber"
            value={passportNumber}
            onChange={(e) => setPassportNumber(e.target.value)}
            className={fieldClass}
            placeholder="N1234567"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Nationality
          </span>
          <input
            name="nationality"
            value={nationality}
            onChange={(e) => setNationality(e.target.value)}
            className={fieldClass}
            placeholder="Australian"
          />
        </label>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <label className="space-y-1 text-sm">
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
              Seats
            </span>
            <input
              name="seatsBooked"
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
              Amount due
            </p>
            <p className="font-[family-name:var(--font-syne)] text-3xl font-semibold">
              {formatAud(totalCents)}
            </p>
          </div>
        </div>
      </div>

      <dl className="grid gap-2 rounded-2xl border border-line bg-surface/60 p-5 text-sm">
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

      <div className="rounded-2xl border border-accent/25 bg-[linear-gradient(135deg,rgba(37,99,235,0.08),rgba(220,38,38,0.06))] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-deep">
          Transaction instructions
        </p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-foreground">
          <li>
            Request your unpaid invoice below — no online payment is taken.
          </li>
          <li>
            Transfer the outstanding amount using your booking reference as the
            payment description.
          </li>
          <li>
            Email a screenshot of the successful transfer to{" "}
            <a
              href={`mailto:${paymentProofEmail}`}
              className="font-semibold text-accent underline"
            >
              {paymentProofEmail}
            </a>{" "}
            so we can confirm your booking.
          </li>
        </ol>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          Seats stay on hold for 48 hours. If payment is not verified in that
          window, the hold ends and you will need to book again.
        </p>
      </div>

      {state?.error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || !passengerOk}
        className="btn-cta w-full rounded-xl py-3.5 text-sm tracking-wide"
      >
        {pending
          ? "Creating unpaid invoice…"
          : `Get unpaid invoice · ${formatAud(totalCents)}`}
      </button>
      <p className="-mt-4 text-center text-xs text-muted">
        Next you’ll be able to view the invoice online and email it to yourself.
      </p>

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
