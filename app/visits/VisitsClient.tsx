"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import KidFriendlyVote from "@/app/components/KidFriendlyVote";
import Toast from "@/app/components/Toast";

type VisitRow = {
  user_id: string;
  estate_id: string;
  visited_at?: string | null;
  favorite_red?: string | null;
  favorite_white?: string | null;
  favorite_rose?: string | null;
  comments?: string | null;
  is_favorite?: boolean | null;
};

type EstateRow = {
  estate_id: string;
  estate_name: string;
  region: string | null;
};

type VoteRow = {
  estate_id: string;
  vote: number;
  user_id: string;
};

type VisitEditorState = {
  favorite_red: string;
  favorite_white: string;
  favorite_rose: string;
  comments: string;
  saving: boolean;
  savedMessage: string;
};

type ToastState = {
  show: boolean;
  message: string;
  tone: "success" | "error" | "info";
};

type SortMode = "recent" | "favorites";

export default function VisitsClient() {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [visitRows, setVisitRows] = useState<VisitRow[]>([]);
  const [estates, setEstates] = useState<EstateRow[]>([]);
  const [upvoteMap, setUpvoteMap] = useState<Record<string, number>>({});
  const [downvoteMap, setDownvoteMap] = useState<Record<string, number>>({});
  const [myVoteMap, setMyVoteMap] = useState<Record<string, 1 | -1 | null>>({});
  const [editStateMap, setEditStateMap] = useState<Record<string, VisitEditorState>>({});
  const [sortMode, setSortMode] = useState<SortMode>("recent");
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

  useEffect(() => {
    let cancelled = false;

    async function loadVisitsPage() {
      try {
        setLoading(true);

        const {
          data: { session },
        } = await supabase.auth.getSession();

        const user = session?.user ?? null;

        if (!user) {
          if (!cancelled) {
            setIsLoggedIn(false);
            setCurrentUserId(null);
            setLoading(false);
          }
          return;
        }

        if (!cancelled) {
          setIsLoggedIn(true);
          setCurrentUserId(user.id);
        }

        const { data: visitsData, error: visitsError } = await supabase
          .from("visits")
          .select("*")
          .eq("user_id", user.id)
          .order("visited_at", { ascending: false });

        if (visitsError) {
          showToast(`Could not load visits: ${visitsError.message}`, "error");
          if (!cancelled) setLoading(false);
          return;
        }

        const cleanVisits = (visitsData ?? []) as VisitRow[];
        const uniqueEstateIds = Array.from(
          new Set(cleanVisits.map((row) => row.estate_id).filter(Boolean))
        );

        if (uniqueEstateIds.length === 0) {
          if (!cancelled) {
            setVisitRows([]);
            setEstates([]);
            setUpvoteMap({});
            setDownvoteMap({});
            setMyVoteMap({});
            setEditStateMap({});
            setLoading(false);
          }
          return;
        }

        const { data: estateRowsData, error: estateRowsError } = await supabase
          .from("estates")
          .select(`
            estate_id:"Estate ID",
            estate_name:"Estate Name",
            region:Region
          `)
          .in('"Estate ID"', uniqueEstateIds);

        if (estateRowsError) {
          showToast(`Could not load estates: ${estateRowsError.message}`, "error");
          if (!cancelled) setLoading(false);
          return;
        }

        const cleanEstates = (estateRowsData ?? []) as EstateRow[];

        const { data: allVotesData } = await supabase
          .from("estate_kid_friendly_votes")
          .select("estate_id, vote, user_id")
          .in("estate_id", uniqueEstateIds);

        const voteRows = (allVotesData ?? []) as VoteRow[];

        const nextUpvoteMap: Record<string, number> = {};
        const nextDownvoteMap: Record<string, number> = {};
        const nextMyVoteMap: Record<string, 1 | -1 | null> = {};
        const nextEditStateMap: Record<string, VisitEditorState> = {};

        for (const estateId of uniqueEstateIds) {
          const estateVotes = voteRows.filter((row) => row.estate_id === estateId);

          nextUpvoteMap[estateId] = estateVotes.filter((row) => row.vote === 1).length;
          nextDownvoteMap[estateId] = estateVotes.filter((row) => row.vote === -1).length;

          const myVote = estateVotes.find((row) => row.user_id === user.id)?.vote;
          nextMyVoteMap[estateId] = myVote === 1 ? 1 : myVote === -1 ? -1 : null;

          const visit = cleanVisits.find((row) => row.estate_id === estateId);

          nextEditStateMap[estateId] = {
            favorite_red: visit?.favorite_red ?? "",
            favorite_white: visit?.favorite_white ?? "",
            favorite_rose: visit?.favorite_rose ?? "",
            comments: visit?.comments ?? "",
            saving: false,
            savedMessage: "",
          };
        }

        if (!cancelled) {
          setVisitRows(cleanVisits);
          setEstates(cleanEstates);
          setUpvoteMap(nextUpvoteMap);
          setDownvoteMap(nextDownvoteMap);
          setMyVoteMap(nextMyVoteMap);
          setEditStateMap(nextEditStateMap);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setVisitRows([]);
          setEstates([]);
          setUpvoteMap({});
          setDownvoteMap({});
          setMyVoteMap({});
          setEditStateMap({});
          setLoading(false);
        }
        showToast("Something went wrong while loading visits.", "error");
      }
    }

    loadVisitsPage();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loading && typeof window !== "undefined" && window.location.hash) {
      const idFromHash = decodeURIComponent(window.location.hash.replace("#", ""));
      const target = document.getElementById(`visit-${idFromHash}`);

      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });

        const textarea = target.querySelector("textarea") as HTMLTextAreaElement | null;
        if (textarea) {
          textarea.focus();
        }
      }
    }
  }, [loading]);

  const estateMap = useMemo(() => {
    const map = new Map<string, EstateRow>();
    for (const estate of estates) {
      map.set(estate.estate_id, estate);
    }
    return map;
  }, [estates]);

  const sortedVisitRows = useMemo(() => {
    const rows = [...visitRows];

    if (sortMode === "favorites") {
      rows.sort((a, b) => {
        const aFav = a.is_favorite ? 1 : 0;
        const bFav = b.is_favorite ? 1 : 0;

        if (aFav !== bFav) return bFav - aFav;

        const aTime = a.visited_at ? new Date(a.visited_at).getTime() : 0;
        const bTime = b.visited_at ? new Date(b.visited_at).getTime() : 0;
        return bTime - aTime;
      });

      return rows;
    }

    rows.sort((a, b) => {
      const aTime = a.visited_at ? new Date(a.visited_at).getTime() : 0;
      const bTime = b.visited_at ? new Date(b.visited_at).getTime() : 0;
      return bTime - aTime;
    });

    return rows;
  }, [visitRows, sortMode]);

  const totalVisited = visitRows.length;
  const totalFavorites = visitRows.filter((row) => Boolean(row.is_favorite)).length;
  const currentSortLabel = sortMode === "recent" ? "Most recent" : "Favourites first";

  function getSavedValues(estateId: string) {
    const row = visitRows.find(
      (visit) => visit.user_id === currentUserId && visit.estate_id === estateId
    );

    return {
      favorite_red: row?.favorite_red ?? "",
      favorite_white: row?.favorite_white ?? "",
      favorite_rose: row?.favorite_rose ?? "",
      comments: row?.comments ?? "",
    };
  }

  function hasUnsavedChanges(estateId: string) {
    const editor = editStateMap[estateId];
    if (!editor) return false;

    const saved = getSavedValues(estateId);

    return (
      editor.favorite_red !== saved.favorite_red ||
      editor.favorite_white !== saved.favorite_white ||
      editor.favorite_rose !== saved.favorite_rose ||
      editor.comments !== saved.comments
    );
  }

  async function saveVisitNotes(estateId: string) {
    const state = editStateMap[estateId];
    if (!state || !currentUserId) return;

    setEditStateMap((prev) => ({
      ...prev,
      [estateId]: {
        ...prev[estateId],
        saving: true,
        savedMessage: "",
      },
    }));

    const existingVisit = visitRows.find(
      (row) => row.user_id === currentUserId && row.estate_id === estateId
    );

    const payload = {
      user_id: currentUserId,
      estate_id: estateId,
      favorite_red: state.favorite_red.trim() || null,
      favorite_white: state.favorite_white.trim() || null,
      favorite_rose: state.favorite_rose.trim() || null,
      comments: state.comments.trim() || null,
      is_favorite: existingVisit?.is_favorite ?? false,
    };

    const { data, error } = await supabase
      .from("visits")
      .upsert(payload, {
        onConflict: "user_id,estate_id",
      })
      .select();

    if (error) {
      setEditStateMap((prev) => ({
        ...prev,
        [estateId]: {
          ...prev[estateId],
          saving: false,
          savedMessage: "",
        },
      }));
      showToast(`Could not save notes: ${error.message}`, "error");
      return;
    }

    if (!data || data.length === 0) {
      setEditStateMap((prev) => ({
        ...prev,
        [estateId]: {
          ...prev[estateId],
          saving: false,
          savedMessage: "",
        },
      }));
      showToast("Could not confirm that notes were saved.", "error");
      return;
    }

    const savedRow = data[0] as VisitRow;

    setVisitRows((prev) => {
      const existingIndex = prev.findIndex(
        (row) => row.user_id === currentUserId && row.estate_id === estateId
      );

      if (existingIndex === -1) {
        return [savedRow, ...prev];
      }

      return prev.map((row) =>
        row.user_id === currentUserId && row.estate_id === estateId ? savedRow : row
      );
    });

    setEditStateMap((prev) => ({
      ...prev,
      [estateId]: {
        ...prev[estateId],
        favorite_red: savedRow.favorite_red ?? "",
        favorite_white: savedRow.favorite_white ?? "",
        favorite_rose: savedRow.favorite_rose ?? "",
        comments: savedRow.comments ?? "",
        saving: false,
        savedMessage: "Saved",
      },
    }));

    showToast("Notes saved", "success");

    window.setTimeout(() => {
      setEditStateMap((prev) => {
        const current = prev[estateId];
        if (!current) return prev;

        return {
          ...prev,
          [estateId]: {
            ...current,
            savedMessage: "",
          },
        };
      });
    }, 2000);
  }

  async function toggleFavorite(estateId: string) {
    if (!currentUserId) return;

    const existingVisit = visitRows.find(
      (row) => row.user_id === currentUserId && row.estate_id === estateId
    );

    if (!existingVisit) return;

    const nextFavorite = !Boolean(existingVisit.is_favorite);

    const payload = {
      user_id: currentUserId,
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

    if (error) {
      showToast(`Could not update favourite: ${error.message}`, "error");
      return;
    }

    if (!data || data.length === 0) {
      showToast("Could not confirm favourite update.", "error");
      return;
    }

    const savedRow = data[0] as VisitRow;

    setVisitRows((prev) =>
      prev.map((row) =>
        row.user_id === currentUserId && row.estate_id === estateId ? savedRow : row
      )
    );

    showToast(
      nextFavorite ? "Added to favourites" : "Removed from favourites",
      nextFavorite ? "success" : "info"
    );
  }

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.href = "/regions";
  }

  const backButtonClass =
    "inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 shadow-sm transition hover:bg-gray-50 hover:shadow active:translate-y-[1px] active:shadow-none focus:outline-none focus:ring-2 focus:ring-gray-300";

  if (loading) {
    return (
      <>
        <main className="mx-auto max-w-4xl p-6">
          <div className="mb-4">
            <button
              type="button"
              onClick={goBack}
              className={backButtonClass}
            >
              <span aria-hidden="true">←</span>
              <span>Back</span>
            </button>
          </div>

          <h1 className="mb-6 text-2xl font-bold">My Visits</h1>
          <p>Loading your visits...</p>
        </main>

        <Toast show={toast.show} message={toast.message} tone={toast.tone} />
      </>
    );
  }

  if (!isLoggedIn) {
    return (
      <>
        <main className="mx-auto max-w-4xl p-6">
          <div className="mb-4">
            <button
              type="button"
              onClick={goBack}
              className={backButtonClass}
            >
              <span aria-hidden="true">←</span>
              <span>Back</span>
            </button>
          </div>

          <h1 className="mb-6 text-2xl font-bold">My Visits</h1>
          <p>Please log in to see your visited estates.</p>
        </main>

        <Toast show={toast.show} message={toast.message} tone={toast.tone} />
      </>
    );
  }

  if (visitRows.length === 0) {
    return (
      <>
        <main className="mx-auto max-w-4xl p-6">
          <div className="mb-4">
            <button
              type="button"
              onClick={goBack}
              className={backButtonClass}
            >
              <span aria-hidden="true">←</span>
              <span>Back</span>
            </button>
          </div>

          <h1 className="mb-6 text-2xl font-bold">My Visits</h1>
          <p>You have not marked any estates as visited yet.</p>
        </main>

        <Toast show={toast.show} message={toast.message} tone={toast.tone} />
      </>
    );
  }

  return (
    <>
      <main className="mx-auto max-w-4xl p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goBack}
            className={backButtonClass}
          >
            <span aria-hidden="true">←</span>
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            <label htmlFor="visit-sort" className="text-sm text-gray-600">
              Sort
            </label>
            <select
              id="visit-sort"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="rounded-lg border px-3 py-2 text-sm"
            >
              <option value="recent">Most recent</option>
              <option value="favorites">Favourites first</option>
            </select>
          </div>
        </div>

        <h1 className="mb-4 text-2xl font-bold">My Visits</h1>

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-sm text-gray-500">Total visited</div>
            <div className="mt-1 text-2xl font-semibold">{totalVisited}</div>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-sm text-gray-500">Favourites</div>
            <div className="mt-1 text-2xl font-semibold">{totalFavorites}</div>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-sm text-gray-500">Current sort</div>
            <div className="mt-1 text-2xl font-semibold">{currentSortLabel}</div>
          </div>
        </div>

        <div className="space-y-4">
          {sortedVisitRows.map((visit) => {
            const estate = estateMap.get(visit.estate_id);

            if (!estate) return null;

            const upvotes = upvoteMap[estate.estate_id] ?? 0;
            const downvotes = downvoteMap[estate.estate_id] ?? 0;
            const myVote = myVoteMap[estate.estate_id] ?? null;
            const showKidFriendlyBadge = upvotes >= 20;
            const editor = editStateMap[estate.estate_id];
            const dirty = hasUnsavedChanges(estate.estate_id);
            const isFavorite = Boolean(visit.is_favorite);

            return (
              <div
                id={`visit-${estate.estate_id}`}
                key={estate.estate_id}
                className="rounded-2xl border bg-white p-4 shadow-sm"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-lg font-semibold">{estate.estate_name}</div>

                      <button
                        type="button"
                        onClick={() => toggleFavorite(estate.estate_id)}
                        className={`rounded-full border px-3 py-1 text-sm transition hover:bg-gray-50 active:translate-y-[1px] ${
                          isFavorite
                            ? "border-pink-300 bg-pink-50 text-pink-700"
                            : "border-gray-300 bg-white text-gray-500"
                        }`}
                        title={isFavorite ? "Remove from favourites" : "Add to favourites"}
                      >
                        {isFavorite ? "♥" : "♡"}
                      </button>
                    </div>

                    <div className="text-sm text-gray-500">{estate.region}</div>
                  </div>

                  {showKidFriendlyBadge && (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                      Kid-friendly
                    </span>
                  )}
                </div>

                <div className="mb-4">
                  <KidFriendlyVote
                    estateId={estate.estate_id}
                    initialUpvotes={upvotes}
                    initialDownvotes={downvotes}
                    initialUserVote={myVote}
                  />
                </div>

                {editor && (
                  <div className="grid gap-3">
                    <div className="grid gap-3 md:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Favourite red
                        </label>
                        <input
                          type="text"
                          value={editor.favorite_red}
                          onChange={(e) =>
                            setEditStateMap((prev) => ({
                              ...prev,
                              [estate.estate_id]: {
                                ...prev[estate.estate_id],
                                favorite_red: e.target.value,
                                savedMessage: "",
                              },
                            }))
                          }
                          className="w-full rounded-lg border px-3 py-2 text-sm"
                          placeholder="Your favourite red"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Favourite white
                        </label>
                        <input
                          type="text"
                          value={editor.favorite_white}
                          onChange={(e) =>
                            setEditStateMap((prev) => ({
                              ...prev,
                              [estate.estate_id]: {
                                ...prev[estate.estate_id],
                                favorite_white: e.target.value,
                                savedMessage: "",
                              },
                            }))
                          }
                          className="w-full rounded-lg border px-3 py-2 text-sm"
                          placeholder="Your favourite white"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Favourite rosé
                        </label>
                        <input
                          type="text"
                          value={editor.favorite_rose}
                          onChange={(e) =>
                            setEditStateMap((prev) => ({
                              ...prev,
                              [estate.estate_id]: {
                                ...prev[estate.estate_id],
                                favorite_rose: e.target.value,
                                savedMessage: "",
                              },
                            }))
                          }
                          className="w-full rounded-lg border px-3 py-2 text-sm"
                          placeholder="Your favourite rosé"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Comments
                      </label>
                      <textarea
                        value={editor.comments}
                        onChange={(e) =>
                          setEditStateMap((prev) => ({
                            ...prev,
                            [estate.estate_id]: {
                              ...prev[estate.estate_id],
                              comments: e.target.value,
                              savedMessage: "",
                            },
                          }))
                        }
                        className="min-h-[110px] w-full rounded-lg border px-3 py-2 text-sm"
                        placeholder="Notes, tasting thoughts, atmosphere, food, service..."
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => saveVisitNotes(estate.estate_id)}
                        disabled={editor.saving || !dirty}
                        className={`rounded-lg px-4 py-2 text-sm text-white disabled:opacity-60 ${
                          dirty ? "bg-black" : "bg-gray-500"
                        }`}
                      >
                        {editor.saving
                          ? "Saving..."
                          : dirty
                          ? "Save changes"
                          : "Saved"}
                      </button>

                      {dirty && !editor.saving && (
                        <span className="text-sm text-amber-700">Unsaved changes</span>
                      )}

                      {editor.savedMessage && (
                        <span className="text-sm text-green-700">{editor.savedMessage}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      <Toast show={toast.show} message={toast.message} tone={toast.tone} />
    </>
  );
}