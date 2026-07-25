import { prisma } from "@/lib/db";
import { getSessionId } from "@/lib/session";

export async function getActiveCartQuotes() {
  const sessionId = await getSessionId();
  if (!sessionId) return [];

  const now = new Date();
  return prisma.priceQuote.findMany({
    where: {
      sessionId,
      status: "active",
      expiresAt: { gt: now },
    },
    include: {
      flight: true,
      returnFlight: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCartCount() {
  const items = await getActiveCartQuotes();
  return items.length;
}
