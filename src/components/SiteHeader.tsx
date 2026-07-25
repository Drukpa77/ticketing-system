"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteHeader({ cartCount = 0 }: { cartCount?: number }) {
  const pathname = usePathname();
  const onCart = pathname === "/cart";

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white pt-[env(safe-area-inset-top,0px)]">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <Link
          href="/"
          className="min-w-0 truncate font-[family-name:var(--font-syne)] text-base font-semibold tracking-tight text-foreground sm:text-lg"
        >
          {process.env.NEXT_PUBLIC_BRAND_SHORT_NAME || "Drukair"}
        </Link>

        <nav className="flex shrink-0 items-center gap-1 sm:gap-3">
          <Link
            href="/"
            className={`inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium transition hover:text-foreground ${
              pathname === "/" ? "text-foreground" : "text-muted"
            }`}
          >
            Search
          </Link>
          <Link
            href="/admin"
            className={`inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium transition hover:text-foreground ${
              pathname.startsWith("/admin") ? "text-foreground" : "text-muted"
            }`}
          >
            Admin
          </Link>
          <Link
            href="/cart"
            aria-label={`Cart${cartCount > 0 ? `, ${cartCount} items` : ""}`}
            className={`relative inline-flex size-11 items-center justify-center rounded-full border transition ${
              onCart
                ? "border-accent text-accent"
                : "border-line text-foreground hover:border-accent hover:text-accent"
            }`}
          >
            <CartIcon />
            {cartCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-4 text-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            ) : null}
          </Link>
        </nav>
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
