"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import VisitedToggle from "./VisitedToggle";

type EstateRow = any;

type VoteValue = true | false | null; // true=yes, false=no, null=unknown

export default function VisitedMap({ estates }: { estates: EstateRow[] }) {
  const [visitedSet, setVisitedSet] = useState<Set<string>>(new Set());

  // user’s own votes for estates on this page
  const [myVotes, setMyVotes] = useState<Map<string, VoteValue>>(new Map());

  // community YES counts (for badge + display)
  const [yesCounts, setYesCounts] = useState<Map<string, number>>(new Map());

  const [loadingVotes, setLoadingVotes] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const estateIds = useMemo(
    () => estates.map((e: any) => e["Estate ID"]).filter(Boolean),
    [estates]
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setErrorMsg(null);
      setLoadingVotes(true);

      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      // Not signed in? show everything as unvisited + no voting
      if (!user) {
        if (!cancelled) {
          setVisitedSet(new Set());
          setMyVotes(new Map());
          setYesCounts(new Map());
          setLoadingVotes(false);
        }
        return;
      }

      // 1) Load visits for this user
      const { data: visitsData, error: visitsErr } = await supabase
        .from("visits")
        .select("estate_id")
        .eq("user_id", user.id);

      if (visitsErr) {
        if (!cancelled) {
          setErrorMsg(visitsErr.message);
          setVisitedSet(new Set());
          setMyVotes(new Map());
          setYesCounts(new Map());
          setLoadingVotes(false);
        }
        return;
      }

      const vset = new Set((visitsData ?? []).map((r: any) => r.estate_id));

      // 2) Load my votes for estates on this page
      // (RLS allows selecting only your own votes)
      let voteMap = new Map<string, VoteValue>();
      if (estateIds.length > 0) {
        const { data: votesData, error: votesErr } = await supabase
          .from("kid_friendly_votes")
          .select("estate_id, vote")
          .eq("user_id", user.id)
          .in("estate_id", estateIds);

        if (votesErr) {
          // votes aren’t critical; still show page
          console.log("kid_friendly_votes load error:", votesErr.message);
        } else {
          for (const row of votesData ?? []) {
            voteMap.set(row.estate_id, row.vote as boolean);
          }
        }
      }

      // 3) Load community YES counts via RPC (no leaking voters)
      let countsMap = new Map<string, number>();
      if (estateIds.length > 0) {
        const { data: countsData, error: countsErr } = await supabase.rpc(
          "kid_friendly_yes_counts",
          { est_ids: estateIds }
        );

        if (countsErr) {
          console.log("kid_friendly_yes_counts rpc error:", countsErr.message);
        } else {
          for (const row of (countsData ?? []) as any[]) {
            countsMap.set(row.estate_id, Number(row.yes_count ?? 0));
          }
        }
      }

      if (!cancelled) {
        setVisitedSet(vset);
        setMyVotes(voteMap);
        setYesCounts(countsMap);
        setLoadingVotes(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [estateIds]);

  const visitedCount = useMemo(() => {
    let c = 0;
    for (const e of estates) if (visitedSet.has(e["Estate ID"])) c++;
    return c;
  }, [estates, visitedSet]);

  async function setVote(estateId: string, next: VoteValue) {
    setErrorMsg(null);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      alert("Please sign in first.");
      return;
    }

    // require visit (UI) — DB also enforces this via RLS policy
    if (!visitedSet.has(estateId)) {
      alert("Please mark this estate as visited before voting kid-friendly.");
      return;
    }

    const prev = myVotes.get(estateId) ?? null;

    // OPTIMISTIC UI: update myVotes immediately
    setMyVotes((m) => {
      const copy = new Map(m);
      if (next === null) copy.delete(estateId);
      else copy.set(estateId, next);
      return copy;
    });

    // OPTIMISTIC UI: adjust community YES count if the user changed YES status
    setYesCounts((m) => {
      const copy = new Map(m);
      const current = copy.get(estateId) ?? 0;

      const wasYes = prev === true;
      const nowYes = next === true;

      let updated = current;
      if (wasYes && !nowYes) updated = Math.max(0, current - 1);
      if (!wasYes && nowYes) updated = current + 1;

      copy.set(estateId, updated);
      return copy;
    });

    // Write to DB:
    // - next === null => delete row (Unknown)
    // - else upsert row with vote true/false
    if (next === null) {
      const { error } = await supabase
        .from("kid_friendly_votes")
        .delete()
        .eq("user_id", user.id)
        .eq("estate_id", estateId);

      if (error) {
        setErrorMsg(error.message);

        // rollback optimistic state
        setMyVotes((m) => {
          const copy = new Map(m);
          if (prev === null) copy.delete(estateId);
          else copy.set(estateId, prev);
          return copy;
        });
        setYesCounts((m) => {
          const copy = new Map(m);
          // reverse what we did
          const current = copy.get(estateId) ?? 0;
          const wasYes = prev === true;
          const nowYes = false;
          let updated = current;
          if (!wasYes && nowYes) updated = current + 1;
          if (wasYes && !nowYes) updated = current + 1; // we decremented earlier, so add back
          copy.set(estateId, updated);
          return copy;
        });
      }
      return;
    }

    const { error } = await supabase.from("kid_friendly_votes").upsert(
      {
        user_id: user.id,
        estate_id: estateId,
        vote: next,
      },
      { onConflict: "user_id,estate_id" }
    );

    if (error) {
      setErrorMsg(error.message);

      // rollback optimistic state
      setMyVotes((m) => {
        const copy = new Map(m);
        if (prev === null) copy.delete(estateId);
        else copy.set(estateId, prev);
        return copy;
      });

      setYesCounts((m) => {
        const copy = new Map(m);
        const current = copy.get(estateId) ?? 0;

        const wasYes = prev === true;
        const nowYes = next === true;

        let updated = current;
        // reverse the earlier adjustment
        if (wasYes && !nowYes) updated = current + 1;
        if (!wasYes && nowYes) updated = Math.max(0, current - 1);

        copy.set(estateId, updated);
        return copy;
      });
    }
  }

  return (
    <div className="mt-6 space-y-2">
      <div className="text-sm text-gray-600">
        Visited: {visitedCount}/{estates.length}
        {loadingVotes ? <span className="ml-2">Loading…</span> : null}
      </div>

      {errorMsg ? (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {errorMsg}
        </div>
      ) : null}

      {estates.map((e: any) => {
        const estateId = e["Estate ID"];
        const estateName = e["Estate Name"];

        const isVisited = visitedSet.has(estateId);
        const myVote = myVotes.get(estateId) ?? null;
        const yesCount = yesCounts.get(estateId) ?? 0;

        const showKidBadge = yesCount >= 20;

        return (
          <div key={estateId} className="rounded-xl border p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="font-medium">{estateName}</div>

                  {showKidBadge ? (
                    <span className="rounded-full border px-2 py-0.5 text-xs">
                      🧒 Kid-friendly ({yesCount})
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500">
                      Kid-friendly ({yesCount})
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <VisitedToggle
  estateId={estateId}
  visited={isVisited}
  onChange={(id, nowVisited) => {
    setVisitedSet((prev) => {
      const next = new Set(prev);
      if (nowVisited) next.add(id);
      else next.delete(id);
      return next;
    });
  }}
/>
                <div className="text-xs text-gray-500">{estateId}</div>
              </div>
            </div>

            {/* Vote controls */}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-gray-600">Kid-friendly vote:</span>

              <VoteButton
                active={myVote === true}
                disabled={!isVisited}
                label="👍 Yes"
                onClick={() => setVote(estateId, true)}
              />
              <VoteButton
                active={myVote === false}
                disabled={!isVisited}
                label="👎 No"
                onClick={() => setVote(estateId, false)}
              />
              <VoteButton
                active={myVote === null}
                disabled={!isVisited}
                label="❓ Unknown"
                onClick={() => setVote(estateId, null)}
              />

              {!isVisited ? (
                <span className="ml-2 text-gray-500">
                  (Mark visited to vote)
                </span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function VoteButton({
  active,
  disabled,
  label,
  onClick,
}: {
  active: boolean;
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        "rounded-full border px-3 py-1",
        disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50",
        active ? "bg-black text-white border-black" : "",
      ].join(" ")}
      type="button"
    >
      {label}
    </button>
  );
}