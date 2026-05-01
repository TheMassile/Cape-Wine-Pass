import Link from "next/link";

const features = [
  {
    icon: "📍",
    title: "Track your progress",
    description:
      "Tick off estates region by region and see how close you are to completing each area.",
  },
  {
    icon: "📝",
    title: "Save tasting notes",
    description:
      "Keep favourite red, white, rosé and comments for every estate you visit.",
  },
  {
    icon: "🤍",
    title: "Keep favourites",
    description:
      "Mark the estates you love most and sort your visits by favourites later.",
  },
  {
    icon: "🏅",
    title: "Unlock badges",
    description:
      "Earn milestone badges and build your own personal wine journey as you go.",
  },
  {
    icon: "👨‍👩‍👧",
    title: "Find kid-friendly spots",
    description:
      "Vote on kid-friendly estates and make family planning a little easier.",
  },
  {
    icon: "🗺️",
    title: "Browse by region",
    description:
      "Open Stellenbosch, Franschhoek, Constantia and more to explore all estates in one place.",
  },
];

const steps = [
  {
    number: "01",
    title: "Explore",
    description:
      "Browse wine farms by region and discover places you want to visit.",
  },
  {
    number: "02",
    title: "Record",
    description:
      "Mark estates as visited, save tasting notes, and remember what stood out.",
  },
  {
    number: "03",
    title: "Build your pass",
    description:
      "Track progress, earn badges, and create your own Western Cape wine journey.",
  },
];

export default function HomePage() {
  return (
    <main>
      <section className="app-section">
        <div className="page-shell">
          <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="pill">Western Cape wine farm tracker</div>

              <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
                Discover, track and remember the best wine farms in the Cape.
              </h1>

              <p className="section-copy mt-5 max-w-2xl">
                Cape Wine Pass helps you keep track of visited estates, save
                notes and favourites, unlock badges, and build your own wine
                journey across the Western Cape.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/regions" className="btn-primary">
                  Browse regions
                </Link>
                <Link href="/login" className="btn-secondary">
                  Sign in / Sign up
                </Link>
              </div>

              <div className="mt-8 grid max-w-2xl gap-4 sm:grid-cols-3">
                <div className="soft-card p-4">
                  <div className="muted-label">Discover</div>
                  <div className="mt-2 text-lg font-semibold text-stone-900">
                    Regions
                  </div>
                  <p className="mt-2 text-sm leading-6">
                    Explore estates area by area.
                  </p>
                </div>

                <div className="soft-card p-4">
                  <div className="muted-label">Remember</div>
                  <div className="mt-2 text-lg font-semibold text-stone-900">
                    Notes
                  </div>
                  <p className="mt-2 text-sm leading-6">
                    Save wines, comments and favourites.
                  </p>
                </div>

                <div className="soft-card p-4">
                  <div className="muted-label">Progress</div>
                  <div className="mt-2 text-lg font-semibold text-stone-900">
                    Badges
                  </div>
                  <p className="mt-2 text-sm leading-6">
                    Earn milestones as you go.
                  </p>
                </div>
              </div>
            </div>

            <div className="soft-card overflow-hidden">
              <div className="bg-gradient-to-br from-stone-900 via-rose-900 to-amber-700 p-8 text-white">
                <div className="text-sm uppercase tracking-[0.18em] text-white/70">
                  Your wine journey
                </div>
                <h2 className="mt-3 text-3xl font-semibold text-white">
                  One place to collect your Cape wine memories.
                </h2>
                <p className="mt-4 max-w-md text-sm leading-7 text-white/80">
                  Keep everything together — estates visited, tasting notes,
                  favourites, progress, and family-friendly discoveries.
                </p>
              </div>

              <div className="grid gap-4 p-6 sm:grid-cols-2">
                <div className="rounded-2xl bg-stone-50 p-4">
                  <div className="text-sm text-stone-500">Save notes</div>
                  <div className="mt-2 text-xl font-semibold text-stone-900">
                    Favourite wines
                  </div>
                </div>

                <div className="rounded-2xl bg-stone-50 p-4">
                  <div className="text-sm text-stone-500">Track visits</div>
                  <div className="mt-2 text-xl font-semibold text-stone-900">
                    Region progress
                  </div>
                </div>

                <div className="rounded-2xl bg-stone-50 p-4">
                  <div className="text-sm text-stone-500">Keep favourites</div>
                  <div className="mt-2 text-xl font-semibold text-stone-900">
                    Loved estates
                  </div>
                </div>

                <div className="rounded-2xl bg-stone-50 p-4">
                  <div className="text-sm text-stone-500">Unlock goals</div>
                  <div className="mt-2 text-xl font-semibold text-stone-900">
                    Milestone badges
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="app-section pt-0">
        <div className="page-shell">
          <div className="mb-8">
            <div className="muted-label">Why use it</div>
            <h2 className="section-title mt-2">Everything in one clean place</h2>
            <p className="section-copy mt-4 max-w-3xl">
              Instead of forgetting where you have been, what you liked, or
              which estates are good for family visits, Cape Wine Pass helps you
              keep your wine life organised.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="soft-card-hover p-6">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="mt-4 text-xl font-semibold text-stone-900">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-7">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="app-section">
        <div className="page-shell">
          <div className="soft-card p-6 sm:p-8 lg:p-10">
            <div className="mb-8">
              <div className="muted-label">How it works</div>
              <h2 className="section-title mt-2">Build your wine pass in 3 steps</h2>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className="rounded-3xl bg-stone-50 p-6 ring-1 ring-stone-200"
                >
                  <div className="text-sm font-semibold tracking-[0.18em] text-rose-700">
                    {step.number}
                  </div>
                  <h3 className="mt-3 text-2xl font-semibold text-stone-900">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7">{step.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/regions" className="btn-primary">
                Start exploring
              </Link>
              <Link href="/login" className="btn-secondary">
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}