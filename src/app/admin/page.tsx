import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/AdminDashboard";
import { getFlightPriceAnalytics } from "@/lib/analytics/pricingAnalytics";
import { prisma } from "@/lib/db";
import { adminLoginSchema } from "@/lib/validation";

const ADMIN_COOKIE = "ts_admin";

async function isAdminAuthed() {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  return token === password;
}

function parseTab(
  value?: string,
): "analytics" | "flights" | "form" | "bookings" | undefined {
  if (
    value === "analytics" ||
    value === "flights" ||
    value === "form" ||
    value === "bookings"
  ) {
    return value;
  }
  return undefined;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    saved?: string;
    tab?: string;
  }>;
}) {
  const params = await searchParams;
  const authed = await isAdminAuthed();

  async function login(formData: FormData) {
    "use server";
    const parsed = adminLoginSchema.safeParse({
      password: formData.get("password"),
    });
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) {
      redirect("/admin?error=ADMIN_PASSWORD+is+not+configured");
    }
    if (!parsed.success || parsed.data.password !== expected) {
      redirect("/admin?error=Invalid+password");
    }
    const jar = await cookies();
    jar.set(ADMIN_COOKIE, expected, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    redirect("/admin?tab=flights");
  }

  async function logout() {
    "use server";
    const jar = await cookies();
    jar.delete(ADMIN_COOKIE);
    redirect("/admin");
  }

  if (!authed) {
    return (
      <main className="relative flex min-h-[calc(100svh-4rem)] items-center justify-center overflow-hidden px-4 py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(ellipse at 15% 20%, rgba(26, 107, 74, 0.18), transparent 45%),
              radial-gradient(ellipse at 85% 80%, rgba(15, 61, 46, 0.12), transparent 40%),
              linear-gradient(165deg, #e9f0ec 0%, #f4f8f6 55%, #dde8e2 100%)
            `,
          }}
        />
        <div className="relative w-full max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Travel Agent
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-syne)] text-4xl font-semibold tracking-tight text-foreground">
            Operations
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Sign in to manage flights, ticket prices, and live fare analytics.
          </p>
          <form
            action={login}
            className="mt-8 space-y-5 border border-line bg-surface/90 p-6 backdrop-blur-sm"
          >
            <label className="block space-y-2 text-sm">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
                Password
              </span>
              <input
                type="password"
                name="password"
                placeholder="Enter admin password"
                required
                className="w-full border-0 border-b border-line bg-transparent py-3 outline-none transition focus:border-accent"
              />
            </label>
            <button
              type="submit"
              className="w-full bg-accent-deep py-3.5 text-sm font-semibold tracking-wide text-white transition hover:bg-accent"
            >
              Enter dashboard
            </button>
          </form>
          {params.error && (
            <p className="mt-4 text-sm text-red-700">
              {decodeURIComponent(params.error)}
            </p>
          )}
        </div>
      </main>
    );
  }

  const [flights, bookings, analytics] = await Promise.all([
    prisma.flight.findMany({
      orderBy: [{ active: "desc" }, { departureAt: "asc" }],
    }),
    prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { flight: true, returnFlight: true },
    }),
    getFlightPriceAnalytics(),
  ]);

  const savedMessage =
    params.saved === "added"
      ? "Flight added — customers can now see it."
      : params.saved === "updated"
        ? "Flight details saved."
        : params.saved === "price"
          ? "Ticket price updated."
          : params.saved === "removed"
            ? "Flight removed from the website."
            : params.saved === "restored"
              ? "Flight is visible to customers again."
              : params.saved === "deleted"
                ? "Flight deleted permanently."
                : null;

  const initialTab =
    parseTab(params.tab) ??
    (params.saved === "added" ||
    params.saved === "updated" ||
    params.saved === "price" ||
    params.saved === "removed" ||
    params.saved === "restored" ||
    params.saved === "deleted"
      ? "flights"
      : "analytics");

  return (
    <main className="relative min-h-[calc(100svh-4rem)] overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 10% 0%, rgba(26, 107, 74, 0.14), transparent 42%),
            radial-gradient(ellipse at 90% 20%, rgba(15, 61, 46, 0.08), transparent 36%),
            linear-gradient(180deg, #e9f0ec 0%, #f4f8f6 40%, #e9f0ec 100%)
          `,
        }}
      />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="flex flex-col gap-6 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Travel Agent · Operations
            </p>
            <h1 className="mt-3 font-[family-name:var(--font-syne)] text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Dashboard
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
              Publish flights, set ticket prices, and watch live fares move by
              destination and ticket type.
            </p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="border border-line bg-surface px-4 py-2.5 text-sm font-medium text-muted transition hover:border-accent hover:text-foreground"
            >
              Sign out
            </button>
          </form>
        </div>

        <div className="pt-8">
          <AdminDashboard
            initialTab={initialTab}
            savedMessage={savedMessage}
            errorMessage={
              params.error ? decodeURIComponent(params.error) : null
            }
            analytics={analytics}
            flights={flights.map((f) => ({
              id: f.id,
              airline: f.airline,
              flightNumber: f.flightNumber,
              origin: f.origin,
              destination: f.destination,
              departureAt: f.departureAt.toISOString(),
              arrivalAt: f.arrivalAt.toISOString(),
              cabinClass: f.cabinClass,
              basePriceCents: f.basePriceCents,
              totalSeats: f.totalSeats,
              remainingSeats: f.remainingSeats,
              active: f.active,
            }))}
            bookings={bookings.map((b) => ({
              id: b.id,
              bookingRef: b.bookingRef,
              tripType: b.tripType,
              passengerName: b.passengerName,
              amountPaidCents: b.amountPaidCents,
              flight: {
                flightNumber: b.flight.flightNumber,
                origin: b.flight.origin,
                destination: b.flight.destination,
              },
              returnFlight: b.returnFlight
                ? {
                    flightNumber: b.returnFlight.flightNumber,
                    origin: b.returnFlight.origin,
                    destination: b.returnFlight.destination,
                  }
                : null,
            }))}
          />
        </div>
      </div>
    </main>
  );
}
