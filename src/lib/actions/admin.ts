"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { flightFormSchema } from "@/lib/validation";
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

function parseDateTimeLocal(value: string): Date {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new Error("Invalid date/time");
  }
  return d;
}

export async function createFlightAction(formData: FormData) {
  await requireAdmin();

  const parsed = flightFormSchema.safeParse({
    airline: formData.get("airline"),
    flightNumber: formData.get("flightNumber"),
    origin: formData.get("origin"),
    destination: formData.get("destination"),
    departureAt: formData.get("departureAt"),
    arrivalAt: formData.get("arrivalAt"),
    cabinClass: formData.get("cabinClass"),
    basePriceAud: formData.get("basePriceAud"),
    totalSeats: formData.get("totalSeats"),
  });

  if (!parsed.success) {
    redirect(
      `/admin?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid flight")}`,
    );
  }

  const data = parsed.data;
  if (data.origin === data.destination) {
    redirect("/admin?tab=form&error=From+and+To+must+be+different");
  }

  let departureAt: Date;
  let arrivalAt: Date;
  try {
    departureAt = parseDateTimeLocal(data.departureAt);
    arrivalAt = parseDateTimeLocal(data.arrivalAt);
  } catch {
    redirect("/admin?tab=form&error=Invalid+departure+or+arrival+time");
  }

  if (arrivalAt <= departureAt) {
    redirect("/admin?tab=form&error=Arrival+must+be+after+departure");
  }

  await prisma.flight.create({
    data: {
      airline: data.airline,
      flightNumber: data.flightNumber.toUpperCase(),
      origin: data.origin,
      destination: data.destination,
      departureAt,
      arrivalAt,
      cabinClass: data.cabinClass,
      basePriceCents: Math.round(data.basePriceAud * 100),
      currency: "AUD",
      totalSeats: data.totalSeats,
      remainingSeats: data.totalSeats,
      active: true,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/flights");
  redirect("/admin?tab=flights&saved=added");
}

export async function updateFlightAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin?error=Missing+flight");

  const parsed = flightFormSchema.safeParse({
    airline: formData.get("airline"),
    flightNumber: formData.get("flightNumber"),
    origin: formData.get("origin"),
    destination: formData.get("destination"),
    departureAt: formData.get("departureAt"),
    arrivalAt: formData.get("arrivalAt"),
    cabinClass: formData.get("cabinClass"),
    basePriceAud: formData.get("basePriceAud"),
    totalSeats: formData.get("totalSeats"),
    remainingSeats: formData.get("remainingSeats"),
  });

  if (!parsed.success) {
    redirect(
      `/admin?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid flight")}`,
    );
  }

  const data = parsed.data;
  const remainingSeats = Math.min(
    data.remainingSeats ?? data.totalSeats,
    data.totalSeats,
  );

  let departureAt: Date;
  let arrivalAt: Date;
  try {
    departureAt = parseDateTimeLocal(data.departureAt);
    arrivalAt = parseDateTimeLocal(data.arrivalAt);
  } catch {
    redirect("/admin?error=Invalid+departure+or+arrival+time");
  }

  await prisma.flight.update({
    where: { id },
    data: {
      airline: data.airline,
      flightNumber: data.flightNumber.toUpperCase(),
      origin: data.origin,
      destination: data.destination,
      departureAt,
      arrivalAt,
      cabinClass: data.cabinClass,
      basePriceCents: Math.round(data.basePriceAud * 100),
      totalSeats: data.totalSeats,
      remainingSeats,
      active: true,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/flights");
  redirect("/admin?tab=flights&saved=updated");
}

/** Quick ticket price update only. */
export async function updateTicketPriceAction(formData: FormData) {
  await requireAdmin();

  const parsed = z
    .object({
      id: z.string().min(1),
      basePriceAud: z.coerce.number().positive("Price must be greater than 0"),
    })
    .safeParse({
      id: formData.get("id"),
      basePriceAud: formData.get("basePriceAud"),
    });

  if (!parsed.success) {
    redirect(
      `/admin?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid price")}`,
    );
  }

  await prisma.flight.update({
    where: { id: parsed.data.id },
    data: { basePriceCents: Math.round(parsed.data.basePriceAud * 100) },
  });

  revalidatePath("/admin");
  revalidatePath("/flights");
  redirect("/admin?tab=flights&saved=price");
}

/** Remove flight from customer search (soft remove). */
export async function removeFlightAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin?error=Missing+flight");

  await prisma.flight.update({
    where: { id },
    data: { active: false },
  });

  revalidatePath("/admin");
  revalidatePath("/flights");
  redirect("/admin?tab=flights&saved=removed");
}

/** Put a removed flight back on the site. */
export async function restoreFlightAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin?error=Missing+flight");

  await prisma.flight.update({
    where: { id },
    data: { active: true },
  });

  revalidatePath("/admin");
  revalidatePath("/flights");
  redirect("/admin?tab=flights&saved=restored");
}

/** Permanently delete when there are no bookings on the flight. */
export async function deleteFlightAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin?error=Missing+flight");

  const bookings = await prisma.booking.count({
    where: { OR: [{ flightId: id }, { returnFlightId: id }] },
  });
  if (bookings > 0) {
    redirect(
      "/admin?error=Cannot+delete+forever+—+this+flight+has+bookings.+Remove+it+from+the+site+instead.",
    );
  }

  await prisma.demandEvent.deleteMany({ where: { flightId: id } });
  await prisma.priceQuote.deleteMany({
    where: { OR: [{ flightId: id }, { returnFlightId: id }] },
  });
  await prisma.flight.delete({ where: { id } });

  revalidatePath("/admin");
  revalidatePath("/flights");
  redirect("/admin?tab=flights&saved=deleted");
}
