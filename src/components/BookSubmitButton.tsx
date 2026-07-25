"use client";

import { useFormStatus } from "react-dom";

export function BookSubmitButton({
  disabled,
  label,
  className,
}: {
  disabled?: boolean;
  label: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={
        className ??
        "btn-cta min-h-11 px-5 py-2.5 text-sm disabled:cursor-not-allowed"
      }
    >
      {pending ? "Locking price…" : label}
    </button>
  );
}
