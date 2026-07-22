"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createFlightAction,
  deleteFlightAction,
  removeFlightAction,
  restoreFlightAction,
  updateFlightAction,
  updateTicketPriceAction,
} from "@/lib/actions/admin";
import type { GroupedPriceAnalytics } from "@/lib/analytics/pricingAnalytics";
import { PricingAnalyticsSection } from "@/components/PricingAnalyticsSection";
import { toDateTimeLocalValue } from "@/lib/datetime";
import { formatAud } from "@/lib/pricing";

type CabinClass = "economy" | "premium_economy" | "business" | "first";
type TripType = "one_way" | "round_trip";

type FlightRow = {
  id: string;
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureAt: string;
  arrivalAt: string;
  cabinClass: CabinClass;
  basePriceCents: number;
  totalSeats: number;
  remainingSeats: number;
  active: boolean;
};

type BookingRow = {
  id: string;
  bookingRef: string;
  tripType: TripType;
  passengerName: string;
  amountPaidCents: number;
  flight: {
    flightNumber: string;
    origin: string;
    destination: string;
  };
  returnFlight: {
    flightNumber: string;
    origin: string;
    destination: string;
  } | null;
};

type Tab = "analytics" | "flights" | "form" | "bookings";

const TABS: { id: Tab; label: string }[] = [
  { id: "analytics", label: "Analytics" },
  { id: "flights", label: "Flights" },
  { id: "form", label: "Add / Edit" },
  { id: "bookings", label: "Bookings" },
];

const fieldClass =
  "w-full border-0 border-b border-line bg-transparent py-3 text-sm text-foreground outline-none transition focus:border-accent";

export function AdminDashboard({
  flights,
  bookings,
  analytics,
  initialTab,
  savedMessage,
  errorMessage,
}: {
  flights: FlightRow[];
  bookings: BookingRow[];
  analytics: GroupedPriceAnalytics;
  initialTab?: Tab;
  savedMessage?: string | null;
  errorMessage?: string | null;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(initialTab ?? "analytics");
  const [editingId, setEditingId] = useState<string | null>(null);

  const editing = useMemo(
    () => flights.find((f) => f.id === editingId) ?? null,
    [flights, editingId],
  );

  const activeCount = flights.filter((f) => f.active).length;

  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  function openAdd() {
    setEditingId(null);
    setTab("form");
  }

  function openEdit(id: string) {
    setEditingId(id);
    setTab("form");
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <nav className="flex flex-wrap gap-1 border-b border-line">
          {TABS.map((item) => {
            const active = tab === item.id;
            const label =
              item.id === "form"
                ? editing
                  ? "Edit flight"
                  : "Add flight"
                : item.label;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === "form" && !editingId) openAdd();
                  else setTab(item.id);
                }}
                className={`relative px-4 py-3 text-sm font-medium transition ${
                  active
                    ? "text-foreground"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {label}
                {active && (
                  <span className="absolute inset-x-2 bottom-0 h-0.5 bg-accent" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
          <p>
            <span className="font-semibold text-foreground">{activeCount}</span>{" "}
            live · {flights.length} total
          </p>
          <p>
            <span className="font-semibold text-foreground">
              {bookings.length}
            </span>{" "}
            recent bookings
          </p>
        </div>
      </div>

      {savedMessage && (
        <p className="border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent-deep">
          {savedMessage}
        </p>
      )}
      {errorMessage && (
        <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      )}

      {tab === "analytics" && (
        <PricingAnalyticsSection analytics={analytics} />
      )}

      {tab === "flights" && (
        <section className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-[family-name:var(--font-syne)] text-2xl font-semibold tracking-tight">
                Flight inventory
              </h2>
              <p className="mt-1 max-w-xl text-sm text-muted">
                Set starting ticket prices and keep routes visible to customers.
                Round trips need both directions listed.
              </p>
            </div>
            <button
              type="button"
              onClick={openAdd}
              className="bg-accent-deep px-5 py-3 text-sm font-semibold tracking-wide text-white transition hover:bg-accent"
            >
              Add flight
            </button>
          </div>

          {flights.length === 0 ? (
            <div className="border border-dashed border-line bg-surface/70 px-6 py-14 text-center">
              <p className="font-[family-name:var(--font-syne)] text-xl font-semibold">
                No flights yet
              </p>
              <p className="mt-2 text-sm text-muted">
                Add your first route to start selling.
              </p>
              <button
                type="button"
                onClick={openAdd}
                className="mt-6 border border-line px-4 py-2 text-sm font-medium transition hover:border-accent"
              >
                Create a flight
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-line border-y border-line bg-surface/60">
              {flights.map((f) => (
                <li key={f.id} className="px-4 py-5 sm:px-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <p className="font-[family-name:var(--font-syne)] text-lg font-semibold tracking-tight">
                          {f.airline} {f.flightNumber}
                        </p>
                        <span
                          className={`text-xs font-medium uppercase tracking-[0.12em] ${
                            f.active ? "text-accent" : "text-red-700"
                          }`}
                        >
                          {f.active ? "Live" : "Hidden"}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">
                        {f.origin} → {f.destination}
                        <span className="text-muted">
                          {" "}
                          · {f.cabinClass.replaceAll("_", " ")}
                        </span>
                      </p>
                      <p className="text-sm text-muted">
                        {f.remainingSeats}/{f.totalSeats} seats · ticket{" "}
                        {formatAud(f.basePriceCents)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                      <button
                        type="button"
                        onClick={() => openEdit(f.id)}
                        className="font-medium text-accent transition hover:text-accent-deep"
                      >
                        Edit details
                      </button>
                      {f.active ? (
                        <form action={removeFlightAction}>
                          <input type="hidden" name="id" value={f.id} />
                          <button
                            type="submit"
                            className="text-muted transition hover:text-red-700"
                          >
                            Remove
                          </button>
                        </form>
                      ) : (
                        <form action={restoreFlightAction}>
                          <input type="hidden" name="id" value={f.id} />
                          <button
                            type="submit"
                            className="text-muted transition hover:text-accent"
                          >
                            Restore
                          </button>
                        </form>
                      )}
                      <form action={deleteFlightAction}>
                        <input type="hidden" name="id" value={f.id} />
                        <button
                          type="submit"
                          className="text-muted/70 transition hover:text-foreground"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>

                  <form
                    action={updateTicketPriceAction}
                    className="mt-4 flex flex-wrap items-end gap-3 border-t border-line/70 pt-4"
                  >
                    <input type="hidden" name="id" value={f.id} />
                    <label className="space-y-1 text-sm">
                      <span className="text-xs uppercase tracking-[0.14em] text-muted">
                        Ticket price (AUD)
                      </span>
                      <input
                        name="basePriceAud"
                        type="number"
                        min={1}
                        step={0.01}
                        required
                        defaultValue={(f.basePriceCents / 100).toFixed(2)}
                        className="w-40 border border-line bg-white px-3 py-2 outline-none focus:border-accent"
                      />
                    </label>
                    <button
                      type="submit"
                      className="bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-deep"
                    >
                      Update price
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "form" && (
        <section className="border border-line bg-surface/80 p-6 sm:p-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              {editing ? "Edit" : "New"}
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-syne)] text-3xl font-semibold tracking-tight">
              {editing ? "Edit flight" : "Add a flight"}
            </h2>
            <p className="mt-2 text-sm text-muted">
              Enter the route basics and starting ticket price. Live fares
              adjust automatically from there.
            </p>
          </div>

          <form
            key={editing?.id ?? "new"}
            action={editing ? updateFlightAction : createFlightAction}
            className="mt-8 grid max-w-3xl gap-6 sm:grid-cols-2"
          >
            {editing && <input type="hidden" name="id" value={editing.id} />}

            <label className="space-y-1 text-sm">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
                Airline
              </span>
              <input
                name="airline"
                required
                defaultValue={editing?.airline ?? ""}
                placeholder="Qantas"
                className={fieldClass}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
                Flight number
              </span>
              <input
                name="flightNumber"
                required
                defaultValue={editing?.flightNumber ?? ""}
                placeholder="QF401"
                className={fieldClass}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
                From
              </span>
              <input
                name="origin"
                required
                maxLength={3}
                defaultValue={editing?.origin ?? ""}
                placeholder="SYD"
                className={`${fieldClass} uppercase`}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
                To
              </span>
              <input
                name="destination"
                required
                maxLength={3}
                defaultValue={editing?.destination ?? ""}
                placeholder="MEL"
                className={`${fieldClass} uppercase`}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
                Leaves at
              </span>
              <input
                name="departureAt"
                type="datetime-local"
                required
                defaultValue={
                  editing
                    ? toDateTimeLocalValue(new Date(editing.departureAt))
                    : ""
                }
                className={fieldClass}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
                Arrives at
              </span>
              <input
                name="arrivalAt"
                type="datetime-local"
                required
                defaultValue={
                  editing
                    ? toDateTimeLocalValue(new Date(editing.arrivalAt))
                    : ""
                }
                className={fieldClass}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
                Ticket type
              </span>
              <select
                name="cabinClass"
                defaultValue={editing?.cabinClass ?? "economy"}
                className={fieldClass}
              >
                <option value="economy">Economy</option>
                <option value="premium_economy">Premium economy</option>
                <option value="business">Business</option>
                <option value="first">First</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
                Ticket price (AUD)
              </span>
              <input
                name="basePriceAud"
                type="number"
                min={1}
                step={0.01}
                required
                defaultValue={
                  editing ? (editing.basePriceCents / 100).toFixed(2) : ""
                }
                placeholder="189.00"
                className={fieldClass}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
                How many seats
              </span>
              <input
                name="totalSeats"
                type="number"
                min={1}
                required
                defaultValue={editing?.totalSeats ?? 180}
                className={fieldClass}
              />
            </label>
            {editing && (
              <label className="space-y-1 text-sm">
                <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
                  Seats still for sale
                </span>
                <input
                  name="remainingSeats"
                  type="number"
                  min={0}
                  required
                  defaultValue={editing.remainingSeats}
                  className={fieldClass}
                />
              </label>
            )}

            <div className="flex flex-wrap gap-3 sm:col-span-2">
              <button
                type="submit"
                className="bg-accent-deep px-5 py-3 text-sm font-semibold tracking-wide text-white transition hover:bg-accent"
              >
                {editing ? "Save changes" : "Publish flight"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setTab("flights");
                  router.replace("/admin?tab=flights");
                }}
                className="border border-line px-5 py-3 text-sm font-medium text-muted transition hover:border-accent hover:text-foreground"
              >
                Back to flights
              </button>
            </div>
          </form>
        </section>
      )}

      {tab === "bookings" && (
        <section className="space-y-6">
          <div>
            <h2 className="font-[family-name:var(--font-syne)] text-2xl font-semibold tracking-tight">
              Recent bookings
            </h2>
            <p className="mt-1 text-sm text-muted">
              Latest customer confirmations from the public booking flow.
            </p>
          </div>

          {bookings.length === 0 ? (
            <div className="border border-dashed border-line bg-surface/70 px-6 py-14 text-center text-sm text-muted">
              No bookings yet.
            </div>
          ) : (
            <div className="overflow-x-auto border-y border-line bg-surface/60">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-xs uppercase tracking-[0.12em] text-muted">
                    <th className="px-4 py-3 font-medium">Ref</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Flights</th>
                    <th className="px-4 py-3 font-medium">Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id} className="border-b border-line/70">
                      <td className="px-4 py-4 font-medium">{b.bookingRef}</td>
                      <td className="px-4 py-4 text-muted">
                        {b.tripType === "round_trip" ? "Round trip" : "One way"}
                      </td>
                      <td className="px-4 py-4">{b.passengerName}</td>
                      <td className="px-4 py-4 text-muted">
                        {b.flight.flightNumber} {b.flight.origin}→
                        {b.flight.destination}
                        {b.returnFlight
                          ? ` · ${b.returnFlight.flightNumber} ${b.returnFlight.origin}→${b.returnFlight.destination}`
                          : ""}
                      </td>
                      <td className="px-4 py-4 font-medium">
                        {formatAud(b.amountPaidCents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
