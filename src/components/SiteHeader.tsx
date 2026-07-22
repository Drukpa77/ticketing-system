"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteHeader() {
  const pathname = usePathname();
  const onHome = pathname === "/";

  return (
    <header
      className={
        onHome
          ? "absolute inset-x-0 top-0 z-20"
          : "sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur-sm"
      }
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Link
          href="/"
          className={`font-[family-name:var(--font-syne)] text-lg font-semibold tracking-tight ${
            onHome ? "text-white" : "text-foreground"
          }`}
        >
          Travel Agent
        </Link>
        <nav
          className={`flex items-center gap-6 text-sm ${
            onHome ? "text-white/80" : "text-muted"
          }`}
        >
          {onHome ? (
            <>
              <a href="#search" className="transition hover:text-white">
                Search
              </a>
              <a href="#routes" className="transition hover:text-white">
                Routes
              </a>
              <a
                href="#pricing"
                className="hidden transition hover:text-white sm:inline"
              >
                Live fares
              </a>
            </>
          ) : (
            <Link
              href="/"
              className="transition hover:text-foreground"
            >
              Search
            </Link>
          )}
          <Link
            href="/admin"
            className={
              onHome
                ? "transition hover:text-white"
                : "transition hover:text-foreground"
            }
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
