"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  buildRouteLabel,
  computeInvoiceTotals,
  defaultEndorsementText,
  defaultFareCalculationLine,
  defaultInvoiceIdentity,
} from "@/lib/documents/invoiceFields";
import {
  sendBookingConfirmationBundle,
  sendInvoiceEmailForBooking,
} from "@/lib/email/bookingMail";
import { z } from "zod";

const ADMIN_COOKIE = "ts_admin";

async function requireAdmin() {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  const password = process.env.ADMIN_PASSWORD;
  if (!password || token !== password) {
    redirect("/admin?error=Unauthorized");
  }
}

function moneyAud(value: FormDataEntryValue | null) {
  const n = Number(String(value ?? "0").replace(/,/g, ""));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

export async function markInvoicePaidAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin?tab=invoices&error=Missing+invoice");

  const current = await prisma.invoice.findUnique({
    where: { id },
    include: { booking: true },
  });
  if (!current) redirect("/admin?tab=invoices&error=Invoice+not+found");
  if (
    current.booking.status === "hold_expired" ||
    current.booking.status === "cancelled"
  ) {
    redirect(
      `/admin?tab=invoices&error=${encodeURIComponent(
        "Cannot mark paid — booking hold expired or cancelled. Create a new booking.",
      )}`,
    );
  }

  const invoice = await prisma.$transaction(async (tx) => {
    const updated = await tx.invoice.update({
      where: { id },
      data: {
        status: "paid",
        paidAt: new Date(),
        markedPaidByAdmin: true,
      },
    });
    await tx.booking.update({
      where: { id: updated.bookingId },
      data: { status: "confirmed", holdExpiresAt: null },
    });
    return updated;
  });

  try {
    await sendBookingConfirmationBundle(invoice.bookingId);
  } catch (err) {
    console.error("send confirmation after mark paid failed", err);
  }

  revalidatePath("/admin");
  redirect("/admin?tab=invoices&saved=invoice-paid");
}

export async function markInvoiceUnpaidAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin?tab=invoices&error=Missing+invoice");

  await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.update({
      where: { id },
      data: {
        status: "unpaid",
        paidAt: null,
        markedPaidByAdmin: true,
      },
    });
    await tx.booking.update({
      where: { id: invoice.bookingId },
      data: { status: "pending_payment" },
    });
  });

  revalidatePath("/admin");
  redirect("/admin?tab=invoices&saved=invoice-unpaid");
}

export async function markInvoiceSentAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin?tab=invoices&error=Missing+invoice");

  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) redirect("/admin?tab=invoices&error=Invoice+not+found");

  const result = await sendInvoiceEmailForBooking(invoice.bookingId);
  if (!result.ok && !("skipped" in result && result.skipped)) {
    redirect(
      `/admin?tab=invoices&error=${encodeURIComponent(result.error)}`,
    );
  }
  if (!result.ok && "skipped" in result && result.skipped) {
    await prisma.invoice.update({
      where: { id },
      data: { sentAt: new Date() },
    });
    redirect(
      `/admin?tab=invoices&saved=invoice-sent&error=${encodeURIComponent(
        "Marked sent locally — configure RESEND_API_KEY or SMTP to actually email customers.",
      )}`,
    );
  }

  revalidatePath("/admin");
  redirect("/admin?tab=invoices&saved=invoice-sent");
}

const updateSchema = z.object({
  id: z.string().min(1),
  customerName: z.string().trim().min(1).max(120),
  customerEmail: z.string().trim().email(),
  customerPhone: z.string().trim().max(40).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  accountNumber: z.string().trim().max(80).optional().or(z.literal("")),
  businessTpn: z.string().trim().max(80).optional().or(z.literal("")),
  routeLabel: z.string().trim().max(80).optional().or(z.literal("")),
  seatLabel: z.string().trim().max(40).optional().or(z.literal("")),
  nameRef: z.string().trim().max(40).optional().or(z.literal("")),
  endorsementText: z.string().trim().max(240).optional().or(z.literal("")),
  fareCalculationLine: z.string().trim().max(240).optional().or(z.literal("")),
  gstIncluded: z.enum(["true", "false"]).optional(),
  dueAt: z.string().optional().or(z.literal("")),
});

export async function updateInvoiceDocumentAction(formData: FormData) {
  await requireAdmin();

  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    customerName: formData.get("customerName"),
    customerEmail: formData.get("customerEmail"),
    customerPhone: formData.get("customerPhone") || "",
    notes: formData.get("notes") || "",
    accountNumber: formData.get("accountNumber") || "",
    businessTpn: formData.get("businessTpn") || "",
    routeLabel: formData.get("routeLabel") || "",
    seatLabel: formData.get("seatLabel") || "",
    nameRef: formData.get("nameRef") || "",
    endorsementText: formData.get("endorsementText") || "",
    fareCalculationLine: formData.get("fareCalculationLine") || "",
    gstIncluded: formData.get("gstIncluded") === "on" ? "true" : "false",
    dueAt: formData.get("dueAt") || "",
  });

  if (!parsed.success) {
    redirect(
      `/admin?tab=invoices&error=${encodeURIComponent(
        parsed.error.issues[0]?.message ?? "Invalid invoice",
      )}`,
    );
  }

  const existing = await prisma.invoice.findUnique({
    where: { id: parsed.data.id },
  });
  if (!existing) redirect("/admin?tab=invoices&error=Invoice+not+found");

  const airfareCents = moneyAud(formData.get("airfareAud"));
  const airportTaxesCents = moneyAud(formData.get("airportTaxesAud"));
  const extraBaggageCents = moneyAud(formData.get("extraBaggageAud"));
  const travelInsuranceCents = moneyAud(formData.get("travelInsuranceAud"));
  const otherChargesCents = moneyAud(formData.get("otherChargesAud"));
  const serviceFeeCents = moneyAud(formData.get("serviceFeeAud"));

  const totals = computeInvoiceTotals({
    airfareCents,
    airportTaxesCents,
    extraBaggageCents,
    travelInsuranceCents,
    otherChargesCents,
    serviceFeeCents,
    gstRateBps: existing.gstRateBps || 1000,
    gstIncluded: parsed.data.gstIncluded !== "false",
  });

  let dueAt: Date | null = existing.dueAt;
  if (parsed.data.dueAt) {
    const d = new Date(parsed.data.dueAt);
    if (!Number.isNaN(d.getTime())) dueAt = d;
  }

  await prisma.invoice.update({
    where: { id: existing.id },
    data: {
      customerName: parsed.data.customerName,
      customerEmail: parsed.data.customerEmail,
      customerPhone: parsed.data.customerPhone || "",
      notes: parsed.data.notes || "",
      accountNumber: parsed.data.accountNumber || "",
      businessTpn: parsed.data.businessTpn || "",
      routeLabel: parsed.data.routeLabel || "",
      seatLabel: parsed.data.seatLabel || "",
      nameRef: parsed.data.nameRef || "",
      endorsementText: parsed.data.endorsementText || "",
      fareCalculationLine: parsed.data.fareCalculationLine || "",
      airfareCents,
      airportTaxesCents,
      extraBaggageCents,
      travelInsuranceCents,
      otherChargesCents,
      fareCents: airfareCents,
      serviceFeeCents,
      gstIncluded: totals.gstIncluded,
      amountCents: totals.amountCents,
      dueAt,
    },
  });

  await prisma.booking.update({
    where: { id: existing.bookingId },
    data: {
      passengerName: parsed.data.customerName,
      email: parsed.data.customerEmail,
      passengerPhone: parsed.data.customerPhone || "",
      amountPaidCents: totals.amountCents,
      serviceFeeCents,
    },
  });

  revalidatePath("/admin");
  revalidatePath(`/confirmation/${existing.bookingId}`);
  redirect("/admin?tab=invoices&saved=invoice-updated");
}

/** Backfill document fields on an existing invoice (generate / refresh). */
export async function generateInvoiceDocumentsAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin?tab=invoices&error=Missing+invoice");

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      booking: { include: { flight: true, returnFlight: true } },
    },
  });
  if (!invoice) redirect("/admin?tab=invoices&error=Invoice+not+found");

  const identity = defaultInvoiceIdentity();
  const flight = invoice.booking.flight;
  const tripType = invoice.booking.tripType;
  const airfare =
    invoice.airfareCents > 0
      ? invoice.airfareCents
      : invoice.fareCents > 0
        ? invoice.fareCents
        : Math.max(0, invoice.amountCents - invoice.serviceFeeCents);

  await prisma.invoice.update({
    where: { id },
    data: {
      airfareCents: airfare,
      fareCents: airfare,
      accountNumber: invoice.accountNumber || identity.accountNumber,
      businessTpn: invoice.businessTpn || identity.businessTpn,
      routeLabel:
        invoice.routeLabel ||
        buildRouteLabel({
          origin: flight.origin,
          destination: flight.destination,
          tripType,
        }),
      nameRef: invoice.nameRef || invoice.booking.bookingRef.slice(-7),
      endorsementText: invoice.endorsementText || defaultEndorsementText(),
      fareCalculationLine:
        invoice.fareCalculationLine ||
        defaultFareCalculationLine({
          origin: flight.origin,
          destination: flight.destination,
          tripType,
          fareCents: airfare,
        }),
      gstRateBps: invoice.gstRateBps || 1000,
      gstIncluded: invoice.gstIncluded,
    },
  });

  revalidatePath("/admin");
  redirect(
    `/admin?tab=invoices&saved=invoice-generated&focus=${encodeURIComponent(id)}`,
  );
}
