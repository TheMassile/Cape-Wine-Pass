"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const MILESTONES = [1, 5, 10, 25, 50, 100, 200, 300];

type Rank = "None" | "Bronze" | "Silver" | "Gold" | "Elite";

function getRank(visited: number, total: number): Rank {
  if (total > 0 && visited >= total) return "Elite";
  if (visited >= 100) return "Gold";
  if (visited >= 50) return "Silver";
  if (visited >= 10) return "Bronze";
  return "None";
}

function getRankDisplay(rank: Rank) {
  if (rank === "Bronze") return { icon: "🥉", label: "Bronze" };
  if (rank === "Silver") return { icon: "🥈", label: "Silver" };
  if (rank === "Gold") return { icon: "🥇", label: "Gold" };
  if (rank === "Elite") return { icon: "👑", label: "Elite" };
  return { icon: "🍇", label: "Explorer" };
}

export default function BadgesClient() {
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [totalEstates, setTotalEstates] = useState(0);
  const [visitedCount, setVisitedCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setSignedIn(!!data.session);
      setLoading(false);
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setErrorMsg(null);

      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (!session) {
        setTotalEstates(0);
        setVisitedCount(0);
        return;
      }

      const { data: eData, error: eErr } = await supabase
        .from("estates")
        .select(`"Estate ID","Status"`)
        .neq("Status", "Closed");

      if (cancelled) return;
      if (eErr) {
        setErrorMsg(eErr.message);
        return;
      }

      const total = (eData ?? []).length;
      setTotalEstates(total);

      const { data: vData, error: vErr } = await supabase
        .from("visits")
        .select("estate_id")
        .eq("user_id", session.user.id);

      if (cancelled) return;
      if (vErr) {
        setErrorMsg(vErr.message);
        return;
      }

      setVisitedCount((vData ?? []).length);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  const rank = useMemo(() => getRank(visitedCount, totalEstates), [visitedCount, totalEstates]);

  const rankDisplay = useMemo(() => getRankDisplay(rank), [rank]);

  const nextTarget = useMemo(() => {
    if (rank === "None") return 10;
    if (rank === "Bronze") return 50;
    if (rank === "Silver") return 100;
    if (rank === "Gold") return totalEstates || 999999;
    return totalEstates || 999999;
  }, [rank, totalEstates]);

  const pct = totalEstates > 0 ? Math.round((visitedCount / totalEstates) * 100) : 0;

  const nextText = useMemo(() => {
    if (rank === "None") return "Bronze at 10 visits";
    if (rank === "Bronze") return "Silver at 50 visits";
    if (rank === "Silver") return "Gold at 100 visits";
    if (rank === "Gold") return "Elite at all estates";
    return "Elite unlocked";
  }, [rank]);

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-5 text-sm text-gray-600 shadow-sm">
        Loading badges…
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className="rounded-2xl border bg-white p-5 text-sm text-gray-700 shadow-sm">
        Please sign in to see your badges.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {errorMsg && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-sm text-gray-500">Current rank</div>
            <div className="mt-2 flex items-center gap-3">
              <div className="text-3xl">{rankDisplay.icon}</div>
              <div>
                <div className="text-2xl font-semibold">{rankDisplay.label}</div>
                <div className="text-sm text-gray-500">
                  {visitedCount} of {totalEstates} estates visited
                </div>
              </div>
            </div>

            <div className="mt-3 text-sm text-gray-600">
              {rank === "Elite"
                ? "Elite unlocked — you visited every estate 🎉"
                : `Next badge: ${nextText} (${Math.max(0, nextTarget - visitedCount)} to go)`}
            </div>
          </div>

          <div className="rounded-2xl border bg-gray-50 px-4 py-3 text-center">
            <div className="text-sm text-gray-500">Completion</div>
            <div className="mt-1 text-2xl font-semibold">{pct}%</div>
          </div>
        </div>

        <div className="mt-5 h-3 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-black transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm text-gray-500">Visit milestones</div>
            <div className="mt-1 text-xl font-semibold">{visitedCount} total visits</div>
          </div>

          <div className="rounded-full border bg-white px-3 py-1 text-sm text-gray-700">
            {MILESTONES.filter((m) => visitedCount >= m).length}/{MILESTONES.length} earned
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MILESTONES.map((m) => {
            const earned = visitedCount >= m;

            return (
              <div
                key={m}
                className={`rounded-2xl border p-4 text-sm shadow-sm ${
                  earned
                    ? "border-green-200 bg-green-50"
                    : "border-gray-200 bg-gray-50 text-gray-500"
                }`}
              >
                <div className="text-2xl">{earned ? "✅" : "🔒"}</div>
                <div className="mt-2 font-semibold">{m} visited</div>
                <div className="mt-1 text-xs">
                  {earned ? "Unlocked" : `${Math.max(0, m - visitedCount)} to go`}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}