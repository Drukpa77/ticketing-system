"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

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

  await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.update({
      where: { id },
      data: {
        status: "paid",
        paidAt: new Date(),
        markedPaidByAdmin: true,
      },
    });
    await tx.booking.update({
      where: { id: invoice.bookingId },
      data: { status: "confirmed" },
    });
  });

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

  await prisma.invoice.update({
    where: { id },
    data: { sentAt: new Date() },
  });

  // Email delivery comes next — for now admin marks as reviewed/sent.
  revalidatePath("/admin");
  redirect("/admin?tab=invoices&saved=invoice-sent");
}
