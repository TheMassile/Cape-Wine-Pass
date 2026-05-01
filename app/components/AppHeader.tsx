import Link from "next/link";

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/85 backdrop-blur">
      <div className="page-shell">
        <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-600 to-amber-500 text-lg text-white shadow-sm">
              🍷
            </div>

            <div>
              <div className="text-lg font-semibold text-stone-900">
                Cape Wine Pass
              </div>
              <div className="text-sm text-stone-500">
                Track your wine journey
              </div>
            </div>
          </Link>

          <nav className="flex flex-wrap items-center gap-2">
            <Link href="/regions" className="nav-pill">
              Regions
            </Link>
            <Link href="/visits" className="nav-pill">
              My Visits
            </Link>
            <Link href="/badges" className="nav-pill">
              Badges
            </Link>
            <Link href="/login" className="nav-pill-active">
              Sign in
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}