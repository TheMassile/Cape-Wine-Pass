import BadgesClient from "./BadgesClient";
import AppHeader from "@/app/components/AppHeader";

export default function BadgesPage() {
  return (
    <>
      <AppHeader />

      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold">Badges</h1>
              <p className="mt-1 text-sm text-gray-600">
                Earn badges by visiting estates and completing regions.
              </p>
            </div>
          </div>

          <div className="mt-6">
            <BadgesClient />
          </div>
        </div>
      </main>
    </>
  );
}