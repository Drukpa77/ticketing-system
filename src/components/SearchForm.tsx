"use client";

import { useMemo, useState } from "react";
import type { AirportOption } from "@/lib/format";

function defaultDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

const fieldClass =
  "w-full appearance-none border-0 border-b border-line bg-transparent px-0 py-3 text-base text-foreground outline-none transition focus:border-accent";

export function SearchForm({
  error,
  variant = "default",
  airports,
}: {
  error?: string;
  variant?: "default" | "hero";
  airports: AirportOption[];
}) {
  const [tripType, setTripType] = useState<"one_way" | "round_trip">("one_way");
  const defaultOrigin =
    airports.find((a) => a.code === "SYD")?.code ?? airports[0]?.code ?? "";
  const defaultDestination =
    airports.find((a) => a.code === "MEL" && a.code !== defaultOrigin)?.code ??
    airports.find((a) => a.code !== defaultOrigin)?.code ??
    "";

  const [origin, setOrigin] = useState(defaultOrigin);
  const [destination, setDestination] = useState(defaultDestination);
  const isHero = variant === "hero";

  const destinationOptions = useMemo(
    () => airports.filter((a) => a.code !== origin),
    [airports, origin],
  );

  return (
    <form
      id="search"
      action="/flights"
      method="get"
      className={
        isHero
          ? "space-y-6 bg-surface/95 p-5 shadow-[0_24px_60px_rgba(16,35,28,0.18)] backdrop-blur-sm sm:p-7"
          : "space-y-4 border border-line bg-surface p-6"
      }
    >
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["one_way", "One way"],
            ["round_trip", "Round trip"],
          ] as const
        ).map(([value, label]) => {
          const active = tripType === value;
          return (
            <label
              key={value}
              className={`cursor-pointer px-4 py-2 text-sm font-medium transition ${
                active
                  ? "bg-accent-deep text-white"
                  : "bg-white text-muted hover:text-foreground"
              }`}
            >
              <input
                type="radio"
                name="tripType"
                value={value}
                checked={active}
                onChange={() => setTripType(value)}
                className="sr-only"
              />
              {label}
            </label>
          );
        })}
      </div>

      <div
        className={`grid gap-5 ${
          tripType === "round_trip"
            ? "sm:grid-cols-2 lg:grid-cols-5"
            : "sm:grid-cols-2 lg:grid-cols-4"
        }`}
      >
        <div className="space-y-1">
          <label
            htmlFor="origin"
            className="text-xs font-medium uppercase tracking-[0.14em] text-muted"
          >
            From
          </label>
          <select
            id="origin"
            name="origin"
            required
            value={origin}
            onChange={(e) => {
              const next = e.target.value;
              setOrigin(next);
              if (next === destination) {
                const fallback = airports.find((a) => a.code !== next)?.code ?? "";
                setDestination(fallback);
              }
            }}
            className={fieldClass}
          >
            {airports.length === 0 ? (
              <option value="">No airports available</option>
            ) : (
              airports.map((airport) => (
                <option key={airport.code} value={airport.code}>
                  {airport.label}
                </option>
              ))
            )}
          </select>
        </div>
        <div className="space-y-1">
          <label
            htmlFor="destination"
            className="text-xs font-medium uppercase tracking-[0.14em] text-muted"
          >
            To
          </label>
          <select
            id="destination"
            name="destination"
            required
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className={fieldClass}
          >
            {destinationOptions.length === 0 ? (
              <option value="">No destinations available</option>
            ) : (
              destinationOptions.map((airport) => (
                <option key={airport.code} value={airport.code}>
                  {airport.label}
                </option>
              ))
            )}
          </select>
        </div>
        <div className="space-y-1">
          <label
            htmlFor="date"
            className="text-xs font-medium uppercase tracking-[0.14em] text-muted"
          >
            Depart
          </label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={defaultDate(3)}
            required
            className={fieldClass}
          />
        </div>
        {tripType === "round_trip" && (
          <div className="space-y-1">
            <label
              htmlFor="returnDate"
              className="text-xs font-medium uppercase tracking-[0.14em] text-muted"
            >
              Return
            </label>
            <input
              id="returnDate"
              name="returnDate"
              type="date"
              defaultValue={defaultDate(7)}
              required
              className={fieldClass}
            />
          </div>
        )}
        <div className="flex items-end">
          <button
            type="submit"
            disabled={airports.length < 2}
            className="w-full bg-accent px-4 py-3.5 text-sm font-semibold tracking-wide text-white transition hover:bg-accent-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            Search flights
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-700">{decodeURIComponent(error)}</p>
      )}
    </form>
  );
}
