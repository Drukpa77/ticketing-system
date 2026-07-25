"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionId } from "@/lib/session";
import { z } from "zod";

const passengerSchema = z.object({
  quoteId: z.string().min(1),
  title: z.string().trim().min(1, "Select a title"),
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.string().trim().min(1, "Last name is required").max(80),
  email: z.string().trim().email("Valid email is required"),
  phone: z.string().trim().min(6, "Mobile number is required").max(40),
  passportNumber: z.string().trim().max(40).optional().or(z.literal("")),
  nationality: z.string().trim().max(60).optional().or(z.literal("")),
  seatsBooked: z.coerce.number().int().min(1).max(9).default(1),
  privacyAccepted: z.string().optional(),
});

export async function savePassengerDetailsAction(formData: FormData) {
  const parsed = passengerSchema.safeParse({
    quoteId: formData.get("quoteId"),
    title: formData.get("title"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    passportNumber: formData.get("passportNumber") || "",
    nationality: formData.get("nationality") || "",
    seatsBooked: formData.get("seatsBooked") || "1",
    privacyAccepted: formData.get("privacyAccepted")?.toString(),
  });

  if (parsed.success && parsed.data.privacyAccepted !== "on") {
    redirect(
      `/checkout/${parsed.data.quoteId}/passengers?error=${encodeURIComponent(
        "Please accept the privacy policy to continue",
      )}`,
    );
  }

  if (!parsed.success) {
    const quoteId = String(formData.get("quoteId") ?? "");
    redirect(
      `/checkout/${quoteId}/passengers?error=${encodeURIComponent(
        parsed.error.issues[0]?.message ?? "Invalid passenger details",
      )}`,
    );
  }

  const data = parsed.data;
  const sessionId = await getSessionId();
  const quote = await prisma.priceQuote.findUnique({
    where: { id: data.quoteId },
  });

  if (!quote || quote.sessionId !== sessionId) {
    redirect("/?error=Quote+not+found");
  }
  if (quote.status !== "active" || quote.expiresAt <= new Date()) {
    redirect(
      `/checkout/${data.quoteId}/passengers?error=${encodeURIComponent(
        "This fare lock has expired — please select fares again",
      )}`,
    );
  }

  await prisma.priceQuote.update({
    where: { id: data.quoteId },
    data: {
      passengerTitle: data.title,
      passengerFirstName: data.firstName,
      passengerLastName: data.lastName,
      passengerEmail: data.email,
      passengerPhone: data.phone,
      passportNumber: data.passportNumber || "",
      nationality: data.nationality || "",
      seatsBooked: data.seatsBooked,
      privacyAccepted: true,
    },
  });

  revalidatePath(`/checkout/${data.quoteId}`);
  redirect(`/checkout/${data.quoteId}`);
}
