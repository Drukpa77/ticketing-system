"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionId } from "@/lib/session";

export async function removeCartItemAction(formData: FormData) {
  const quoteId = String(formData.get("quoteId") ?? "").trim();
  if (!quoteId) redirect("/cart?error=Missing+item");

  const sessionId = await getSessionId();
  const quote = await prisma.priceQuote.findFirst({
    where: { id: quoteId, sessionId, status: "active" },
  });

  if (quote) {
    await prisma.priceQuote.update({
      where: { id: quote.id },
      data: { status: "expired" },
    });
  }

  revalidatePath("/cart");
  revalidatePath("/");
  redirect("/cart?saved=removed");
}
