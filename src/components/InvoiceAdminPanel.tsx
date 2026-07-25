"use client";

import { useMemo, useState } from "react";
import {
  generateInvoiceDocumentsAction,
  markInvoicePaidAction,
  markInvoiceSentAction,
  markInvoiceUnpaidAction,
  updateInvoiceDocumentAction,
} from "@/lib/actions/invoices";
import { formatAud } from "@/lib/pricing";

export type AdminInvoiceRow = {
  id: string;
  invoiceNumber: string;
  status: "unpaid" | "paid" | "cancelled" | "failed";
  paymentMethod: "card" | "bank_transfer" | "cash";
  amountCents: number;
  fareCents: number;
  serviceFeeCents: number;
  airfareCents: number;
  airportTaxesCents: number;
  extraBaggageCents: number;
  travelInsuranceCents: number;
  otherChargesCents: number;
  gstIncluded: boolean;
  accountNumber: string;
  businessTpn: string;
  routeLabel: string;
  seatLabel: string;
  nameRef: string;
  endorsementText: string;
  fareCalculationLine: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes: string;
  bankReference: string | null;
  squarePaymentId: string | null;
  dueAt: string | null;
  sentAt: string | null;
  paidAt: string | null;
  markedPaidByAdmin: boolean;
  createdAt: string;
  bookingRef: string;
  bookingId: string;
};

function aud(cents: number) {
  return (cents / 100).toFixed(2);
}

function dueInputValue(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const fieldClass =
  "w-full min-w-0 border-0 border-b border-line bg-transparent py-2 text-sm text-foreground outline-none transition focus:border-accent";

export function InvoiceAdminPanel({ invoices }: { invoices: AdminInvoiceRow[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = useMemo(
    () => invoices.find((i) => i.id === editingId) ?? null,
    [editingId, invoices],
  );

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-syne)] text-2xl font-semibold tracking-tight">
          Invoices
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Each booking has two documents: the travel pack (E-Ticket / Itinerary /
          Receipts / Tax Invoice) and the commercial Airfare Invoice. Preview,
          edit line items, generate missing fields, and resend emails here.
        </p>
      </div>

      {invoices.length === 0 ? (
        <div className="border border-dashed border-line bg-surface/70 px-6 py-14 text-center text-sm text-muted">
          No invoices yet.
        </div>
      ) : (
        <ul className="divide-y divide-line border-y border-line bg-surface/60">
          {invoices.map((invoice) => (
            <li key={invoice.id} className="px-4 py-5 sm:px-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <p className="font-[family-name:var(--font-syne)] text-lg font-semibold tracking-tight">
                      {invoice.invoiceNumber}
                    </p>
                    <span
                      className={`text-xs font-medium uppercase tracking-[0.12em] ${
                        invoice.status === "paid"
                          ? "text-accent"
                          : invoice.status === "unpaid"
                            ? "text-amber-800"
                            : "text-muted"
                      }`}
                    >
                      {invoice.status}
                      {invoice.markedPaidByAdmin ? " · admin" : ""}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">
                    {invoice.customerName} · {invoice.customerEmail}
                  </p>
                  <p className="text-sm text-muted">
                    Booking {invoice.bookingRef} ·{" "}
                    {invoice.paymentMethod === "card"
                      ? "Credit card"
                      : invoice.paymentMethod === "cash"
                        ? "Cash"
                        : "Bank transfer"}
                    {invoice.routeLabel ? ` · ${invoice.routeLabel}` : ""}
                  </p>
                  <p className="text-sm font-medium">
                    {formatAud(invoice.amountCents)}
                    {invoice.sentAt
                      ? ` · Sent ${new Date(invoice.sentAt).toLocaleString("en-AU")}`
                      : " · Not sent"}
                    {invoice.paidAt
                      ? ` · Paid ${new Date(invoice.paidAt).toLocaleString("en-AU")}`
                      : ""}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={`/documents/eticket/${encodeURIComponent(invoice.bookingRef)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="border border-line px-3 py-2 text-sm font-medium text-muted transition hover:border-accent hover:text-foreground"
                  >
                    Preview travel doc
                  </a>
                  <a
                    href={`/documents/invoice/${encodeURIComponent(invoice.invoiceNumber)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="border border-line px-3 py-2 text-sm font-medium text-muted transition hover:border-accent hover:text-foreground"
                  >
                    Preview airfare invoice
                  </a>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingId(
                        editingId === invoice.id ? null : invoice.id,
                      )
                    }
                    className="border border-line px-3 py-2 text-sm font-medium text-muted transition hover:border-accent hover:text-foreground"
                  >
                    {editingId === invoice.id ? "Close edit" : "Edit"}
                  </button>
                  <form action={generateInvoiceDocumentsAction}>
                    <input type="hidden" name="id" value={invoice.id} />
                    <button
                      type="submit"
                      className="border border-line px-3 py-2 text-sm font-medium text-muted transition hover:border-accent hover:text-foreground"
                    >
                      Generate
                    </button>
                  </form>
                  {invoice.status !== "paid" ? (
                    <form action={markInvoicePaidAction}>
                      <input type="hidden" name="id" value={invoice.id} />
                      <button
                        type="submit"
                        className="bg-accent-deep px-3 py-2 text-sm font-semibold text-white transition hover:bg-accent"
                      >
                        Mark paid
                      </button>
                    </form>
                  ) : (
                    <form action={markInvoiceUnpaidAction}>
                      <input type="hidden" name="id" value={invoice.id} />
                      <button
                        type="submit"
                        className="border border-line px-3 py-2 text-sm font-medium text-muted transition hover:border-accent hover:text-foreground"
                      >
                        Mark unpaid
                      </button>
                    </form>
                  )}
                  <form action={markInvoiceSentAction}>
                    <input type="hidden" name="id" value={invoice.id} />
                    <button
                      type="submit"
                      className="border border-line px-3 py-2 text-sm font-medium text-muted transition hover:border-accent hover:text-foreground"
                    >
                      {invoice.sentAt ? "Resend email" : "Send email"}
                    </button>
                  </form>
                </div>
              </div>

              {editing?.id === invoice.id && (
                <form
                  action={updateInvoiceDocumentAction}
                  className="mt-5 space-y-4 border-t border-line pt-5"
                >
                  <input type="hidden" name="id" value={invoice.id} />
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                    Edit airfare invoice &amp; document fields
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <label className="block text-xs text-muted">
                      Customer name
                      <input
                        name="customerName"
                        required
                        defaultValue={invoice.customerName}
                        className={fieldClass}
                      />
                    </label>
                    <label className="block text-xs text-muted">
                      Email
                      <input
                        name="customerEmail"
                        type="email"
                        required
                        defaultValue={invoice.customerEmail}
                        className={fieldClass}
                      />
                    </label>
                    <label className="block text-xs text-muted">
                      Phone
                      <input
                        name="customerPhone"
                        defaultValue={invoice.customerPhone}
                        className={fieldClass}
                      />
                    </label>
                    <label className="block text-xs text-muted">
                      Airfare (AUD)
                      <input
                        name="airfareAud"
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={aud(invoice.airfareCents || invoice.fareCents)}
                        className={fieldClass}
                      />
                    </label>
                    <label className="block text-xs text-muted">
                      Airport taxes (AUD)
                      <input
                        name="airportTaxesAud"
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={aud(invoice.airportTaxesCents)}
                        className={fieldClass}
                      />
                    </label>
                    <label className="block text-xs text-muted">
                      Extra baggage (AUD)
                      <input
                        name="extraBaggageAud"
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={aud(invoice.extraBaggageCents)}
                        className={fieldClass}
                      />
                    </label>
                    <label className="block text-xs text-muted">
                      Travel insurance (AUD)
                      <input
                        name="travelInsuranceAud"
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={aud(invoice.travelInsuranceCents)}
                        className={fieldClass}
                      />
                    </label>
                    <label className="block text-xs text-muted">
                      Other charges (AUD)
                      <input
                        name="otherChargesAud"
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={aud(invoice.otherChargesCents)}
                        className={fieldClass}
                      />
                    </label>
                    <label className="block text-xs text-muted">
                      Payment surcharge (AUD)
                      <input
                        name="serviceFeeAud"
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={aud(invoice.serviceFeeCents)}
                        className={fieldClass}
                      />
                    </label>
                    <label className="block text-xs text-muted">
                      Account number
                      <input
                        name="accountNumber"
                        defaultValue={invoice.accountNumber}
                        className={fieldClass}
                      />
                    </label>
                    <label className="block text-xs text-muted">
                      Business TPN
                      <input
                        name="businessTpn"
                        defaultValue={invoice.businessTpn}
                        className={fieldClass}
                      />
                    </label>
                    <label className="block text-xs text-muted">
                      Route label
                      <input
                        name="routeLabel"
                        defaultValue={invoice.routeLabel}
                        placeholder="Paro-Perth-Paro"
                        className={fieldClass}
                      />
                    </label>
                    <label className="block text-xs text-muted">
                      Seat label
                      <input
                        name="seatLabel"
                        defaultValue={invoice.seatLabel}
                        placeholder="12A"
                        className={fieldClass}
                      />
                    </label>
                    <label className="block text-xs text-muted">
                      Name REF
                      <input
                        name="nameRef"
                        defaultValue={invoice.nameRef}
                        className={fieldClass}
                      />
                    </label>
                    <label className="block text-xs text-muted">
                      Due at
                      <input
                        name="dueAt"
                        type="datetime-local"
                        defaultValue={dueInputValue(invoice.dueAt)}
                        className={fieldClass}
                      />
                    </label>
                    <label className="col-span-full block text-xs text-muted sm:col-span-2">
                      Fare calculation line
                      <input
                        name="fareCalculationLine"
                        defaultValue={invoice.fareCalculationLine}
                        className={fieldClass}
                      />
                    </label>
                    <label className="col-span-full block text-xs text-muted sm:col-span-2">
                      Endorsement / restrictions
                      <input
                        name="endorsementText"
                        defaultValue={invoice.endorsementText}
                        className={fieldClass}
                      />
                    </label>
                    <label className="col-span-full block text-xs text-muted">
                      Notes
                      <textarea
                        name="notes"
                        rows={2}
                        defaultValue={invoice.notes}
                        className={`${fieldClass} resize-y`}
                      />
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        name="gstIncluded"
                        defaultChecked={invoice.gstIncluded}
                      />
                      GST included in totals
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      className="bg-accent-deep px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent"
                    >
                      Save invoice
                    </button>
                    <a
                      href={`/confirmation/${invoice.bookingId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="border border-line px-4 py-2 text-sm font-medium text-muted transition hover:border-accent hover:text-foreground"
                    >
                      Open confirmation
                    </a>
                  </div>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
