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
type VoteRow  = { estate_id: string; vote: number; user_id: string };
type VoteSummary = { up: number; down: number; myVote: 1 | -1 | null };
type ToastState  = { show: boolean; message: string; tone: "success" | "error" | "info" };

export default function RegionClient({ regionName, estates }: { regionName: string; estates: EstateRow[] }) {
  const [q, setQ]                           = useState("");
  const [filterRestaurant, setFilterRestaurant] = useState(false);
  const [filterAppointment, setFilterAppointment] = useState(false);
  const [visitedIds, setVisitedIds]         = useState<Set<string>>(new Set());
  const [favoriteIds, setFavoriteIds]       = useState<Set<string>>(new Set());
  const [loadingVisited, setLoadingVisited] = useState(true);
  const [votes, setVotes]                   = useState<Record<string, VoteSummary>>({});
  const [loadingVotes, setLoadingVotes]     = useState(true);
  const [toast, setToast]                   = useState<ToastState>({ show: false, message: "", tone: "info" });

  function showToast(message: string, tone: "success" | "error" | "info" = "info") {
    setToast({ show: true, message, tone });
    window.setTimeout(() => setToast(prev => ({ ...prev, show: false })), 2200);
  }

  const estateIds = useMemo(() => estates.map(e => e["Estate ID"]).filter(Boolean), [estates]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoadingVisited(true); setLoadingVotes(true);
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user ?? null;
        if (!cancelled) { setVisitedIds(new Set()); setFavoriteIds(new Set()); }

        if (user) {
          const { data: visitRows } = await supabase.from("visits").select("*").eq("user_id", user.id);
          const raw = (visitRows ?? []) as VisitRow[];
          const getId = (r: VisitRow) => { const v = r.estate_id ?? r["estate_id"] ?? r["Estate ID"] ?? r.estateId; return typeof v === "string" ? v : null; };
          if (!cancelled) {
            setVisitedIds(new Set(raw.map(getId).filter((id): id is string => Boolean(id))));
            setFavoriteIds(new Set(raw.filter(r => Boolean(r.is_favorite)).map(getId).filter((id): id is string => Boolean(id))));
          }
        }

        if (estateIds.length === 0) { if (!cancelled) { setVotes({}); setLoadingVisited(false); setLoadingVotes(false); } return; }

        const { data: allVotes } = await supabase.from("estate_kid_friendly_votes").select("estate_id, vote, user_id").in("estate_id", estateIds);
        const voteRows = (allVotes ?? []) as VoteRow[];
        const nextVotes: Record<string, VoteSummary> = {};
        for (const id of estateIds) {
          const ev = voteRows.filter(r => r.estate_id === id);
          const mv = user ? ev.find(r => r.user_id === user.id)?.vote : undefined;
          nextVotes[id] = { up: ev.filter(r => r.vote === 1).length, down: ev.filter(r => r.vote === -1).length, myVote: mv === 1 ? 1 : mv === -1 ? -1 : null };
        }
        if (!cancelled) setVotes(nextVotes);
      } catch {
        if (!cancelled) { setVisitedIds(new Set()); setFavoriteIds(new Set()); setVotes({}); }
        showToast("Something went wrong loading this region.", "error");
      } finally {
        if (!cancelled) { setLoadingVisited(false); setLoadingVotes(false); }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [estateIds]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return estates.filter(e => {
      if (e.Status === "Closed") return false;
      const name = (e["Estate Name"] ?? "").toLowerCase();
      const id   = (e["Estate ID"] ?? "").toLowerCase();
      if (qq && !name.includes(qq) && !id.includes(qq)) return false;
      if (filterRestaurant  && e["Restaurant (Y/N)"] !== "Y") return false;
      if (filterAppointment && e["Appointment Only (Y/N)"] !== "Y") return false;
      return true;
    });
  }, [estates, q, filterRestaurant, filterAppointment]);

  const visitedCount = useMemo(() => estates.filter(e => visitedIds.has(e["Estate ID"])).length, [estates, visitedIds]);

  function handleEditNotes(id: string, visited: boolean) {
    if (visited) { window.location.href = `/visits#${encodeURIComponent(id)}`; return; }
    showToast("Mark the estate as visited first to add notes.", "info");
  }

  async function toggleFavorite(estateId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    if (!user) { showToast("Please sign in to use favourites.", "error"); return; }
    if (!visitedIds.has(estateId)) { showToast("Visit the estate first to favourite it.", "info"); return; }
    const nextFav = !favoriteIds.has(estateId);
    const { data: existing, error: le } = await supabase.from("visits").select("*").eq("user_id", user.id).eq("estate_id", estateId).limit(1);
    if (le || !existing || existing.length === 0) { showToast("Could not load favourite status.", "error"); return; }
    const ev = existing[0];
    const { data, error } = await supabase.from("visits").upsert({ user_id: user.id, estate_id: estateId, favorite_red: ev.favorite_red ?? null, favorite_white: ev.favorite_white ?? null, favorite_rose: ev.favorite_rose ?? null, comments: ev.comments ?? null, is_favorite: nextFav }, { onConflict: "user_id,estate_id" }).select();
    if (error || !data || data.length === 0) { showToast("Could not update favourite.", "error"); return; }
    setFavoriteIds(prev => { const next = new Set(prev); nextFav ? next.add(estateId) : next.delete(estateId); return next; });
    showToast(nextFav ? "Added to favourites" : "Removed from favourites", nextFav ? "success" : "info");
  }

  /* ── FILTER CHIP ── */
  const chip = (active: boolean, label: string, onClick: () => void) => (
    <button
      onClick={onClick}
      style={{
        fontSize: "0.58rem", letterSpacing: "0.18em", textTransform: "uppercase",
        padding: "0.35rem 0.9rem", cursor: "pointer", fontFamily: "'Montserrat', sans-serif",
        background: active ? "#6B1A2A" : "transparent",
        border: active ? "1px solid #8C3042" : "1px solid rgba(184,150,90,0.2)",
        color: active ? "#F5F0E8" : "#8C8070",
        transition: "all 0.2s",
      }}
    >
      {label}
    </button>
  );

  return (
    <>
      {/* Controls bar */}
      <div style={{
        background: "#2C2420",
        border: "1px solid rgba(184,150,90,0.18)",
        padding: "1.5rem 2rem",
        marginBottom: "1px",
        position: "relative",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(to right, #6B1A2A, #B8965A)" }} />

        {/* Progress */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.2rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem", color: "#F5F0E8" }}>
            <span style={{ color: "#D4AE7A" }}>{loadingVisited ? "…" : visitedCount}</span>
            <span style={{ color: "#8C8070" }}> / {estates.length} visited</span>
          </div>
          <div style={{ fontSize: "0.58rem", letterSpacing: "0.18em", textTransform: "uppercase", color: loadingVotes ? "#8C8070" : "#B8965A" }}>
            {loadingVotes ? "Loading votes…" : "Votes ready"}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: "1px", background: "rgba(184,150,90,0.12)", marginBottom: "1.2rem" }}>
          <div style={{
            height: "100%",
            width: estates.length > 0 ? `${Math.round(visitedCount / estates.length * 100)}%` : "0%",
            background: "#B8965A", transition: "width 0.4s ease",
          }} />
        </div>

        {/* Search */}
        <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1rem" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <svg style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", width: "12px", height: "12px", stroke: "#8C8070", fill: "none", strokeWidth: 2 }} viewBox="0 0 16 16">
              <circle cx="6.5" cy="6.5" r="4.5"/><line x1="10" y1="10" x2="14" y2="14"/>
            </svg>
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder={`Search ${regionName} estates…`}
              style={{ width: "100%", padding: "0.65rem 1rem 0.65rem 2.2rem" }}
            />
          </div>
          {q && (
            <button
              onClick={() => setQ("")}
              style={{
                background: "transparent", border: "1px solid rgba(184,150,90,0.2)",
                color: "#8C8070", padding: "0.65rem 1rem",
                fontFamily: "'Montserrat', sans-serif", fontSize: "0.6rem",
                letterSpacing: "0.15em", cursor: "pointer",
              }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.8rem" }}>
          {chip(filterRestaurant,  "Restaurant",   () => setFilterRestaurant(v => !v))}
          {chip(filterAppointment, "By appointment", () => setFilterAppointment(v => !v))}
        </div>

        <div style={{ fontSize: "0.58rem", letterSpacing: "0.15em", color: "#8C8070" }}>
          Showing {filtered.length} of {estates.length}
        </div>
      </div>

      {/* Estate list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "rgba(184,150,90,0.08)" }}>
        {filtered.map(e => {
          const id      = e["Estate ID"];
          const name    = e["Estate Name"];
          const visited = visitedIds.has(id);
          const isFav   = favoriteIds.has(id);
          const summary = votes[id] ?? { up: 0, down: 0, myVote: null };

          return (
            <div
              key={id}
              style={{
                background: visited ? "rgba(107,26,42,0.18)" : "#2C2420",
                padding: "1.4rem 2rem",
                transition: "background 0.2s",
                position: "relative",
              }}
            >
              {/* Visited accent */}
              {visited && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "2px", background: "#6B1A2A" }} />}

              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "0.8rem" }}>
                {/* Left: name + tags */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.15rem", fontWeight: 400, color: "#F5F0E8" }}>
                      {name}
                    </span>

                    {visited && (
                      <button
                        type="button"
                        onClick={() => toggleFavorite(id)}
                        title={isFav ? "Remove from favourites" : "Add to favourites"}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: "0.9rem", color: isFav ? "#D4AE7A" : "#8C8070", transition: "color 0.2s", lineHeight: 1 }}
                      >
                        {isFav ? "♥" : "♡"}
                      </button>
                    )}

                    {summary.up >= 20 && (
                      <span style={{ fontSize: "0.5rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#8CB87A", border: "1px solid rgba(140,184,122,0.3)", padding: "0.15rem 0.5rem" }}>
                        Kid-friendly
                      </span>
                    )}

                    {e["Restaurant (Y/N)"] === "Y" && (
                      <span style={{ fontSize: "0.5rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#B8AFA0", border: "1px solid rgba(184,175,160,0.2)", padding: "0.15rem 0.5rem" }}>
                        Restaurant
                      </span>
                    )}

                    {e["Appointment Only (Y/N)"] === "Y" && (
                      <span style={{ fontSize: "0.5rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#B8AFA0", border: "1px solid rgba(184,175,160,0.2)", padding: "0.15rem 0.5rem" }}>
                        By appt
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "0.58rem", color: "#8C8070", letterSpacing: "0.08em" }}>{id}</div>
                </div>

                {/* Right: actions */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexShrink: 0 }}>
                  <VisitedToggle
                    estateId={id}
                    visited={visited}
                    onChange={(estateId, nowVisited) => {
                      setVisitedIds(prev => { const next = new Set(prev); nowVisited ? next.add(estateId) : next.delete(estateId); return next; });
                      setFavoriteIds(prev => { if (nowVisited) return prev; const next = new Set(prev); next.delete(estateId); return next; });
                      showToast(nowVisited ? "Estate marked as visited." : "Estate removed from visits.", nowVisited ? "success" : "info");
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleEditNotes(id, visited)}
                    style={{
                      background: "transparent",
                      border: "1px solid rgba(184,150,90,0.2)",
                      color: visited ? "#D4AE7A" : "#8C8070",
                      padding: "0.4rem 0.9rem",
                      fontFamily: "'Montserrat', sans-serif",
                      fontSize: "0.58rem", letterSpacing: "0.15em",
                      textTransform: "uppercase", cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    Notes
                  </button>
                </div>
              </div>

              {/* Kid friendly vote */}
              <KidFriendlyVote
                estateId={id}
                initialUpvotes={summary.up}
                initialDownvotes={summary.down}
                initialUserVote={summary.myVote}
              />
            </div>
          );
        })}
      </div>

      <Toast show={toast.show} message={toast.message} tone={toast.tone} />
    </>
  );
}
