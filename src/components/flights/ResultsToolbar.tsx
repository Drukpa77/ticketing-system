"use client";

export type SortKey =
  | "relevant"
  | "lowest_fare"
  | "earliest"
  | "shortest";

type ResultsToolbarProps = {
  count: number;
  sortBy: SortKey;
  onSortChange: (sort: SortKey) => void;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  nonstopOnly: boolean;
  onNonstopOnlyChange: (value: boolean) => void;
  lowestFareCents: number | null;
};

export function ResultsToolbar({
  count,
  sortBy,
  onSortChange,
  filtersOpen,
  onToggleFilters,
  nonstopOnly,
  onNonstopOnlyChange,
  lowestFareCents,
}: ResultsToolbarProps) {
  return (
    <div className="border-b border-line bg-surface/80">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <p className="font-semibold text-foreground">
            {count} {count === 1 ? "Flight" : "Flights"} Found
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 font-medium text-accent transition hover:text-accent-deep"
            title="Fare calendar view coming soon"
          >
            <CalendarIcon />
            Fare Calendar
          </button>
          {lowestFareCents != null ? (
            <span className="inline-flex items-center gap-1.5 text-muted">
              <span
                className="inline-block size-0 border-x-[5px] border-b-[8px] border-x-transparent border-b-accent"
                aria-hidden
              />
              Lowest Fares
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-muted">
            <span className="sr-only">Currency</span>
            <select
              defaultValue="AUD"
              className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-foreground outline-none transition focus:border-accent"
            >
              <option value="AUD">AUD</option>
            </select>
          </label>

          <div className="relative">
            <button
              type="button"
              onClick={onToggleFilters}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                filtersOpen || nonstopOnly
                  ? "border-accent bg-white text-accent-deep"
                  : "border-line bg-white text-foreground hover:border-accent"
              }`}
            >
              <FilterIcon />
              Filters
              {nonstopOnly ? (
                <span className="rounded-full bg-accent px-1.5 text-[10px] font-bold text-white">
                  1
                </span>
              ) : null}
            </button>
            {filtersOpen ? (
              <div className="absolute right-0 z-10 mt-2 w-56 rounded-xl border border-line bg-white p-3 shadow-[0_12px_32px_rgba(16,35,28,0.12)]">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={nonstopOnly}
                    onChange={(e) => onNonstopOnlyChange(e.target.checked)}
                    className="size-4 accent-[var(--accent)]"
                  />
                  Nonstop only
                </label>
              </div>
            ) : null}
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-muted">
            <span className="whitespace-nowrap">Sort by</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortKey)}
              className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-foreground outline-none transition focus:border-accent"
            >
              <option value="relevant">Most Relevant</option>
              <option value="lowest_fare">Lowest Fare</option>
              <option value="earliest">Earliest Departure</option>
              <option value="shortest">Shortest Duration</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M3 10h18M8 3v4M16 3v4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6h16M7 12h10M10 18h4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
