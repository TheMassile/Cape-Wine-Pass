import { createClient } from "@supabase/supabase-js";
import RegionsProgress from "./RegionsProgress";
import AppHeader from "@/app/components/AppHeader";

type RegionRow = {
  Region: string;
  total: number;
};

export default async function RegionsPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from("estates")
    .select('"Region","Status"')
    .neq("Status", "Closed");

  if (error) {
    return (
      <>
        <AppHeader />
        <main className="min-h-screen p-6">
          <div className="mx-auto max-w-3xl">
            <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              {error.message}
            </p>
          </div>
        </main>
      </>
    );
  }

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const region = (row as any)["Region"] as string | null;
    if (!region) continue;
    counts.set(region, (counts.get(region) ?? 0) + 1);
  }

  const regions: RegionRow[] = Array.from(counts.entries())
    .map(([Region, total]) => ({ Region, total }))
    .sort((a, b) => a.Region.localeCompare(b.Region));

  const totalEstates = regions.reduce((sum, r) => sum + r.total, 0);

  return (
    <>
      <AppHeader />

      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold">Regions</h1>
              <p className="mt-1 text-sm text-gray-600">
                {totalEstates} estates across {regions.length} regions
              </p>
            </div>
          </div>

          <p className="mt-2 text-sm text-gray-600">
            Sign in to track visited estates and unlock progress.
          </p>

          <RegionsProgress regions={regions} />
        </div>
      </main>
    </>
  );
}