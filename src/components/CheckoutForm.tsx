"use client";

import { useActionState } from "react";
import { confirmBookingAction } from "@/lib/actions/booking";

export function CheckoutForm({
  quoteId,
  maxSeats,
}: {
  quoteId: string;
  maxSeats: number;
}) {
  const [state, action, pending] = useActionState(confirmBookingAction, null);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="quoteId" value={quoteId} />
      <div className="space-y-1">
        <label htmlFor="passengerName" className="text-sm font-medium text-zinc-800">
          Passenger name
        </label>
        <input
          id="passengerName"
          name="passengerName"
          required
          className="w-full border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium text-zinc-800">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="seatsBooked" className="text-sm font-medium text-zinc-800">
          Seats
        </label>
        <input
          id="seatsBooked"
          name="seatsBooked"
          type="number"
          min={1}
          max={Math.min(9, maxSeats)}
          defaultValue={1}
          required
          className="w-24 border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
        />
      </div>
      {state?.error && <p className="text-sm text-red-700">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:bg-zinc-400"
      >
        {pending ? "Confirming…" : "Confirm booking"}
      </button>
      <p className="text-xs text-zinc-500">
        Demo checkout — no payment is taken.
      </p>
    </form>
  );
}
