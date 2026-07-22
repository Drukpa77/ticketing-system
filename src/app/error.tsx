"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60svh] w-full max-w-lg flex-col justify-center px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
        Something went wrong
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-syne)] text-3xl font-semibold tracking-tight">
        We hit an unexpected error
      </h1>
      <p className="mt-3 text-sm text-muted">
        {error.message || "Please try again. Your progress may still be saved."}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="bg-accent-deep px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent"
        >
          Try again
        </button>
        <Link
          href="/"
          className="border border-line px-5 py-3 text-sm font-medium text-muted transition hover:border-accent hover:text-foreground"
        >
          Back home
        </Link>
      </div>
    </main>
  );
}
