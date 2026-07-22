import { startCheckoutFormAction } from "@/lib/actions/booking";
import { BookSubmitButton } from "@/components/BookSubmitButton";

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
  return (
    <form action={startCheckoutFormAction} className="space-y-2">
      <input type="hidden" name="flightId" value={flightId} />
      {returnFlightId ? (
        <input type="hidden" name="returnFlightId" value={returnFlightId} />
      ) : null}
      <BookSubmitButton disabled={disabled} label={label} />
    </form>
  );
}
