"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

type RegionRow = { Region: string; total: number };
type EstateRegionRow = { "Estate ID": string | null; Region: string | null };
type EstateSearchRow = { "Estate ID": string; "Estate Name": string; Region: string };

export default function RegionsProgress({ regions }: { regions: RegionRow[] }) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [estateToRegion, setEstateToRegion] = useState<Map<string, string>>(new Map());
  const [visitedByRegion, setVisitedByRegion] = useState<Map<string, number>>(new Map());
  const [totalVisited, setTotalVisited] = useState(0);

  // Global search state
  const [allEstates, setAllEstates] = useState<EstateSearchRow[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive) setUserId(data.session?.user?.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (alive) setUserId(session?.user?.id ?? null);
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  // Load all estates for search + region map
  useEffect(() => {
    let cancelled = false;
    supabase.from("estates").select('"Estate ID","Estate Name","Region"').then(({ data, error }) => {
      if (cancelled || error) return;
      const rows = (data ?? []) as unknown as EstateSearchRow[];
      if (!cancelled) {
        setAllEstates(rows);
        const map = new Map<string, string>();
        for (const row of rows) {
          if (row["Estate ID"] && row.Region) map.set(row["Estate ID"], row.Region);
        }
        setEstateToRegion(map);
      }
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!userId) { setVisitedByRegion(new Map()); setTotalVisited(0); return; }
    supabase.from("visits").select("estate_id").eq("user_id", userId).then(({ data, error }) => {
      if (cancelled || error) return;
      const ids = (data ?? []).map((r: any) => r.estate_id as string).filter(Boolean);
      setTotalVisited(ids.length);
      const counts = new Map<string, number>();
      for (const id of ids) {
        const region = estateToRegion.get(id);
        if (region) counts.set(region, (counts.get(region) ?? 0) + 1);
      }
      if (!cancelled) setVisitedByRegion(counts);
    });
    return () => { cancelled = true; };
  }, [userId, estateToRegion]);

  const rows = useMemo(() => regions.map((r) => {
    const visited = visitedByRegion.get(r.Region) ?? 0;
    const pct = r.total > 0 ? Math.round((visited / r.total) * 100) : 0;
    return { ...r, visited, pct, remaining: Math.max(0, r.total - visited) };
  }), [regions, visitedByRegion]);

  // Search results — filter all estates by name
  const searchResults = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    return allEstates
      .filter(e => (e["Estate Name"] ?? "").toLowerCase().includes(q))
      .slice(0, 8);
  }, [allEstates, searchQ]);

  const showDropdown = searchFocused && searchResults.length > 0;

  function handleSelectEstate(estate: EstateSearchRow) {
    setSearchQ("");
    setSearchFocused(false);
    router.push(`/estate/${encodeURIComponent(estate["Estate ID"])}`);
  }

  return (
    <div style={{ marginTop: "2.5rem" }}>

      {/* ── GLOBAL SEARCH ── */}
      <div style={{ marginBottom: "1.5rem", position: "relative" }}>
        <div style={{ position: "relative" }}>
          <svg style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", width: "14px", height: "14px", stroke: "#B8965A", fill: "none", strokeWidth: 2, zIndex: 1 }} viewBox="0 0 16 16">
            <circle cx="6.5" cy="6.5" r="4.5"/><line x1="10" y1="10" x2="14" y2="14"/>
          </svg>
          <input
            type="text"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
            placeholder="Search any estate across the Western Cape…"
            style={{
              width: "100%",
              padding: "0.9rem 1rem 0.9rem 2.5rem",
              background: "#2C2420",
              border: searchFocused ? "1px solid rgba(184,150,90,0.5)" : "1px solid rgba(184,150,90,0.2)",
              color: "#F5F0E8",
              fontFamily: "'Montserrat', sans-serif",
              fontSize: "0.82rem",
              fontWeight: 300,
              outline: "none",
              transition: "border-color 0.2s",
            }}
          />
          {searchQ && (
            <button
              onClick={() => setSearchQ("")}
              style={{
                position: "absolute", right: "0.8rem", top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", color: "#8C8070", cursor: "pointer",
                fontSize: "1rem", lineHeight: 1, padding: "0.2rem",
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* Search dropdown */}
        {showDropdown && (
          <div style={{
            position: "absolute", top: "100%", left: 0, right: 0,
            background: "#2C2420",
            border: "1px solid rgba(184,150,90,0.3)",
            borderTop: "none",
            zIndex: 50,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}>
            {searchResults.map((estate, i) => (
              <button
                key={estate["Estate ID"]}
                onMouseDown={() => handleSelectEstate(estate)}
                style={{
                  width: "100%", display: "flex",
                  alignItems: "center", justifyContent: "space-between",
                  padding: "0.9rem 1.2rem",
                  background: "transparent",
                  border: "none",
                  borderBottom: i < searchResults.length - 1 ? "1px solid rgba(184,150,90,0.08)" : "none",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.15s",
                }}
                className="search-result-row"
              >
                <div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.05rem", color: "#F5F0E8", marginBottom: "0.15rem" }}>
                    {estate["Estate Name"]}
                  </div>
                  <div style={{ fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8C8070" }}>
                    {estate.Region}
                  </div>
                </div>
                <span style={{ fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#B8965A" }}>
                  View →
                </span>
              </button>
            ))}
            {allEstates.filter(e => (e["Estate Name"] ?? "").toLowerCase().includes(searchQ.trim().toLowerCase())).length > 8 && (
              <div style={{ padding: "0.6rem 1.2rem", fontSize: "0.62rem", color: "#8C8070", letterSpacing: "0.1em", borderTop: "1px solid rgba(184,150,90,0.08)" }}>
                Showing top 8 results — keep typing to narrow down
              </div>
            )}
          </div>
        )}
      </div>

      {/* Progress summary card */}
      <div style={{
        background: "#2C2420",
        border: "1px solid rgba(184,150,90,0.2)",
        padding: "1.8rem 2rem",
        marginBottom: "2rem",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1.2rem",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(to right, #6B1A2A, #B8965A)" }} />

        <div>
          <div style={{ fontSize: "0.58rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "#8C8070", marginBottom: "0.5rem" }}>
            Your progress
          </div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.6rem", fontWeight: 300, color: "#F5F0E8" }}>
            {userId ? (
              <><span style={{ color: "#D4AE7A" }}>{totalVisited}</span> estates visited</>
            ) : (
              "Sign in to track progress"
            )}
          </div>
          <div style={{ fontSize: "0.72rem", color: "#8C8070", marginTop: "0.3rem" }}>
            {userId ? "Your region progress updates automatically." : "Track visits, favourites, notes, and badges once signed in."}
          </div>
        </div>

        <div>
          {userId ? (
            <button
              onClick={() => supabase.auth.signOut()}
              style={{ background: "transparent", border: "1px solid rgba(184,150,90,0.25)", color: "#8C8070", padding: "0.5rem 1.2rem", fontFamily: "'Montserrat', sans-serif", fontSize: "0.62rem", letterSpacing: "0.18em", textTransform: "uppercase", cursor: "pointer" }}
            >
              Sign out
            </button>
          ) : (
            <Link href="/login" style={{ display: "inline-block", background: "#6B1A2A", border: "1px solid #8C3042", color: "#F5F0E8", padding: "0.55rem 1.4rem", fontFamily: "'Montserrat', sans-serif", fontSize: "0.62rem", letterSpacing: "0.18em", textTransform: "uppercase", textDecoration: "none" }}>
              Sign in
            </Link>
          )}
        </div>
      </div>

      {/* Region list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "rgba(184,150,90,0.1)" }}>
        {rows.map((r) => (
          <Link key={r.Region} href={`/region/${encodeURIComponent(r.Region)}`} style={{ textDecoration: "none" }}>
            <div className="region-row" style={{ background: "#2C2420", padding: "1.6rem 2rem", transition: "background 0.2s" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", fontWeight: 400, color: "#F5F0E8", lineHeight: 1.1, marginBottom: "0.3rem" }}>
                    {r.Region}
                  </div>
                  <div style={{ fontSize: "0.62rem", color: "#8C8070", letterSpacing: "0.1em" }}>
                    {r.total} estates
                  </div>
                </div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem", color: "#D4AE7A", whiteSpace: "nowrap", flexShrink: 0 }}>
                  {r.visited}/{r.total}
                </div>
              </div>

              <div style={{ height: "1px", width: "100%", background: "rgba(184,150,90,0.12)", marginBottom: "0.8rem" }}>
                <div style={{ height: "100%", width: `${r.pct}%`, background: r.pct === 100 ? "#8CB87A" : "#B8965A", transition: "width 0.4s ease" }} />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#8C8070" }}>
                  {r.pct}% complete
                </span>
                <span style={{ fontSize: "0.6rem", letterSpacing: "0.12em", color: r.remaining === 0 ? "#8CB87A" : "#8C8070" }}>
                  {r.remaining === 0 ? "Region complete ✓" : `${r.remaining} remaining`}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <style>{`
        .region-row:hover { background: #3D3028 !important; }
        .search-result-row:hover { background: rgba(184,150,90,0.06) !important; }
      `}</style>
    </div>
  );
}
