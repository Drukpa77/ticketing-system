import { prisma } from "@/lib/db";
import { getPricingConfig, priceFlight } from "@/lib/pricing/service";

export async function createPriceQuote(input: {
  flightId: string;
  returnFlightId?: string;
  sessionId: string;
}) {
  const tripType = input.returnFlightId ? "round_trip" : "one_way";

  const flight = await prisma.flight.findFirst({
    where: { id: input.flightId, active: true },
  });
  if (!flight) return { ok: false as const, error: "Outbound flight not found" };
  if (flight.remainingSeats < 1) {
    return { ok: false as const, error: "Outbound flight is sold out" };
  }

  let returnFlight = null;
  if (input.returnFlightId) {
    returnFlight = await prisma.flight.findFirst({
      where: { id: input.returnFlightId, active: true },
    });
    if (!returnFlight) {
      return { ok: false as const, error: "Return flight not found" };
    }
    if (returnFlight.remainingSeats < 1) {
      return { ok: false as const, error: "Return flight is sold out" };
    }
    if (returnFlight.departureAt <= flight.departureAt) {
      return {
        ok: false as const,
        error: "Return flight must depart after the outbound flight",
      };
    }
    if (
      returnFlight.origin !== flight.destination ||
      returnFlight.destination !== flight.origin
    ) {
      return {
        ok: false as const,
        error: "Return flight must match the reverse route",
      };
    }
  }

  const config = getPricingConfig();
  const outboundPrice = await priceFlight(flight);
  const returnPrice = returnFlight ? await priceFlight(returnFlight) : null;
  const outboundCents = outboundPrice.displayPriceCents;
  const returnCents = returnPrice?.displayPriceCents ?? 0;
  const totalCents = outboundCents + returnCents;
  const expiresAt = new Date(Date.now() + config.quoteTtlMinutes * 60 * 1000);

  const quote = await prisma.$transaction(async (tx) => {
    const created = await tx.priceQuote.create({
      data: {
        flightId: flight.id,
        returnFlightId: returnFlight?.id,
        tripType,
        sessionId: input.sessionId,
        quotedPriceCents: totalCents,
        outboundPriceCents: outboundCents,
        returnPriceCents: returnCents,
        basePriceSnapshotCents:
          flight.basePriceCents + (returnFlight?.basePriceCents ?? 0),
        demandMultiplier: outboundPrice.demandMultiplier,
        scarcityMultiplier: outboundPrice.scarcityMultiplier,
        baseMarkup: outboundPrice.baseMarkup,
        expiresAt,
        status: "active",
      },
    });

    await tx.demandEvent.create({
      data: {
        flightId: flight.id,
        type: "hold",
        sessionId: input.sessionId,
      },
    });
    if (returnFlight) {
      await tx.demandEvent.create({
        data: {
          flightId: returnFlight.id,
          type: "hold",
          sessionId: input.sessionId,
        },
      });
    }

    return created;
  });

  return { ok: true as const, quote };
}

async function decrementSeats(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  flightId: string,
  seats: number,
) {
  const updated = await tx.flight.updateMany({
    where: { id: flightId, remainingSeats: { gte: seats } },
    data: { remainingSeats: { decrement: seats } },
  });
  if (updated.count !== 1) {
    throw new Error("Not enough seats remaining");
  }
}

export async function confirmBooking(input: {
  quoteId: string;
  sessionId: string;
  passengerName: string;
  email: string;
  seatsBooked: number;
}) {
  try {
    const booking = await prisma.$transaction(async (tx) => {
      const quote = await tx.priceQuote.findUnique({
        where: { id: input.quoteId },
      });

      if (!quote) throw new Error("Quote not found");
      if (quote.sessionId !== input.sessionId) {
        throw new Error("Quote does not belong to this session");
      }
      if (quote.status === "used") throw new Error("Quote already used");
      if (quote.status === "expired" || quote.expiresAt <= new Date()) {
        await tx.priceQuote.update({
          where: { id: quote.id },
          data: { status: "expired" },
        });
        throw new Error("Quote has expired — please book again");
      }
      if (quote.status !== "active") throw new Error("Quote is not active");

      const flight = await tx.flight.findUnique({
        where: { id: quote.flightId },
      });
      if (!flight || !flight.active) throw new Error("Outbound flight not available");

      let returnFlight = null;
      if (quote.returnFlightId) {
        returnFlight = await tx.flight.findUnique({
          where: { id: quote.returnFlightId },
        });
        if (!returnFlight || !returnFlight.active) {
          throw new Error("Return flight not available");
        }
      }

      await decrementSeats(tx, flight.id, input.seatsBooked);
      if (returnFlight) {
        await decrementSeats(tx, returnFlight.id, input.seatsBooked);
      }

      await tx.priceQuote.update({
        where: { id: quote.id },
        data: { status: "used" },
      });

      await tx.demandEvent.create({
        data: {
          flightId: flight.id,
          type: "purchase",
          sessionId: input.sessionId,
        },
      });
      if (returnFlight) {
        await tx.demandEvent.create({
          data: {
            flightId: returnFlight.id,
            type: "purchase",
            sessionId: input.sessionId,
          },
        });
      }

      const bookingRef = `TA${Date.now().toString(36).toUpperCase()}${Math.floor(
        Math.random() * 1000,
      )
        .toString()
        .padStart(3, "0")}`;

      return tx.booking.create({
        data: {
          quoteId: quote.id,
          flightId: flight.id,
          returnFlightId: returnFlight?.id,
          tripType: quote.tripType,
          passengerName: input.passengerName,
          email: input.email,
          seatsBooked: input.seatsBooked,
          amountPaidCents: quote.quotedPriceCents * input.seatsBooked,
          status: "confirmed",
          bookingRef,
        },
      });
    });

    return { ok: true as const, booking };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not confirm booking";
    return { ok: false as const, error: message };
  }
}

export async function expireQuoteIfNeeded(quoteId: string) {
  const quote = await prisma.priceQuote.findUnique({ where: { id: quoteId } });
  if (quote && quote.status === "active" && quote.expiresAt <= new Date()) {
    await prisma.priceQuote.update({
      where: { id: quoteId },
      data: { status: "expired" },
    });
    return true;
  }
  return false;
}
