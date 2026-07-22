import { z } from "zod";

export const searchSchema = z
  .object({
    origin: z
      .string()
      .trim()
      .min(3, "Origin airport code required")
      .max(3)
      .transform((v) => v.toUpperCase()),
    destination: z
      .string()
      .trim()
      .min(3, "Destination airport code required")
      .max(3)
      .transform((v) => v.toUpperCase()),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
    tripType: z.enum(["one_way", "round_trip"]).default("one_way"),
    returnDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
      .optional()
      .or(z.literal("").transform(() => undefined)),
  })
  .superRefine((data, ctx) => {
    if (data.tripType === "round_trip") {
      if (!data.returnDate) {
        ctx.addIssue({
          code: "custom",
          message: "Return date is required for round trips",
          path: ["returnDate"],
        });
      } else if (data.returnDate < data.date) {
        ctx.addIssue({
          code: "custom",
          message: "Return date must be on or after departure",
          path: ["returnDate"],
        });
      }
    }
  });

export const bookingSchema = z.object({
  quoteId: z.string().min(1),
  passengerName: z.string().trim().min(2, "Name is required").max(120),
  email: z.string().trim().email("Valid email required"),
  seatsBooked: z.coerce.number().int().min(1).max(9).default(1),
});

export const adminLoginSchema = z.object({
  password: z.string().min(1),
});

export const flightFormSchema = z.object({
  airline: z.string().trim().min(2, "Airline is required").max(80),
  flightNumber: z.string().trim().min(2, "Flight number is required").max(16),
  origin: z
    .string()
    .trim()
    .length(3, "Use a 3-letter airport code")
    .transform((v) => v.toUpperCase()),
  destination: z
    .string()
    .trim()
    .length(3, "Use a 3-letter airport code")
    .transform((v) => v.toUpperCase()),
  departureAt: z.string().min(1, "Departure date/time required"),
  arrivalAt: z.string().min(1, "Arrival date/time required"),
  cabinClass: z.enum(["economy", "premium_economy", "business", "first"]),
  basePriceAud: z.coerce
    .number()
    .positive("Ticket price must be greater than 0")
    .max(100000),
  totalSeats: z.coerce.number().int().min(1).max(800),
  remainingSeats: z.coerce.number().int().min(0).max(800).optional(),
  active: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.null()])
    .optional(),
});
