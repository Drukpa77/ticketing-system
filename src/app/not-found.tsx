import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60svh] w-full max-w-lg flex-col justify-center px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
        404
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-syne)] text-3xl font-semibold tracking-tight">
        Page not found
      </h1>
      <p className="mt-3 text-sm text-muted">
        That link may be expired or incorrect.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex w-fit bg-accent-deep px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent"
      >
        Back home
      </Link>
    </main>
  );
}
