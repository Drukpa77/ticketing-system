import { prisma } from "@/lib/db";

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export async function decrementFareAndFlight(
  tx: Tx,
  flightId: string,
  fareReleaseId: string,
  seats: number,
) {
  if (seats < 1) return;
  const fareUpdated = await tx.fareRelease.updateMany({
    where: { id: fareReleaseId, remainingSeats: { gte: seats } },
    data: { remainingSeats: { decrement: seats } },
  });
  if (fareUpdated.count !== 1) {
    throw new Error("Not enough seats in this fare release");
  }

  const flightUpdated = await tx.flight.updateMany({
    where: { id: flightId, remainingSeats: { gte: seats } },
    data: { remainingSeats: { decrement: seats } },
  });
  if (flightUpdated.count !== 1) {
    throw new Error("Not enough seats remaining");
  }
}

export async function restoreFareAndFlight(
  tx: Tx,
  flightId: string,
  fareReleaseId: string | null,
  seats: number,
) {
  if (seats < 1) return;
  if (fareReleaseId) {
    const fare = await tx.fareRelease.findUnique({ where: { id: fareReleaseId } });
    if (fare) {
      const nextRemaining = Math.min(
        fare.totalSeats,
        fare.remainingSeats + seats,
      );
      await tx.fareRelease.update({
        where: { id: fareReleaseId },
        data: { remainingSeats: nextRemaining },
      });
    }
  }

  const flight = await tx.flight.findUnique({ where: { id: flightId } });
  if (flight) {
    const nextRemaining = Math.min(
      flight.totalSeats,
      flight.remainingSeats + seats,
    );
    await tx.flight.update({
      where: { id: flightId },
      data: { remainingSeats: nextRemaining },
    });
  }
}

/** Adjust soft-held seats on an active quote to match `targetSeats`. */
export async function syncQuoteSeatHold(
  quoteId: string,
  sessionId: string,
  targetSeats: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await prisma.$transaction(
      async (tx) => {
        const quote = await tx.priceQuote.findUnique({
          where: { id: quoteId },
        });
        if (!quote || quote.sessionId !== sessionId) {
          throw new Error("Quote not found");
        }
        if (quote.status !== "active" || quote.expiresAt <= new Date()) {
          throw new Error("Quote has expired");
        }
        if (!quote.fareReleaseId) {
          throw new Error("Quote missing fare release");
        }

        const seats = Math.min(9, Math.max(1, targetSeats));
        const held = quote.inventoryHeld ? quote.heldSeats : 0;
        const delta = seats - held;

        if (delta > 0) {
          await decrementFareAndFlight(
            tx,
            quote.flightId,
            quote.fareReleaseId,
            delta,
          );
          if (quote.returnFlightId && quote.returnFareReleaseId) {
            await decrementFareAndFlight(
              tx,
              quote.returnFlightId,
              quote.returnFareReleaseId,
              delta,
            );
          }
        } else if (delta < 0) {
          await restoreFareAndFlight(
            tx,
            quote.flightId,
            quote.fareReleaseId,
            -delta,
          );
          if (quote.returnFlightId && quote.returnFareReleaseId) {
            await restoreFareAndFlight(
              tx,
              quote.returnFlightId,
              quote.returnFareReleaseId,
              -delta,
            );
          }
        }

        await tx.priceQuote.update({
          where: { id: quote.id },
          data: {
            seatsBooked: seats,
            heldSeats: seats,
            inventoryHeld: true,
          },
        });
      },
      { maxWait: 15_000, timeout: 30_000 },
    );
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Could not hold seats",
    };
  }
}

/** Release soft-held seats and mark quote expired. */
export async function releaseQuoteHold(quoteId: string) {
  await prisma.$transaction(
    async (tx) => {
      const quote = await tx.priceQuote.findUnique({ where: { id: quoteId } });
      if (!quote || quote.status !== "active") return;

      if (quote.inventoryHeld && quote.heldSeats > 0 && quote.fareReleaseId) {
        await restoreFareAndFlight(
          tx,
          quote.flightId,
          quote.fareReleaseId,
          quote.heldSeats,
        );
        if (quote.returnFlightId && quote.returnFareReleaseId) {
          await restoreFareAndFlight(
            tx,
            quote.returnFlightId,
            quote.returnFareReleaseId,
            quote.heldSeats,
          );
        }
      }

      await tx.priceQuote.update({
        where: { id: quote.id },
        data: {
          status: "expired",
          inventoryHeld: false,
          heldSeats: 0,
        },
      });
    },
    { maxWait: 15_000, timeout: 30_000 },
  );
}
