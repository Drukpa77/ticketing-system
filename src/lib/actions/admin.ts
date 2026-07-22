"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  fareTemplateForCabin,
  totalSeatsFromReleases,
} from "@/lib/fares/templates";
import { flightFormSchema, parseFareReleasesFromForm } from "@/lib/validation";
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

function redirectFormError(message: string): never {
  redirect(`/admin?tab=form&error=${encodeURIComponent(message)}`);
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
  });

  if (!parsed.success) {
    redirectFormError(parsed.error.issues[0]?.message ?? "Invalid flight");
  }

  const data = parsed.data;
  if (data.origin === data.destination) {
    redirectFormError("From and To must be different");
  }

  let departureAt: Date;
  let arrivalAt: Date;
  try {
    departureAt = parseDateTimeLocal(data.departureAt);
    arrivalAt = parseDateTimeLocal(data.arrivalAt);
  } catch {
    redirectFormError("Invalid departure or arrival time");
  }

  if (arrivalAt <= departureAt) {
    redirectFormError("Arrival must be after departure");
  }

  let releases;
  try {
    releases = parseFareReleasesFromForm(formData);
  } catch (e) {
    redirectFormError(e instanceof Error ? e.message : "Invalid fare releases");
  }

  const totals = {
    totalSeats: totalSeatsFromReleases(releases),
    remainingSeats: releases.reduce((s, r) => s + r.remainingSeats, 0),
  };

  await prisma.flight.create({
    data: {
      airline: data.airline,
      flightNumber: data.flightNumber.toUpperCase(),
      origin: data.origin,
      destination: data.destination,
      departureAt,
      arrivalAt,
      cabinClass: data.cabinClass,
      currency: "AUD",
      totalSeats: totals.totalSeats,
      remainingSeats: totals.remainingSeats,
      active: true,
      fareReleases: {
        create: releases.map((r) => ({
          name: r.name,
          sortOrder: r.sortOrder,
          totalSeats: r.totalSeats,
          remainingSeats: r.remainingSeats,
          priceCents: r.priceCents,
          active: true,
        })),
      },
    },
  });

  revalidatePath("/admin");
  revalidatePath("/flights");
  redirect("/admin?tab=flights&saved=added");
}

export async function updateFlightAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin?tab=form&error=Missing+flight");

  const parsed = flightFormSchema.safeParse({
    airline: formData.get("airline"),
    flightNumber: formData.get("flightNumber"),
    origin: formData.get("origin"),
    destination: formData.get("destination"),
    departureAt: formData.get("departureAt"),
    arrivalAt: formData.get("arrivalAt"),
    cabinClass: formData.get("cabinClass"),
  });

  if (!parsed.success) {
    redirectFormError(parsed.error.issues[0]?.message ?? "Invalid flight");
  }

  const data = parsed.data;
  let departureAt: Date;
  let arrivalAt: Date;
  try {
    departureAt = parseDateTimeLocal(data.departureAt);
    arrivalAt = parseDateTimeLocal(data.arrivalAt);
  } catch {
    redirectFormError("Invalid departure or arrival time");
  }

  let releases;
  try {
    releases = parseFareReleasesFromForm(formData);
  } catch (e) {
    redirectFormError(e instanceof Error ? e.message : "Invalid fare releases");
  }

  const totals = {
    totalSeats: totalSeatsFromReleases(releases),
    remainingSeats: releases.reduce((s, r) => s + r.remainingSeats, 0),
  };

  await prisma.$transaction(async (tx) => {
    await tx.fareRelease.deleteMany({ where: { flightId: id } });
    await tx.flight.update({
      where: { id },
      data: {
        airline: data.airline,
        flightNumber: data.flightNumber.toUpperCase(),
        origin: data.origin,
        destination: data.destination,
        departureAt,
        arrivalAt,
        cabinClass: data.cabinClass,
        totalSeats: totals.totalSeats,
        remainingSeats: totals.remainingSeats,
        active: true,
        fareReleases: {
          create: releases.map((r) => ({
            name: r.name,
            sortOrder: r.sortOrder,
            totalSeats: r.totalSeats,
            remainingSeats: r.remainingSeats,
            priceCents: r.priceCents,
            active: true,
          })),
        },
      },
    });
  });

  revalidatePath("/admin");
  revalidatePath("/flights");
  redirect("/admin?tab=flights&saved=updated");
}

/** Quick price update for one fare release. */
export async function updateFarePriceAction(formData: FormData) {
  await requireAdmin();

  const parsed = z
    .object({
      id: z.string().min(1),
      priceAud: z.coerce.number().min(0),
    })
    .safeParse({
      id: formData.get("id"),
      priceAud: formData.get("priceAud"),
    });

  if (!parsed.success) {
    redirect(
      `/admin?tab=flights&error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid price")}`,
    );
  }

  await prisma.fareRelease.update({
    where: { id: parsed.data.id },
    data: { priceCents: Math.round(parsed.data.priceAud * 100) },
  });

  revalidatePath("/admin");
  revalidatePath("/flights");
  redirect("/admin?tab=flights&saved=price");
}

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

export async function deleteFlightAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin?error=Missing+flight");

  const bookings = await prisma.booking.count({
    where: { OR: [{ flightId: id }, { returnFlightId: id }] },
  });
  if (bookings > 0) {
    redirect(
      "/admin?tab=flights&error=Cannot+delete+forever+—+this+flight+has+bookings.+Remove+it+from+the+site+instead.",
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

export async function getDefaultFareTemplateAction(cabin: string) {
  return fareTemplateForCabin(cabin);
}
