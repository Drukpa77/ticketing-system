"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  sendBookingConfirmationBundle,
  sendInvoiceEmailForBooking,
} from "@/lib/email/bookingMail";

const ADMIN_COOKIE = "ts_admin";

async function requireAdmin() {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  const password = process.env.ADMIN_PASSWORD;
  if (!password || token !== password) {
    redirect("/admin?error=Unauthorized");
  }
}

export async function markInvoicePaidAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin?tab=invoices&error=Missing+invoice");

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
