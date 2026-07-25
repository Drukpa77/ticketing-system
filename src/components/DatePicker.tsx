"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;

function toIso(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseIso(iso: string): Date | null {
  if (!iso) return null;
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, delta: number) {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDisplay(iso: string) {
  const d = parseIso(iso);
  if (!d) return "Select date";
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  }).format(d);
}

function buildCalendarDays(month: Date) {
  const first = startOfMonth(month);
  // Monday-first grid
  const weekday = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - weekday);

  const days: Date[] = [];
  for (let i = 0; i < 42; i += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    days.push(day);
  }
  return days;
}

type DatePickerProps = {
  name: string;
  value: string;
  onChange: (value: string) => void;
  label: string;
  required?: boolean;
  min?: string;
  /** Visual shell around the trigger (panel card vs underline field). */
  variant?: "card" | "field";
  className?: string;
  id?: string;
};

export function DatePicker({
  name,
  value,
  onChange,
  label,
  required,
  min,
  variant = "card",
  className = "",
  id,
}: DatePickerProps) {
  const autoId = useId();
  const triggerId = id ?? autoId;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = parseIso(value);
  const minDate = parseIso(min ?? "");
  const today = useMemo(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
  }, []);

  const [viewMonth, setViewMonth] = useState(() =>
    startOfMonth(selected ?? today),
  );

  useEffect(() => {
    if (open) {
      setViewMonth(startOfMonth(selected ?? minDate ?? today));
    }
  }, [open, selected, minDate, today]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const days = useMemo(() => buildCalendarDays(viewMonth), [viewMonth]);
  const monthLabel = new Intl.DateTimeFormat("en-AU", {
    month: "long",
    year: "numeric",
  }).format(viewMonth);

  function pick(day: Date) {
    if (minDate && day < minDate) return;
    onChange(toIso(day));
    setOpen(false);
  }

  const trigger =
    variant === "card" ? (
      <button
        type="button"
        id={triggerId}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        className={`relative flex min-h-[5.5rem] w-full min-w-0 flex-col items-center justify-center px-4 py-3 text-center transition ${
          open ? "bg-[linear-gradient(180deg,rgba(37,99,235,0.06),transparent)]" : ""
        } ${className}`}
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          {label}
        </span>
        <span className="mt-1 flex items-center gap-2 text-sm font-semibold text-foreground">
          <CalendarGlyph className="text-accent" />
          {formatDisplay(value)}
        </span>
      </button>
    ) : (
      <button
        type="button"
        id={triggerId}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full min-w-0 items-center justify-between gap-3 border-0 border-b bg-transparent py-3 text-left text-base outline-none transition ${
          open ? "border-accent" : "border-line hover:border-accent/60"
        } ${className}`}
      >
        <span className="font-medium text-foreground">{formatDisplay(value)}</span>
        <CalendarGlyph className="shrink-0 text-accent" />
      </button>
    );

  return (
    <div ref={rootRef} className="relative">
      <input type="hidden" name={name} value={value} required={required} />
      {variant === "field" ? (
        <label
          htmlFor={triggerId}
          className="mb-1 block text-xs font-medium uppercase tracking-[0.14em] text-muted"
        >
          {label}
        </label>
      ) : null}
      {trigger}

      {open ? (
        <div
          role="dialog"
          aria-label={`${label} calendar`}
          className="absolute left-1/2 top-[calc(100%+0.5rem)] z-50 w-[min(100vw-2rem,20rem)] -translate-x-1/2 overflow-hidden rounded-2xl border border-white/40 bg-white/95 p-3 shadow-[0_24px_60px_rgba(15,23,42,0.22)] backdrop-blur-xl sm:left-0 sm:translate-x-0"
        >
          <div className="mb-3 h-[3px] rounded-full bg-[linear-gradient(90deg,#2563EB_0%,#DC2626_100%)]" />

          <div className="mb-3 flex items-center justify-between gap-2 px-1">
            <NavButton
              label="Previous month"
              onClick={() => setViewMonth((m) => addMonths(m, -1))}
            >
              ‹
            </NavButton>
            <p className="font-[family-name:var(--font-syne)] text-sm font-bold tracking-tight text-foreground">
              {monthLabel}
            </p>
            <NavButton
              label="Next month"
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
            >
              ›
            </NavButton>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1">
            {WEEKDAYS.map((d) => (
              <span
                key={d}
                className="py-1 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-muted"
              >
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const inMonth = day.getMonth() === viewMonth.getMonth();
              const iso = toIso(day);
              const isSelected = Boolean(selected && sameDay(day, selected));
              const isToday = sameDay(day, today);
              const disabled = Boolean(minDate && day < minDate);

              return (
                <button
                  key={iso}
                  type="button"
                  disabled={disabled}
                  onClick={() => pick(day)}
                  className={[
                    "relative inline-flex size-9 items-center justify-center rounded-full text-sm font-semibold transition duration-200",
                    !inMonth && !isSelected ? "text-muted/45" : "",
                    disabled
                      ? "cursor-not-allowed text-muted/30"
                      : "hover:bg-[linear-gradient(135deg,rgba(37,99,235,0.12),rgba(220,38,38,0.1))] hover:text-accent-deep",
                    isSelected
                      ? "bg-[linear-gradient(135deg,#1E3A8A_0%,#2563EB_45%,#DC2626_100%)] text-white shadow-[0_6px_16px_rgba(37,99,235,0.35)] hover:text-white"
                      : "",
                    isToday && !isSelected
                      ? "ring-1 ring-accent/40 text-accent-deep"
                      : "",
                    inMonth && !isSelected && !disabled
                      ? "text-foreground"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
            <button
              type="button"
              onClick={() => {
                const next = toIso(today);
                if (!minDate || today >= minDate) {
                  onChange(next);
                  setViewMonth(startOfMonth(today));
                  setOpen(false);
                }
              }}
              className="text-xs font-semibold text-accent transition hover:text-accent-deep"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-muted transition hover:bg-background hover:text-foreground"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function NavButton({
  children,
  label,
  onClick,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex size-9 items-center justify-center rounded-full border border-line bg-white text-lg text-muted shadow-sm transition hover:border-accent hover:text-accent"
    >
      {children}
    </button>
  );
}

function CalendarGlyph({ className = "" }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={className}
    >
      <rect
        x="3.5"
        y="5"
        width="17"
        height="15"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M3.5 9.5h17M8 3.5v3M16 3.5v3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
