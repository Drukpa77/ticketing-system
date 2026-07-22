"use client";

import { useState } from "react";
import { formatAud } from "@/lib/pricing";
import type {
  AnalyticsGroup,
  FlightPriceAnalytics,
  GroupedPriceAnalytics,
} from "@/lib/analytics/pricingAnalytics";

type Tab = "destination" | "cabin" | "route";

function statusLabel(status: FlightPriceAnalytics["status"]) {
  if (status === "up") return { text: "Rising", className: "text-amber-800" };
  if (status === "at_cap")
    return { text: "At max", className: "text-red-700" };
  return { text: "Steady", className: "text-muted" };
}

function driverBadge(driver: FlightPriceAnalytics["primaryDriver"]) {
  if (driver === "demand") return "Interest";
  if (driver === "scarcity") return "Low seats";
  if (driver === "both") return "Interest + seats";
  return "None";
}

function GroupCard({ group }: { group: AnalyticsGroup }) {
  const [open, setOpen] = useState(group.risingCount > 0);

  return (
    <article className="border border-line bg-surface/70">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-4 px-5 py-5 text-left transition hover:bg-white/50"
      >
        <div>
          <p className="font-[family-name:var(--font-syne)] text-xl font-semibold tracking-tight">
            {group.title}
          </p>
          <p className="mt-1 text-sm text-muted">{group.subtitle}</p>
          <p className="mt-3 text-sm text-foreground">
            <span className="font-medium">{group.topDriver}</span>
            {group.risingCount > 0
              ? ` · hottest ${group.hottestFlightLabel} (+${group.hottestUpliftPercent}%)`
              : ""}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-[family-name:var(--font-syne)] text-2xl font-semibold">
            {group.avgUpliftPercent}%
          </p>
          <p className="text-xs uppercase tracking-[0.12em] text-muted">
            avg rise
          </p>
          <p className="mt-2 text-sm text-muted">
            {group.risingCount}/{group.flightCount} rising
            {group.atCapCount > 0 ? ` · ${group.atCapCount} maxed` : ""}
          </p>
          <p className="mt-2 text-xs font-medium text-accent">
            {open ? "Hide flights" : "Show flights"}
          </p>
        </div>
      </button>

      <div className="grid gap-px border-t border-line bg-line sm:grid-cols-4">
        <Stat
          label="Avg ticket → live"
          value={`${formatAud(group.avgBasePriceCents)} → ${formatAud(group.avgLivePriceCents)}`}
        />
        <Stat label="Highest rise" value={`${group.maxUpliftPercent}%`} />
        <Stat label="Avg seats sold" value={`${group.avgSeatFillPercent}%`} />
        <Stat
          label="Recent interest"
          value={`${group.totalViews}v · ${group.totalHolds}h · ${group.totalPurchases}b`}
        />
      </div>

      {open && (
        <div className="space-y-3 border-t border-line px-5 py-5">
          {group.flights.map((row) => {
            const badge = statusLabel(row.status);
            return (
              <div
                key={row.flightId}
                className="border border-line/80 bg-white/60 px-4 py-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                  <div>
                    <p className="font-medium">
                      {row.airline} {row.flightNumber} · {row.origin}→
                      {row.destination}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.12em] text-muted">
                      {row.cabinClass.replaceAll("_", " ")} ·{" "}
                      {driverBadge(row.primaryDriver)}
                    </p>
                    <p className={`mt-1 text-sm font-medium ${badge.className}`}>
                      {badge.text}
                      {row.upliftCents > 0
                        ? ` · +${formatAud(row.upliftCents)} (${row.upliftPercent}%)`
                        : ""}
                    </p>
                  </div>
                  <div className="text-sm text-muted sm:text-right">
                    <p>
                      Ticket {formatAud(row.basePriceCents)} → Live{" "}
                      <span className="font-semibold text-foreground">
                        {formatAud(row.livePriceCents)}
                      </span>
                    </p>
                    <p>
                      {row.remainingSeats}/{row.totalSeats} seats ·{" "}
                      {row.seatFillPercent}% sold
                    </p>
                  </div>
                </div>
                <ul className="mt-3 space-y-1 border-t border-line/60 pt-3 text-sm text-muted">
                  {row.reasons.map((reason) => (
                    <li key={`${row.flightId}-${reason.label}`}>
                      <span className="font-medium text-foreground">
                        {reason.label}:
                      </span>{" "}
                      {reason.detail}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#eef5f1] px-4 py-3">
      <p className="text-xs uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

export function PricingAnalyticsSection({
  analytics,
}: {
  analytics: GroupedPriceAnalytics;
}) {
  const [tab, setTab] = useState<Tab>("destination");

  const groups =
    tab === "destination"
      ? analytics.byDestination
      : tab === "cabin"
        ? analytics.byCabin
        : analytics.byRoute;

  const tabs: { id: Tab; label: string }[] = [
    { id: "destination", label: "Destination" },
    { id: "cabin", label: "Ticket type" },
    { id: "route", label: "Route" },
  ];

  return (
    <section className="space-y-8">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Live fares
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-syne)] text-3xl font-semibold tracking-tight">
          Price analytics
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          See how fares are moving by destination, ticket type, and route — then
          open a group to learn why.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-5">
        {[
          ["Active flights", String(analytics.overall.activeFlights)],
          ["Flights rising", String(analytics.overall.risingCount)],
          ["Avg rise", `${analytics.overall.avgUpliftPercent}%`],
          ["Destinations up", String(analytics.overall.destinationsRising)],
          ["Ticket types up", String(analytics.overall.cabinTypesRising)],
        ].map(([label, value]) => (
          <div
            key={label}
            className="border border-line bg-surface/80 px-4 py-4"
          >
            <p className="text-xs uppercase tracking-[0.12em] text-muted">
              {label}
            </p>
            <p className="mt-2 font-[family-name:var(--font-syne)] text-3xl font-semibold tracking-tight">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1 border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`relative px-4 py-3 text-sm font-medium transition ${
              tab === t.id ? "text-foreground" : "text-muted hover:text-foreground"
            }`}
          >
            {t.label}
            {tab === t.id && (
              <span className="absolute inset-x-2 bottom-0 h-0.5 bg-accent" />
            )}
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <div className="border border-dashed border-line bg-surface/70 px-6 py-14 text-center text-sm text-muted">
          No active flights to analyse yet.
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <GroupCard key={group.key} group={group} />
          ))}
        </div>
      )}
    </section>
  );
}
