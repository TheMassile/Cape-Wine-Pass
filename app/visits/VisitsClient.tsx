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

/* ── small reusable label ── */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{
      display: "block",
      fontSize: "0.58rem", letterSpacing: "0.18em",
      textTransform: "uppercase", color: "#B8AFA0",
      marginBottom: "0.45rem",
    }}>
      {children}
    </label>
  );
}

export default function VisitsClient() {
  const [loading, setLoading]           = useState(true);
  const [isLoggedIn, setIsLoggedIn]     = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [visitRows, setVisitRows]       = useState<VisitRow[]>([]);
  const [estates, setEstates]           = useState<EstateRow[]>([]);
  const [upvoteMap, setUpvoteMap]       = useState<Record<string, number>>({});
  const [downvoteMap, setDownvoteMap]   = useState<Record<string, number>>({});
  const [myVoteMap, setMyVoteMap]       = useState<Record<string, 1 | -1 | null>>({});
  const [editStateMap, setEditStateMap] = useState<Record<string, VisitEditorState>>({});
  const [sortMode, setSortMode]         = useState<SortMode>("recent");
  const [toast, setToast]               = useState<ToastState>({ show: false, message: "", tone: "info" });

  function showToast(message: string, tone: "success" | "error" | "info" = "info") {
    setToast({ show: true, message, tone });
    window.setTimeout(() => setToast(prev => ({ ...prev, show: false })), 2200);
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user ?? null;

        if (!user) {
          if (!cancelled) { setIsLoggedIn(false); setCurrentUserId(null); setLoading(false); }
          return;
        }
        if (!cancelled) { setIsLoggedIn(true); setCurrentUserId(user.id); }

        const { data: visitsData, error: visitsError } = await supabase
          .from("visits").select("*").eq("user_id", user.id).order("visited_at", { ascending: false });

        if (visitsError) { showToast(`Could not load visits: ${visitsError.message}`, "error"); if (!cancelled) setLoading(false); return; }

        const cleanVisits = (visitsData ?? []) as VisitRow[];
        const uniqueIds = Array.from(new Set(cleanVisits.map(r => r.estate_id).filter(Boolean)));

        if (uniqueIds.length === 0) {
          if (!cancelled) { setVisitRows([]); setEstates([]); setUpvoteMap({}); setDownvoteMap({}); setMyVoteMap({}); setEditStateMap({}); setLoading(false); }
          return;
        }

        const { data: estateData, error: estateError } = await supabase
          .from("estates")
          .select(`estate_id:"Estate ID", estate_name:"Estate Name", region:Region`)
          .in('"Estate ID"', uniqueIds);

        if (estateError) { showToast(`Could not load estates: ${estateError.message}`, "error"); if (!cancelled) setLoading(false); return; }

        const { data: voteData } = await supabase
          .from("estate_kid_friendly_votes").select("estate_id, vote, user_id").in("estate_id", uniqueIds);

        const voteRows = (voteData ?? []) as VoteRow[];
        const nextUp: Record<string, number> = {};
        const nextDown: Record<string, number> = {};
        const nextMyVote: Record<string, 1 | -1 | null> = {};
        const nextEdit: Record<string, VisitEditorState> = {};

        for (const id of uniqueIds) {
          const ev = voteRows.filter(r => r.estate_id === id);
          nextUp[id]     = ev.filter(r => r.vote === 1).length;
          nextDown[id]   = ev.filter(r => r.vote === -1).length;
          const mv       = ev.find(r => r.user_id === user.id)?.vote;
          nextMyVote[id] = mv === 1 ? 1 : mv === -1 ? -1 : null;
          const visit    = cleanVisits.find(r => r.estate_id === id);
          nextEdit[id]   = { favorite_red: visit?.favorite_red ?? "", favorite_white: visit?.favorite_white ?? "", favorite_rose: visit?.favorite_rose ?? "", comments: visit?.comments ?? "", saving: false, savedMessage: "" };
        }

        if (!cancelled) {
          setVisitRows(cleanVisits);
          setEstates(estateData as EstateRow[]);
          setUpvoteMap(nextUp); setDownvoteMap(nextDown); setMyVoteMap(nextMyVote); setEditStateMap(nextEdit);
          setLoading(false);
        }
      } catch {
        if (!cancelled) { setVisitRows([]); setEstates([]); setUpvoteMap({}); setDownvoteMap({}); setMyVoteMap({}); setEditStateMap({}); setLoading(false); }
        showToast("Something went wrong while loading visits.", "error");
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!loading && typeof window !== "undefined" && window.location.hash) {
      const id = decodeURIComponent(window.location.hash.replace("#", ""));
      const target = document.getElementById(`visit-${id}`);
      if (target) { target.scrollIntoView({ behavior: "smooth", block: "center" }); (target.querySelector("textarea") as HTMLTextAreaElement | null)?.focus(); }
    }
  }, [loading]);

  const estateMap = useMemo(() => { const m = new Map<string, EstateRow>(); for (const e of estates) m.set(e.estate_id, e); return m; }, [estates]);

  const sortedVisits = useMemo(() => {
    const rows = [...visitRows];
    if (sortMode === "favorites") {
      return rows.sort((a, b) => {
        const diff = (b.is_favorite ? 1 : 0) - (a.is_favorite ? 1 : 0);
        if (diff !== 0) return diff;
        return (b.visited_at ? new Date(b.visited_at).getTime() : 0) - (a.visited_at ? new Date(a.visited_at).getTime() : 0);
      });
    }
    return rows.sort((a, b) => (b.visited_at ? new Date(b.visited_at).getTime() : 0) - (a.visited_at ? new Date(a.visited_at).getTime() : 0));
  }, [visitRows, sortMode]);

  const totalVisited   = visitRows.length;
  const totalFavorites = visitRows.filter(r => Boolean(r.is_favorite)).length;

  function getSaved(id: string) {
    const r = visitRows.find(v => v.user_id === currentUserId && v.estate_id === id);
    return { favorite_red: r?.favorite_red ?? "", favorite_white: r?.favorite_white ?? "", favorite_rose: r?.favorite_rose ?? "", comments: r?.comments ?? "" };
  }

  function isDirty(id: string) {
    const ed = editStateMap[id]; if (!ed) return false;
    const sv = getSaved(id);
    return ed.favorite_red !== sv.favorite_red || ed.favorite_white !== sv.favorite_white || ed.favorite_rose !== sv.favorite_rose || ed.comments !== sv.comments;
  }

  async function saveNotes(estateId: string) {
    const state = editStateMap[estateId];
    if (!state || !currentUserId) return;
    setEditStateMap(prev => ({ ...prev, [estateId]: { ...prev[estateId], saving: true, savedMessage: "" } }));
    const existing = visitRows.find(r => r.user_id === currentUserId && r.estate_id === estateId);
    const { data, error } = await supabase.from("visits").upsert({
      user_id: currentUserId, estate_id: estateId,
      favorite_red: state.favorite_red.trim() || null,
      favorite_white: state.favorite_white.trim() || null,
      favorite_rose: state.favorite_rose.trim() || null,
      comments: state.comments.trim() || null,
      is_favorite: existing?.is_favorite ?? false,
    }, { onConflict: "user_id,estate_id" }).select();

    if (error || !data || data.length === 0) {
      setEditStateMap(prev => ({ ...prev, [estateId]: { ...prev[estateId], saving: false, savedMessage: "" } }));
      showToast(error ? `Could not save: ${error.message}` : "Could not confirm save.", "error"); return;
    }
    const saved = data[0] as VisitRow;
    setVisitRows(prev => prev.map(r => r.user_id === currentUserId && r.estate_id === estateId ? saved : r));
    setEditStateMap(prev => ({ ...prev, [estateId]: { ...prev[estateId], favorite_red: saved.favorite_red ?? "", favorite_white: saved.favorite_white ?? "", favorite_rose: saved.favorite_rose ?? "", comments: saved.comments ?? "", saving: false, savedMessage: "Saved" } }));
    showToast("Notes saved", "success");
    window.setTimeout(() => setEditStateMap(prev => prev[estateId] ? { ...prev, [estateId]: { ...prev[estateId], savedMessage: "" } } : prev), 2000);
  }

  async function toggleFavorite(estateId: string) {
    if (!currentUserId) return;
    const existing = visitRows.find(r => r.user_id === currentUserId && r.estate_id === estateId);
    if (!existing) return;
    const next = !Boolean(existing.is_favorite);
    const { data, error } = await supabase.from("visits").upsert({
      user_id: currentUserId, estate_id: estateId,
      favorite_red: existing.favorite_red ?? null, favorite_white: existing.favorite_white ?? null,
      favorite_rose: existing.favorite_rose ?? null, comments: existing.comments ?? null, is_favorite: next,
    }, { onConflict: "user_id,estate_id" }).select();
    if (error || !data || data.length === 0) { showToast(error ? `Could not update favourite: ${error.message}` : "Could not confirm.", "error"); return; }
    setVisitRows(prev => prev.map(r => r.user_id === currentUserId && r.estate_id === estateId ? data[0] as VisitRow : r));
    showToast(next ? "Added to favourites" : "Removed from favourites", next ? "success" : "info");
  }

  /* ── SHARED CARD WRAPPER ── */
  const cardStyle: React.CSSProperties = {
    background: "#2C2420",
    border: "1px solid rgba(184,150,90,0.18)",
    padding: "2rem",
    marginBottom: "1px",
  };

  /* ── STATES ── */
  if (loading) return (
    <>
      <div style={{ ...cardStyle, color: "#8C8070", fontSize: "0.78rem", letterSpacing: "0.1em", marginTop: "2rem" }}>
        Loading your visits…
      </div>
      <Toast show={toast.show} message={toast.message} tone={toast.tone} />
    </>
  );

  if (!isLoggedIn) return (
    <>
      <div style={{ ...cardStyle, marginTop: "2rem" }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", color: "#F5F0E8", marginBottom: "0.5rem" }}>Sign in to see your visits</div>
        <p style={{ fontSize: "0.75rem", color: "#8C8070", lineHeight: 1.7 }}>Your visited estates and tasting notes are saved to your account.</p>
      </div>
      <Toast show={toast.show} message={toast.message} tone={toast.tone} />
    </>
  );

  if (visitRows.length === 0) return (
    <>
      <div style={{ ...cardStyle, marginTop: "2rem" }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", color: "#F5F0E8", marginBottom: "0.5rem" }}>No visits yet</div>
        <p style={{ fontSize: "0.75rem", color: "#8C8070", lineHeight: 1.7 }}>Head to the regions page to start marking estates as visited.</p>
      </div>
      <Toast show={toast.show} message={toast.message} tone={toast.tone} />
    </>
  );

  return (
    <>
      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1px", background: "rgba(184,150,90,0.12)", border: "1px solid rgba(184,150,90,0.12)", marginTop: "2rem", marginBottom: "2rem" }}>
        {[
          { label: "Total visited", value: totalVisited },
          { label: "Favourites", value: totalFavorites },
          { label: "Sort", value: null },
        ].map((s, i) => (
          <div key={i} style={{ background: "#2C2420", padding: "1.5rem 1.8rem" }}>
            <div style={{ fontSize: "0.58rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "#8C8070", marginBottom: "0.5rem" }}>{s.label}</div>
            {s.value !== null ? (
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.2rem", fontWeight: 300, color: "#D4AE7A", lineHeight: 1 }}>{s.value}</div>
            ) : (
              <select
                value={sortMode}
                onChange={e => setSortMode(e.target.value as SortMode)}
                style={{ background: "transparent", border: "none", color: "#D4AE7A", fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem", cursor: "pointer", padding: 0, outline: "none" }}
              >
                <option value="recent" style={{ background: "#2C2420" }}>Most recent</option>
                <option value="favorites" style={{ background: "#2C2420" }}>Favourites first</option>
              </select>
            )}
          </div>
        ))}
      </div>

      {/* Visit cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "rgba(184,150,90,0.1)" }}>
        {sortedVisits.map(visit => {
          const estate = estateMap.get(visit.estate_id);
          if (!estate) return null;

          const upvotes   = upvoteMap[estate.estate_id] ?? 0;
          const downvotes = downvoteMap[estate.estate_id] ?? 0;
          const myVote    = myVoteMap[estate.estate_id] ?? null;
          const editor    = editStateMap[estate.estate_id];
          const dirty     = isDirty(estate.estate_id);
          const isFav     = Boolean(visit.is_favorite);
          const visitDate = visit.visited_at ? new Date(visit.visited_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }) : null;

          return (
            <div
              id={`visit-${estate.estate_id}`}
              key={estate.estate_id}
              style={{ background: isFav ? "rgba(107,26,42,0.18)" : "#2C2420", padding: "2rem", position: "relative", transition: "background 0.2s" }}
            >
              {/* Top accent for favourites */}
              {isFav && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(to right, #6B1A2A, #B8965A)" }} />}

              {/* Header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "1.2rem", flexWrap: "wrap" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.3rem" }}>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", fontWeight: 400, color: "#F5F0E8" }}>
                      {estate.estate_name}
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(estate.estate_id)}
                      title={isFav ? "Remove from favourites" : "Add to favourites"}
                      style={{
                        background: "none", border: "none", cursor: "pointer", padding: 0,
                        fontSize: "1rem", color: isFav ? "#D4AE7A" : "#8C8070",
                        transition: "color 0.2s", lineHeight: 1,
                      }}
                    >
                      {isFav ? "♥" : "♡"}
                    </button>
                  </div>
                  <div style={{ fontSize: "0.62rem", color: "#8C8070", letterSpacing: "0.08em" }}>
                    {estate.region}{visitDate ? ` · Visited ${visitDate}` : ""}
                  </div>
                </div>

                {upvotes >= 20 && (
                  <span style={{
                    fontSize: "0.55rem", letterSpacing: "0.18em", textTransform: "uppercase",
                    color: "#8CB87A", border: "1px solid rgba(140,184,122,0.35)",
                    padding: "0.25rem 0.7rem",
                  }}>
                    Kid-friendly
                  </span>
                )}
              </div>

              {/* Kid friendly vote */}
              <div style={{ marginBottom: "1.5rem" }}>
                <KidFriendlyVote
                  estateId={estate.estate_id}
                  initialUpvotes={upvotes}
                  initialDownvotes={downvotes}
                  initialUserVote={myVote}
                />
              </div>

              {/* Tasting notes */}
              {editor && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
                    {(["favorite_red", "favorite_white", "favorite_rose"] as const).map(field => (
                      <div key={field}>
                        <FieldLabel>
                          {field === "favorite_red" ? "Favourite red" : field === "favorite_white" ? "Favourite white" : "Favourite rosé"}
                        </FieldLabel>
                        <input
                          type="text"
                          value={editor[field]}
                          onChange={e => setEditStateMap(prev => ({ ...prev, [estate.estate_id]: { ...prev[estate.estate_id], [field]: e.target.value, savedMessage: "" } }))}
                          placeholder={field === "favorite_red" ? "e.g. Pinotage Reserve" : field === "favorite_white" ? "e.g. Chenin Blanc" : "e.g. Dry Rosé"}
                          style={{ width: "100%", padding: "0.7rem 1rem" }}
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <FieldLabel>Notes & comments</FieldLabel>
                    <textarea
                      value={editor.comments}
                      onChange={e => setEditStateMap(prev => ({ ...prev, [estate.estate_id]: { ...prev[estate.estate_id], comments: e.target.value, savedMessage: "" } }))}
                      placeholder="Notes, tasting thoughts, atmosphere, food, service…"
                      style={{ width: "100%", padding: "0.7rem 1rem", minHeight: "90px", resize: "vertical" }}
                    />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <button
                      type="button"
                      onClick={() => saveNotes(estate.estate_id)}
                      disabled={editor.saving || !dirty}
                      style={{
                        background: dirty ? "#6B1A2A" : "transparent",
                        border: dirty ? "1px solid #8C3042" : "1px solid rgba(184,150,90,0.2)",
                        color: dirty ? "#F5F0E8" : "#8C8070",
                        padding: "0.6rem 1.4rem",
                        fontFamily: "'Montserrat', sans-serif",
                        fontSize: "0.62rem", fontWeight: 500,
                        letterSpacing: "0.18em", textTransform: "uppercase",
                        cursor: editor.saving || !dirty ? "not-allowed" : "pointer",
                        opacity: editor.saving ? 0.6 : 1,
                        transition: "all 0.2s",
                      }}
                    >
                      {editor.saving ? "Saving…" : dirty ? "Save notes" : "Saved"}
                    </button>

                    {dirty && !editor.saving && (
                      <span style={{ fontSize: "0.62rem", color: "#B8965A", letterSpacing: "0.1em" }}>Unsaved changes</span>
                    )}
                    {editor.savedMessage && (
                      <span style={{ fontSize: "0.62rem", color: "#8CB87A", letterSpacing: "0.1em" }}>{editor.savedMessage} ✓</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Toast show={toast.show} message={toast.message} tone={toast.tone} />
    </>
  );
}
