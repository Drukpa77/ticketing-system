import Link from "next/link";
import { SearchForm } from "@/components/SearchForm";
import { prisma } from "@/lib/db";
import {
  airportCity,
  airportLabel,
  buildAirportOptions,
} from "@/lib/format";
import { formatAud } from "@/lib/pricing";

function defaultSearchDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

async function getSearchAirports() {
  const flights = await prisma.flight.findMany({
    where: { active: true },
    select: { origin: true, destination: true },
  });

  const codes = flights.flatMap((f) => [f.origin, f.destination]);
  return buildAirportOptions(codes);
}

async function getPopularRoutes() {
  const flights = await prisma.flight.findMany({
    where: { active: true },
    select: {
      origin: true,
      destination: true,
      remainingSeats: true,
      totalSeats: true,
      fareReleases: {
        where: { active: true, remainingSeats: { gt: 0 }, priceCents: { gt: 0 } },
        orderBy: { sortOrder: "asc" },
        take: 1,
        select: { priceCents: true },
      },
    },
  });

  const byRoute = new Map<
    string,
    {
      origin: string;
      destination: string;
      fromCents: number;
      flightCount: number;
      lowStock: boolean;
    }
  >();

  for (const flight of flights) {
    const price = flight.fareReleases[0]?.priceCents;
    if (!price) continue;
    const key = `${flight.origin}-${flight.destination}`;
    const existing = byRoute.get(key);
    const lowStock = flight.remainingSeats / flight.totalSeats <= 0.2;
    if (!existing) {
      byRoute.set(key, {
        origin: flight.origin,
        destination: flight.destination,
        fromCents: price,
        flightCount: 1,
        lowStock,
      });
    } else {
      existing.flightCount += 1;
      existing.fromCents = Math.min(existing.fromCents, price);
      existing.lowStock = existing.lowStock || lowStock;
    }
  }

  return [...byRoute.values()]
    .sort((a, b) => a.fromCents - b.fromCents)
    .slice(0, 6);
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const [routes, airports] = await Promise.all([
    getPopularRoutes().catch(() => []),
    getSearchAirports().catch(() => []),
  ]);
  const depart = defaultSearchDate(3);

  return (
    <main className="flex-1">
      {/* Hero — one composition */}
      <section className="relative isolate min-h-[100svh] overflow-hidden bg-accent-deep text-white">
        <div
          aria-hidden
          className="home-drift pointer-events-none absolute inset-[-8%]"
          style={{
            backgroundImage: `
              radial-gradient(ellipse at 18% 18%, rgba(90, 190, 140, 0.45), transparent 42%),
              radial-gradient(ellipse at 88% 12%, rgba(255, 255, 255, 0.12), transparent 35%),
              linear-gradient(160deg, #0c2920 0%, #145c40 45%, #1a6b4a 70%, #0f3d2e 100%)
            `,
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.09) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage:
              "radial-gradient(ellipse at center, black 20%, transparent 75%)",
          }}
        />
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-[18%] hidden h-40 w-full text-white/35 sm:block"
          viewBox="0 0 1200 160"
          fill="none"
        >
          <path
            className="home-route-line"
            d="M80 110 C 260 20, 420 150, 600 70 S 940 20, 1120 95"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <circle cx="80" cy="110" r="4" fill="currentColor" />
          <circle cx="1120" cy="95" r="4" fill="currentColor" />
        </svg>

        <div className="relative mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col justify-end px-4 pb-10 pt-28 sm:px-6 sm:pb-14 lg:justify-center lg:pb-20">
          <div className="max-w-2xl">
            <p className="home-rise font-[family-name:var(--font-syne)] text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
              Travel Agent
            </p>
            <h1 className="home-rise home-rise-delay-1 mt-4 max-w-xl font-[family-name:var(--font-syne)] text-2xl font-medium leading-snug tracking-tight text-white/95 sm:text-3xl">
              Book flights with fares that move when demand does.
            </h1>
            <p className="home-rise home-rise-delay-2 mt-4 max-w-lg text-base leading-relaxed text-white/75 sm:text-lg">
              One-way or round-trip in AUD. Live prices rise when a route gets
              busy or seats run low.
            </p>
          </div>

          <div className="home-rise home-rise-delay-3 mt-10 w-full max-w-4xl text-foreground">
            <SearchForm
              error={params.error}
              variant="hero"
              airports={airports}
            />
          </div>
        </div>
      </section>

      {/* Popular routes */}
      <section id="routes" className="border-b border-line bg-surface py-20 sm:py-24">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Popular routes
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-syne)] text-3xl font-semibold tracking-tight sm:text-4xl">
              Where people are flying
            </h2>
            <p className="mt-3 text-muted">
              Jump into a route below. Prices shown are starting ticket fares —
              the live fare can rise with interest and seat scarcity.
            </p>
          </div>

          {routes.length === 0 ? (
            <p className="mt-10 text-muted">
              No flights listed yet. Add routes in Admin to populate this board.
            </p>
          ) : (
            <ul className="mt-12 divide-y divide-line border-y border-line">
              {routes.map((route) => {
                const href = `/flights?${new URLSearchParams({
                  origin: route.origin,
                  destination: route.destination,
                  date: depart,
                  tripType: "one_way",
                }).toString()}`;
                return (
                  <li key={`${route.origin}-${route.destination}`}>
                    <Link
                      href={href}
                      className="group flex flex-col gap-3 py-5 transition sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                    >
                      <div>
                        <p className="font-[family-name:var(--font-syne)] text-xl font-semibold tracking-tight transition group-hover:text-accent sm:text-2xl">
                          {airportCity(route.origin)}
                          <span className="mx-3 text-muted">→</span>
                          {airportCity(route.destination)}
                        </p>
                        <p className="mt-1 text-sm text-muted">
                          {airportLabel(route.origin)} to{" "}
                          {airportLabel(route.destination)} · {route.flightCount}{" "}
                          flight{route.flightCount === 1 ? "" : "s"}
                          {route.lowStock ? " · limited seats" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 sm:text-right">
                        <div>
                          <p className="text-xs uppercase tracking-[0.14em] text-muted">
                            From
                          </p>
                          <p className="text-lg font-semibold">
                            {formatAud(route.fromCents)}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-accent transition group-hover:translate-x-1">
                          View →
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* How live pricing works */}
      <section id="pricing" className="bg-background py-20 sm:py-24">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Live fares
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-syne)] text-3xl font-semibold tracking-tight sm:text-4xl">
              Clear pricing that reacts in real time
            </h2>
            <p className="mt-3 text-muted">
              No surprise markup games — just a ticket price that can rise when
              the market gets busy.
            </p>
          </div>

          <ol className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {[
              {
                step: "01",
                title: "Start from the ticket price",
                body: "Every flight begins with a clear AUD fare set for that service.",
              },
              {
                step: "02",
                title: "Watch demand and seats",
                body: "More searches, holds, and bookings — or fewer seats left — gently raise the live fare.",
              },
              {
                step: "03",
                title: "Lock it at checkout",
                body: "When you book, the price holds for 15 minutes so it won’t jump mid-purchase.",
              },
            ].map((item) => (
              <li key={item.step} className="relative">
                <p className="font-[family-name:var(--font-syne)] text-5xl font-semibold text-accent/25">
                  {item.step}
                </p>
                <h3 className="mt-3 font-[family-name:var(--font-syne)] text-xl font-semibold">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {item.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Trip types */}
      <section className="border-t border-line bg-accent-deep py-20 text-white sm:py-24">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
              Trip types
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-syne)] text-3xl font-semibold tracking-tight sm:text-4xl">
              One way or round trip — same simple flow
            </h2>
          </div>
          <div className="space-y-8">
            <div>
              <h3 className="font-[family-name:var(--font-syne)] text-xl font-semibold">
                One way
              </h3>
              <p className="mt-2 text-white/70">
                Choose a single outbound flight, lock the live fare, and confirm
                in minutes.
              </p>
            </div>
            <div className="h-px bg-white/15" />
            <div>
              <h3 className="font-[family-name:var(--font-syne)] text-xl font-semibold">
                Round trip
              </h3>
              <p className="mt-2 text-white/70">
                Pick outbound, then return. Each leg is priced live and the
                total is locked together at checkout.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-line bg-surface py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="font-[family-name:var(--font-syne)] text-base font-semibold text-foreground">
            Travel Agent
          </p>
          <p>Demo ticketing for consultancy — AUD · live dynamic fares</p>
          <Link href="/admin" className="text-accent hover:underline">
            Admin dashboard
          </Link>
        </div>
      </footer>
    </main>
  );
}
