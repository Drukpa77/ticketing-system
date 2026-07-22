import { SquareClient, SquareEnvironment, SquareError } from "square";

export function isSquareConfigured() {
  return Boolean(
    process.env.SQUARE_ACCESS_TOKEN &&
      process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID &&
      process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
  );
}

export function getSquarePublicConfig() {
  return {
    applicationId: process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID ?? "",
    locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID ?? "",
    configured: isSquareConfigured(),
    environment:
      process.env.SQUARE_ENVIRONMENT === "production"
        ? ("production" as const)
        : ("sandbox" as const),
  };
}

export function getSquareClient() {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  if (!token) {
    throw new Error("SQUARE_ACCESS_TOKEN is not configured");
  }

  const environment =
    process.env.SQUARE_ENVIRONMENT === "production"
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox;

  return new SquareClient({
    token,
    environment,
  });
}

export async function chargeCardPayment(input: {
  sourceId: string;
  amountCents: number;
  idempotencyKey: string;
  referenceId: string;
  note: string;
  buyerEmail?: string;
}) {
  const client = getSquareClient();
  const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;
  if (!locationId) {
    throw new Error("NEXT_PUBLIC_SQUARE_LOCATION_ID is not configured");
  }

  try {
    const response = await client.payments.create({
      sourceId: input.sourceId,
      idempotencyKey: input.idempotencyKey,
      amountMoney: {
        amount: BigInt(input.amountCents),
        currency: "AUD",
      },
      locationId,
      referenceId: input.referenceId.slice(0, 40),
      note: input.note.slice(0, 500),
      autocomplete: true,
      buyerEmailAddress: input.buyerEmail,
    });

    const payment = response.payment;
    if (!payment?.id) {
      throw new Error("Square did not return a payment id");
    }

    const status = payment.status ?? "UNKNOWN";
    if (status !== "COMPLETED" && status !== "APPROVED") {
      throw new Error(`Square payment status: ${status}`);
    }

    return {
      paymentId: payment.id,
      status,
    };
  } catch (error) {
    if (error instanceof SquareError) {
      const detail =
        error.errors?.[0]?.detail ||
        error.errors?.[0]?.code ||
        error.message;
      throw new Error(detail);
    }
    throw error;
  }
}
