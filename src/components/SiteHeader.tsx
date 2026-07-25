"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PersonIcon } from "@/components/fares/FareIcons";

export function SiteHeader() {
  const pathname = usePathname();
  const onBookingHome = pathname === "/";
  const onFlightsFlow =
    onBookingHome ||
    pathname.startsWith("/flights") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/confirmation");

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="font-[family-name:var(--font-syne)] text-lg font-semibold tracking-tight text-foreground"
        >
          {process.env.NEXT_PUBLIC_BRAND_SHORT_NAME || "Drukair"}
        </Link>

        {onFlightsFlow ? (
          <nav className="flex items-center gap-4 text-sm sm:gap-5">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 font-medium text-muted transition hover:text-foreground"
            >
              <PersonIcon />
              <span>Sign In / Join Now</span>
            </Link>
            <Link
              href="/"
              aria-label="Cart"
              className="relative inline-flex size-10 items-center justify-center rounded-full border border-line text-foreground transition hover:border-accent hover:text-accent"
            >
              <CartIcon />
              <span className="absolute -right-0.5 -top-0.5 inline-flex size-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                0
              </span>
            </Link>
          </nav>
        ) : (
          <nav className="flex items-center gap-6 text-sm text-muted">
            <Link href="/" className="transition hover:text-foreground">
              Search
            </Link>
            <Link href="/admin" className="transition hover:text-foreground">
              Admin
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}

function CartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 7h14l-1.5 9h-11L7 7Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M7 7 6 3H3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="10" cy="20" r="1.25" fill="currentColor" />
      <circle cx="17" cy="20" r="1.25" fill="currentColor" />
    </svg>
  );
}
