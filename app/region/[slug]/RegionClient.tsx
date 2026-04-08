"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import VisitedToggle from "@/app/region/VisitedToggle";
import KidFriendlyVote from "@/app/components/KidFriendlyVote";
import Toast from "@/app/components/Toast";

type EstateRow = {
  "Estate ID": string;
  "Estate Name": string;
  Region?: string | null;
  Status?: string | null;
  "Appointment Only (Y/N)"?: string | null;
  "Restaurant (Y/N)"?: string | null;
  "Kid Friendly (Yes/No/Unknown)"?: string | null;
};

type VisitRow = Record<string, unknown>;

type VoteRow = {
  estate_id: string;
  vote: number;
  user_id: string;
};

type VoteSummary = {
  up: number;
  down: number;
  myVote: 1 | -1 | null;
};

type ToastState = {
  show: boolean;
  message: string;
  tone: "success" | "error" | "info";
};

export default function RegionClient({
  regionName,
  estates,
}: {
  regionName: string;
  estates: EstateRow[];
}) {
  const [q, setQ] = useState("");
  const [filterRestaurant, setFilterRestaurant] = useState(false);
  const [filterAppointment, setFilterAppointment] = useState(false);

  const [visitedIds, setVisitedIds] = useState<Set<string>>(new Set());
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loadingVisited, setLoadingVisited] = useState(true);

  const [votes, setVotes] = useState<Record<string, VoteSummary>>({});
  const [loadingVotes, setLoadingVotes] = useState(true);

  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: "",
    tone: "info",
  });

  function showToast(message: string, tone: "success" | "error" | "info" = "info") {
    setToast({
      show: true,
      message,
      tone,
    });

    window.setTimeout(() => {
      setToast((prev) => ({
        ...prev,
        show: false,
      }));
    }, 2200);
  }

  const estateIds = useMemo(() => {
    return estates.map((e) => e["Estate ID"]).filter(Boolean);
  }, [estates]);

  useEffect(() => {
    let cancelled = false;

    async function loadPageData() {
      try {
        setLoadingVisited(true);
        setLoadingVotes(true);

        const {
          data: { session },
        } = await supabase.auth.getSession();

        const user = session?.user ?? null;

        if (!cancelled) {
          setVisitedIds(new Set());
          setFavoriteIds(new Set());
        }

        if (user) {
          const { data: visitRows } = await supabase
            .from("visits")
            .select("*")
            .eq("user_id", user.id);

          const rawVisitRows = (visitRows ?? []) as VisitRow[];

          const visited = rawVisitRows
            .map((row) => {
              const estateId =
                row.estate_id ??
                row["estate_id"] ??
                row["Estate ID"] ??
                row.estateId;

              return typeof estateId === "string" ? estateId : null;
            })
            .filter((id): id is string => Boolean(id));

          const favorites = rawVisitRows
            .filter((row) => Boolean(row.is_favorite))
            .map((row) => {
              const estateId =
                row.estate_id ??
                row["estate_id"] ??
                row["Estate ID"] ??
                row.estateId;

              return typeof estateId === "string" ? estateId : null;
            })
            .filter((id): id is string => Boolean(id));

          if (!cancelled) {
            setVisitedIds(new Set(visited));
            setFavoriteIds(new Set(favorites));
          }
        }

        if (estateIds.length === 0) {
          if (!cancelled) {
            setVotes({});
            setLoadingVisited(false);
            setLoadingVotes(false);
          }
          return;
        }

        const { data: allVotes } = await supabase
          .from("estate_kid_friendly_votes")
          .select("estate_id, vote, user_id")
          .in("estate_id", estateIds);

        const voteRows = (allVotes ?? []) as VoteRow[];
        const nextVotes: Record<string, VoteSummary> = {};

        for (const estateId of estateIds) {
          const estateVotes = voteRows.filter((row) => row.estate_id === estateId);

          const up = estateVotes.filter((row) => row.vote === 1).length;
          const down = estateVotes.filter((row) => row.vote === -1).length;

          const myVoteRow = user
            ? estateVotes.find((row) => row.user_id === user.id)
            : undefined;

          nextVotes[estateId] = {
            up,
            down,
            myVote:
              myVoteRow?.vote === 1
                ? 1
                : myVoteRow?.vote === -1
                ? -1
                : null,
          };
        }

        if (!cancelled) {
          setVotes(nextVotes);
        }
      } catch {
        if (!cancelled) {
          setVisitedIds(new Set());
          setFavoriteIds(new Set());
          setVotes({});
        }
        showToast("Something went wrong while loading this region.", "error");
      } finally {
        if (!cancelled) {
          setLoadingVisited(false);
          setLoadingVotes(false);
        }
      }
    }

    loadPageData();

    return () => {
      cancelled = true;
    };
  }, [estateIds]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();

    return estates.filter((e) => {
      if (e.Status === "Closed") return false;

      const name = (e["Estate Name"] ?? "").toLowerCase();
      const id = (e["Estate ID"] ?? "").toLowerCase();

      if (qq && !name.includes(qq) && !id.includes(qq)) return false;
      if (filterRestaurant && e["Restaurant (Y/N)"] !== "Y") return false;
      if (filterAppointment && e["Appointment Only (Y/N)"] !== "Y") return false;

      return true;
    });
  }, [estates, q, filterRestaurant, filterAppointment]);

  const visitedCount = useMemo(() => {
    return estates.filter((e) => visitedIds.has(e["Estate ID"])).length;
  }, [estates, visitedIds]);

  function handleEditNotesClick(estateId: string, visited: boolean) {
    if (visited) {
      window.location.href = `/visits#${encodeURIComponent(estateId)}`;
      return;
    }

    showToast(
      "You can only edit notes after marking an estate as visited.",
      "info"
    );
  }

  async function toggleFavorite(estateId: string) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user ?? null;

    if (!user) {
      showToast("Please log in to use favourites.", "error");
      return;
    }

    if (!visitedIds.has(estateId)) {
      showToast("You can only favourite estates you have visited.", "info");
      return;
    }

    const nextFavorite = !favoriteIds.has(estateId);

    const { data: existingRows, error: loadError } = await supabase
      .from("visits")
      .select("*")
      .eq("user_id", user.id)
      .eq("estate_id", estateId)
      .limit(1);

    if (loadError || !existingRows || existingRows.length === 0) {
      showToast("Could not load favourite status.", "error");
      return;
    }

    const existingVisit = existingRows[0];

    const payload = {
      user_id: user.id,
      estate_id: estateId,
      favorite_red: existingVisit.favorite_red ?? null,
      favorite_white: existingVisit.favorite_white ?? null,
      favorite_rose: existingVisit.favorite_rose ?? null,
      comments: existingVisit.comments ?? null,
      is_favorite: nextFavorite,
    };

    const { data, error } = await supabase
      .from("visits")
      .upsert(payload, {
        onConflict: "user_id,estate_id",
      })
      .select();

    if (error || !data || data.length === 0) {
      showToast("Could not update favourite.", "error");
      return;
    }

    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (nextFavorite) {
        next.add(estateId);
      } else {
        next.delete(estateId);
      }
      return next;
    });

    showToast(
      nextFavorite ? "Added to favourites" : "Removed from favourites",
      nextFavorite ? "success" : "info"
    );
  }

  return (
    <>
      <div>
        <div className="rounded-2xl border p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-gray-700">
              Visited: {loadingVisited ? "..." : visitedCount}/{estates.length}
            </div>

            <div className="text-xs text-gray-500">
              {loadingVotes ? "Loading kid-friendly votes..." : "Votes ready"}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Search ${regionName} estates...`}
              className="w-full rounded-xl border px-3 py-2 text-sm"
            />
            <button
              onClick={() => setQ("")}
              className="rounded-xl border px-3 py-2 text-sm transition hover:bg-gray-50 active:scale-[0.98]"
            >
              Clear
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => setFilterRestaurant((v) => !v)}
              className={`rounded-full border px-3 py-1 text-xs transition active:scale-[0.98] ${
                filterRestaurant ? "border-black bg-black text-white" : "hover:bg-gray-50"
              }`}
            >
              Restaurant
            </button>

            <button
              onClick={() => setFilterAppointment((v) => !v)}
              className={`rounded-full border px-3 py-1 text-xs transition active:scale-[0.98] ${
                filterAppointment ? "border-black bg-black text-white" : "hover:bg-gray-50"
              }`}
            >
              Appointment
            </button>
          </div>

          <div className="mt-2 text-xs text-gray-500">
            Showing {filtered.length} of {estates.length}
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {filtered.map((e) => {
            const id = e["Estate ID"];
            const name = e["Estate Name"];
            const visited = visitedIds.has(id);
            const isFavorite = favoriteIds.has(id);
            const summary = votes[id] ?? { up: 0, down: 0, myVote: null };
            const showKidFriendlyBadge = summary.up >= 20;

            return (
              <div key={id} className="rounded-2xl border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="font-semibold">{name}</div>

                      {visited && (
                        <button
                          type="button"
                          onClick={() => toggleFavorite(id)}
                          className={`rounded-full border px-3 py-1 text-sm transition hover:bg-gray-50 active:translate-y-[1px] ${
                            isFavorite
                              ? "border-pink-300 bg-pink-50 text-pink-700"
                              : "border-gray-300 bg-white text-gray-500"
                          }`}
                          title={isFavorite ? "Remove from favourites" : "Add to favourites"}
                        >
                          {isFavorite ? "♥" : "♡"}
                        </button>
                      )}

                      {showKidFriendlyBadge && (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                          Kid-friendly
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-gray-500">{id}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <VisitedToggle
                      estateId={id}
                      visited={visited}
                      onChange={(estateId, nowVisited) => {
                        setVisitedIds((prev) => {
                          const next = new Set(prev);

                          if (nowVisited) {
                            next.add(estateId);
                          } else {
                            next.delete(estateId);
                          }

                          return next;
                        });

                        setFavoriteIds((prev) => {
                          if (nowVisited) return prev;
                          const next = new Set(prev);
                          next.delete(estateId);
                          return next;
                        });

                        if (nowVisited) {
                          showToast("Estate marked as visited.", "success");
                        } else {
                          showToast("Estate removed from visits.", "info");
                        }
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => handleEditNotesClick(id, visited)}
                      className="rounded-full border px-3 py-1 text-xs shadow-sm transition hover:bg-gray-50 active:translate-y-[1px] active:shadow-none"
                    >
                      Edit notes
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <KidFriendlyVote
                    estateId={id}
                    initialUpvotes={summary.up}
                    initialDownvotes={summary.down}
                    initialUserVote={summary.myVote}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Toast show={toast.show} message={toast.message} tone={toast.tone} />
    </>
  );
}