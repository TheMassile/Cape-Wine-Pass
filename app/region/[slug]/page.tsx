import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import RegionClient from "./RegionClient";
import AppHeader from "@/app/components/AppHeader";

export type EstateRow = {
  "Estate ID": string;
  "Estate Name": string;
  Region: string;
  Status?: string | null;
  "Appointment Only (Y/N)"?: string | null;
  "Restaurant (Y/N)"?: string | null;
  "Kid Friendly (Yes/No/Unknown)"?: string | null;
};

export default async function RegionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const regionName = decodeURIComponent(slug ?? "");

  if (!regionName) {
    return (
      <>
        <AppHeader />
        <main className="min-h-screen p-6">
          <div className="mx-auto max-w-4xl">
            <p className="text-sm text-gray-600">Region not found (missing slug).</p>
            <Link className="mt-4 inline-block underline text-sm" href="/regions">
              ← Back to regions
            </Link>
          </div>
        </main>
      </>
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from("estates")
    .select(
      `"Estate ID","Estate Name","Region","Status","Appointment Only (Y/N)","Restaurant (Y/N)","Kid Friendly (Yes/No/Unknown)"`
    )
    .eq("Region", regionName)
    .neq("Status", "Closed")
    .order("Estate Name", { ascending: true });

  const estates: EstateRow[] = (data ?? []) as EstateRow[];

  return (
    <>
      <AppHeader />

      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold">{regionName}</h1>
              <p className="mt-1 text-sm text-gray-600">{estates.length} estates</p>
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              {error.message}
            </p>
          )}

          <div className="mt-6">
            <RegionClient regionName={regionName} estates={estates} />
          </div>

          <Link className="mt-8 inline-block underline text-sm" href="/regions">
            ← Back to regions
          </Link>
        </div>
      </main>
    </>
  );
}