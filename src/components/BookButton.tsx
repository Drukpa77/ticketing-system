"use client";

import { useState, useTransition } from "react";
import { startCheckoutAction } from "@/lib/actions/booking";

export function BookButton({
  flightId,
  returnFlightId,
  disabled,
  label = "Book at this price",
}: {
  flightId: string;
  returnFlightId?: string;
  disabled?: boolean;
  label?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={disabled || pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await startCheckoutAction(flightId, returnFlightId);
            if (result?.error) setError(result.error);
          });
        }}
        className="inline-flex items-center justify-center bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
      >
        {pending ? "Locking price…" : label}
      </button>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
