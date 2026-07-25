"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { emailMyBankInvoiceAction } from "@/lib/actions/customerInvoice";

type InvoiceDeliveryActionsProps = {
  bookingId: string;
  invoiceNumber: string;
  invoiceHref: string;
  customerEmail: string;
  unpaid: boolean;
  initialEmailed?: boolean | null;
};

export function InvoiceDeliveryActions({
  bookingId,
  invoiceHref,
  customerEmail,
  unpaid,
  initialEmailed = null,
}: InvoiceDeliveryActionsProps) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(
    initialEmailed === true
      ? {
          type: "ok",
          text: `Invoice email sent to ${customerEmail}.`,
        }
      : initialEmailed === false
        ? {
            type: "err",
            text: "We could not auto-email the invoice. Use the button below to try again, or view it online.",
          }
        : null,
  );

  function requestEmail() {
    setFeedback(null);
    startTransition(async () => {
      const result = await emailMyBankInvoiceAction(bookingId);
      if (result.ok) {
        setFeedback({ type: "ok", text: result.message });
      } else {
        setFeedback({ type: "err", text: result.error });
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link
          href={invoiceHref}
          className={`${unpaid ? "btn-cta" : "btn-secondary"} min-h-11 px-5 py-2.5 text-sm`}
          target="_blank"
        >
          View unpaid invoice
        </Link>
        <button
          type="button"
          onClick={requestEmail}
          disabled={pending}
          className="btn-secondary min-h-11 px-5 py-2.5 text-sm disabled:opacity-60"
        >
          {pending ? "Sending…" : "Email invoice to me"}
        </button>
      </div>
      <p className="text-xs text-muted">
        Sends the unpaid airfare invoice (with bank details) to{" "}
        <span className="font-medium text-foreground">{customerEmail}</span>.
      </p>
      {feedback ? (
        <p
          className={`rounded-xl border px-4 py-3 text-sm ${
            feedback.type === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-amber-200 bg-amber-50 text-amber-950"
          }`}
        >
          {feedback.text}
        </p>
      ) : null}
    </div>
  );
}
