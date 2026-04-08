export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-xl w-full">
        <h1 className="text-4xl font-semibold">Cape Wine Pass</h1>
        <p className="mt-3 text-lg text-gray-600">
          Collect the Cape, one cellar door at a time.
        </p>

        <div className="mt-6 flex gap-3">
          <a
            href="/login"
            className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-white"
          >
            Sign in
          </a>
          <a
            href="/regions"
            className="inline-flex items-center justify-center rounded-lg border px-4 py-2"
          >
            Browse regions
          </a>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border p-4">
            <div className="text-sm text-gray-500">Stamp visits</div>
            <div className="mt-1 font-medium">Tick off estates</div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-sm text-gray-500">Track progress</div>
            <div className="mt-1 font-medium">Region completion</div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-sm text-gray-500">Earn badges</div>
            <div className="mt-1 font-medium">Adventure milestones</div>
          </div>
        </div>
      </div>
    </main>
  );
}