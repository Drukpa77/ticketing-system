"use client";

import { useRef, useState, type ReactNode } from "react";
import { BookButton } from "@/components/BookButton";
import { FareDetailsModal } from "@/components/fares/FareDetailsModal";
import {
  BaggageIcon,
  CalendarIcon,
  CoinIcon,
  PlaneMilesIcon,
  SeatIcon,
} from "@/components/fares/FareIcons";
import type { FareProduct } from "@/lib/fares/products";
import { formatAud } from "@/lib/pricing";

type FareComparisonRowProps = {
  products: FareProduct[];
  flightId: string;
  returnFlightId?: string;
  supportEmail: string;
  disabled?: boolean;
};

export function FareComparisonRow({
  products,
  flightId,
  returnFlightId,
  supportEmail,
  disabled,
}: FareComparisonRowProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const activeProduct =
    products.find((p) => p.id === detailsId) ?? null;

  function scrollNext() {
    scrollerRef.current?.scrollBy({ left: 280, behavior: "smooth" });
  }

  return (
    <section className="relative">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-syne)] text-2xl font-semibold tracking-tight">
            Choose your fare
          </h2>
          <p className="mt-1 text-sm text-muted">
            Compare flexibility, baggage, and miles — then select a fare to
            continue.
          </p>
        </div>
        <button
          type="button"
          onClick={scrollNext}
          aria-label="Scroll fare options"
          className="hidden size-10 shrink-0 items-center justify-center rounded-full border border-line bg-white text-lg text-muted shadow-sm transition hover:border-accent hover:text-accent md:inline-flex"
        >
          ›
        </button>
      </div>

      <div className="relative">
        <div
          ref={scrollerRef}
          className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {products.map((product) => (
            <FareCard
              key={product.id}
              product={product}
              flightId={flightId}
              returnFlightId={returnFlightId}
              disabled={disabled || !product.available}
              onMoreDetails={() => setDetailsId(product.id)}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={scrollNext}
          aria-label="More fares"
          className="absolute -right-1 top-1/2 z-10 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-lg text-muted shadow-[0_8px_20px_rgba(16,35,28,0.12)] transition hover:border-accent hover:text-accent md:hidden"
        >
          ›
        </button>
      </div>

      <FareDetailsModal
        open={Boolean(activeProduct)}
        product={activeProduct}
        supportEmail={supportEmail}
        onClose={() => setDetailsId(null)}
      />
    </section>
  );
}

function FareCard({
  product,
  flightId,
  returnFlightId,
  disabled,
  onMoreDetails,
}: {
  product: FareProduct;
  flightId: string;
  returnFlightId?: string;
  disabled?: boolean;
  onMoreDetails: () => void;
}) {
  return (
    <article
      className={`relative flex w-[min(100%,17.5rem)] shrink-0 flex-col rounded-2xl bg-white p-5 shadow-[0_10px_28px_rgba(16,35,28,0.06)] transition ${
        product.mostPopular
          ? "border-2 border-accent pt-9"
          : "border border-line"
      }`}
    >
      {product.mostPopular ? (
        <div className="absolute inset-x-0 top-0 rounded-t-[14px] bg-accent px-3 py-1.5 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-white">
          Most Popular
        </div>
      ) : null}

      <p className="text-sm font-bold uppercase tracking-[0.14em] text-foreground">
        {product.name}
      </p>
      <p className="mt-1 text-sm text-muted">{product.cabinLabel}</p>
      <div className="my-4 h-px bg-line" />
      <p className="font-[family-name:var(--font-syne)] text-3xl font-bold tracking-tight text-foreground">
        {product.available ? formatAud(product.priceCents) : "TBA"}
      </p>

      <div className="mt-4">
        {disabled ? (
          <button
            type="button"
            disabled
            className="w-full rounded-full bg-line/70 px-4 py-3 text-sm font-semibold text-muted"
          >
            Unavailable
          </button>
        ) : (
          <BookButton
            flightId={flightId}
            returnFlightId={returnFlightId}
            label="Select Fares"
            buttonClassName={
              product.mostPopular
                ? "w-full rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent-deep disabled:cursor-not-allowed disabled:bg-zinc-400"
                : "w-full rounded-full bg-accent/15 px-4 py-3 text-sm font-semibold text-accent-deep transition hover:bg-accent/25 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-muted"
            }
          />
        )}
      </div>

      <ul className="mt-5 space-y-3 text-sm">
        <RuleRow
          icon={<CalendarIcon className="text-accent" />}
          label="Flight/Date Change"
          value={product.highlights.flightChange}
        />
        <RuleRow
          icon={<CoinIcon className="text-accent" />}
          label="Refund"
          value={product.highlights.refund}
        />
        <RuleRow
          icon={<BaggageIcon className="text-accent" />}
          label="Checked Baggage"
          value={product.highlights.baggage}
        />
        <RuleRow
          icon={<SeatIcon className="text-accent" />}
          label="Seat Selection"
          value={product.highlights.seatSelection}
        />
        <RuleRow
          icon={<PlaneMilesIcon className="text-accent" />}
          label="Miles"
          value={product.highlights.miles}
        />
      </ul>

      <button
        type="button"
        onClick={onMoreDetails}
        className="mt-5 text-left text-sm font-semibold text-accent transition hover:text-accent-deep"
      >
        More Details →
      </button>
    </article>
  );
}

function RuleRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-muted">{label}</span>
        <span className="font-medium text-foreground">{value}</span>
      </span>
    </li>
  );
}
