"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type RegionRow = {
  Region: string;
  total: number;
};

type EstateRegionRow = {
  "Estate ID": string | null;
  Region: string | null;
};

export default function RegionsProgress({ regions }: { regions: RegionRow[] }) {
  const [userId, setUserId] = useState<string | null>(null);

  const [estateToRegion, setEstateToRegion] = useState<Map<string, string>>(
    new Map()
  );

  const [visitedByRegion, setVisitedByRegion] = useState<Map<string, number>>(
    new Map()
  );

  const [totalVisited, setTotalVisited] = useState(0);

  useEffect(() => {
    let alive = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      setUserId(data.session?.user?.id ?? null);
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      setUserId(session?.user?.id ?? null);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadEstateMap = async () => {
      const { data, error } = await supabase
        .from("estates")
        .select('"Estate ID","Region"');

      if (cancelled) return;

      if (error) {
        console.log("estates map load error:", error.message);
        setEstateToRegion(new Map());
        return;
      }

      const map = new Map<string, string>();
      for (const row of (data ?? []) as unknown as EstateRegionRow[]) {
        const id = row["Estate ID"];
        const region = row.Region;
        if (id && region) map.set(id, region);
      }

      setEstateToRegion(map);
    };

    loadEstateMap();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadVisits = async () => {
      if (!userId) {
        setVisitedByRegion(new Map());
        setTotalVisited(0);
        return;
      }

      const { data, error } = await supabase
        .from("visits")
        .select("estate_id")
        .eq("user_id", userId);

      if (cancelled) return;

      if (error) {
        console.log("visits load error:", error.message);
        setVisitedByRegion(new Map());
        setTotalVisited(0);
        return;
      }

      const visitedIds = (data ?? [])
        .map((r: any) => r.estate_id as string | null)
        .filter(Boolean) as string[];

      setTotalVisited(visitedIds.length);

      const counts = new Map<string, number>();

      for (const estateId of visitedIds) {
        const region = estateToRegion.get(estateId);
        if (!region) continue;
        counts.set(region, (counts.get(region) ?? 0) + 1);
      }

      setVisitedByRegion(counts);
    };

    loadVisits();

    return () => {
      cancelled = true;
    };
  }, [userId, estateToRegion]);

  const rows = useMemo(() => {
    return regions.map((r) => {
      const visited = visitedByRegion.get(r.Region) ?? 0;
      const pct = r.total > 0 ? Math.round((visited / r.total) * 100) : 0;
      const remaining = Math.max(0, r.total - visited);
      return { ...r, visited, pct, remaining };
    });
  }, [regions, visitedByRegion]);

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <div className="mt-6">
      <div className="mb-5 rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm text-gray-500">Your progress</div>
            <div className="mt-1 text-lg font-semibold">
              {userId ? `${totalVisited} estates visited` : "Sign in to track progress"}
            </div>
            <div className="mt-1 text-sm text-gray-600">
              {userId
                ? "Your region progress updates automatically."
                : "Track visits, favourites, notes, and badges once signed in."}
            </div>
          </div>

          <div>
            {userId ? (
              <button
                onClick={signOut}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 shadow-sm transition hover:bg-gray-50 hover:shadow active:translate-y-[1px] active:shadow-none"
              >
                Sign out
              </button>
            ) : (
              <Link
                href="/login"
                className="inline-flex rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 shadow-sm transition hover:bg-gray-50 hover:shadow active:translate-y-[1px] active:shadow-none"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {rows.map((r) => (
          <Link
            key={r.Region}
            href={`/region/${encodeURIComponent(r.Region)}`}
            className="block rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-[1px] hover:bg-gray-50 hover:shadow-md active:translate-y-0"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold">{r.Region}</div>
                <div className="mt-1 text-sm text-gray-500">
                  {r.total} estates in this region
                </div>
              </div>

              <div className="rounded-full border bg-white px-3 py-1 text-sm font-medium text-gray-700">
                {r.visited}/{r.total}
              </div>
            </div>

            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-black transition-all"
                style={{ width: `${r.pct}%` }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 text-sm">
              <div className="text-gray-700">{r.pct}% complete</div>
              <div className="text-gray-500">
                {r.remaining === 0
                  ? "Region complete"
                  : `${r.remaining} remaining`}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}