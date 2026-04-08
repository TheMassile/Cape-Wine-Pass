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
        ? "bg-black text-white"
        : "border border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
    }`;
  }

  return (
    <header className="mb-6 border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/regions" className="text-lg font-semibold tracking-tight">
          Cape Wine Pass
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