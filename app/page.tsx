import Link from "next/link";
import AppHeader from "@/app/components/AppHeader";

export default function HomePage() {
  return (
    <>
      <AppHeader />

      <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="inline-flex items-center rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] shadow-sm">
                Western Cape wine farm tracker
              </div>

              <h1 className="mt-6 text-5xl font-semibold leading-tight tracking-tight">
                Discover, track and remember the best wine farms in the Cape.
              </h1>

              <p className="mt-5 max-w-xl text-lg leading-8 text-[var(--muted-foreground)]">
                Cape Wine Pass helps you keep track of visited estates, save
                notes and favourites, unlock badges, and build your own wine
                journey across the Western Cape.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/regions"
                  className="inline-flex items-center rounded-xl bg-[var(--brand)] px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[var(--brand-dark)] active:translate-y-[1px]"
                >
                  Browse regions
                </Link>

                <Link
                  href="/login"
                  className="inline-flex items-center rounded-xl border border-[var(--border)] bg-white px-5 py-3 text-sm font-medium text-[var(--foreground)] shadow-sm transition hover:bg-[var(--card-hover)] active:translate-y-[1px]"
                >
                  Sign in / Sign up
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">
                <div className="text-sm text-[var(--muted-foreground)]">
                  Track your progress
                </div>
                <div className="mt-2 text-2xl font-semibold">
                  Tick off estates region by region
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
                  See what you have visited, what is still left, and how close
                  you are to completing a region.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm">
                  <div className="text-2xl">🍷</div>
                  <div className="mt-3 font-semibold">Save tasting notes</div>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                    Keep favourite red, white, rosé, and comments for each
                    estate you visit.
                  </p>
                </div>

                <div className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm">
                  <div className="text-2xl">♥</div>
                  <div className="mt-3 font-semibold">Keep favourites</div>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                    Mark the estates you love most and sort your visits by
                    favourites later.
                  </p>
                </div>

                <div className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm">
                  <div className="text-2xl">🏅</div>
                  <div className="mt-3 font-semibold">Unlock badges</div>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                    Earn milestone badges and track your wine journey as you go.
                  </p>
                </div>

                <div className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm">
                  <div className="text-2xl">👨‍👩‍👧</div>
                  <div className="mt-3 font-semibold">Find kid-friendly spots</div>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                    Vote on kid-friendly estates and make family planning a bit
                    easier.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--border)] bg-white">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-soft)] p-5">
                <div className="text-sm font-medium text-[var(--brand)]">
                  1. Explore
                </div>
                <h2 className="mt-2 text-xl font-semibold">Browse by region</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                  Open Stellenbosch, Franschhoek, Constantia and more to see
                  all estates in one place.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-soft)] p-5">
                <div className="text-sm font-medium text-[var(--brand)]">
                  2. Record
                </div>
                <h2 className="mt-2 text-xl font-semibold">Save visits and notes</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                  Mark estates as visited, add tasting notes, and remember what
                  stood out.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-soft)] p-5">
                <div className="text-sm font-medium text-[var(--brand)]">
                  3. Progress
                </div>
                <h2 className="mt-2 text-xl font-semibold">Build your wine pass</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                  Watch your regions fill up, collect badges, and create your
                  own Western Cape wine story.
                </p>
              </div>
            </div>

            <div className="mt-10 rounded-3xl border border-[var(--border)] bg-[var(--brand)] px-6 py-8 text-white shadow-sm">
              <div className="max-w-3xl">
                <h3 className="text-2xl font-semibold">
                  Ready to start your Cape wine journey?
                </h3>
                <p className="mt-3 text-sm leading-7 text-white/85">
                  Create an account, explore the regions, and start building
                  your own personal wine pass.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/login"
                    className="inline-flex items-center rounded-xl bg-white px-5 py-3 text-sm font-medium text-[var(--brand)] transition hover:bg-white/90 active:translate-y-[1px]"
                  >
                    Create account
                  </Link>

                  <Link
                    href="/regions"
                    className="inline-flex items-center rounded-xl border border-white/40 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10 active:translate-y-[1px]"
                  >
                    View regions
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}