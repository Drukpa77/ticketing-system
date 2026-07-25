import { startCheckoutFormAction } from "@/lib/actions/booking";
import { BookSubmitButton } from "@/components/BookSubmitButton";

export function BookButton({
  flightId,
  returnFlightId,
  fareProductId,
  disabled,
  label = "Book at this price",
  buttonClassName,
}: {
  flightId: string;
  returnFlightId?: string;
  fareProductId?: string;
  disabled?: boolean;
  label?: string;
  buttonClassName?: string;
}) {
  return (
    <form action={startCheckoutFormAction} className="w-full">
      <input type="hidden" name="flightId" value={flightId} />
      {returnFlightId ? (
        <input type="hidden" name="returnFlightId" value={returnFlightId} />
      ) : null}
      {fareProductId ? (
        <input type="hidden" name="fareProductId" value={fareProductId} />
      ) : null}
      <BookSubmitButton
        disabled={disabled}
        label={label}
        className={buttonClassName}
      />
    </form>
  );
}
