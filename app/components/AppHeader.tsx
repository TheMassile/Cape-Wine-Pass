"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppHeader() {
  const pathname = usePathname();

  function linkClasses(href: string) {
    const active =
      pathname === href ||
      (href === "/regions" && pathname?.startsWith("/region/"));

    return `rounded-full px-4 py-2 text-sm font-medium transition ${
      active
        ? "bg-[var(--brand)] text-white shadow-sm"
        : "border border-[var(--border)] bg-white text-[var(--foreground)] hover:bg-[var(--card-hover)]"
    }`;
  }

  return (
    <header className="border-b border-[var(--border)] bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--brand)] text-lg text-white shadow-sm">
            🍷
          </div>
          <div>
            <div className="text-base font-semibold tracking-tight text-[var(--foreground)]">
              Cape Wine Pass
            </div>
            <div className="text-xs text-[var(--muted-foreground)]">
              Track your wine journey
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <Link href="/regions" className={linkClasses("/regions")}>
            Regions
          </Link>
          <Link href="/visits" className={linkClasses("/visits")}>
            My Visits
          </Link>
          <Link href="/badges" className={linkClasses("/badges")}>
            Badges
          </Link>
        </nav>
      </div>
    </header>
  );
}