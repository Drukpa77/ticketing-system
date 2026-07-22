"use client";

import { useFormStatus } from "react-dom";

export function BookSubmitButton({
  disabled,
  label,
}: {
  disabled?: boolean;
  label: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="inline-flex items-center justify-center bg-accent-deep px-5 py-2.5 text-sm font-medium text-white transition hover:bg-accent disabled:cursor-not-allowed disabled:bg-zinc-400"
    >
      {pending ? "Locking price…" : label}
    </button>
  );
}
