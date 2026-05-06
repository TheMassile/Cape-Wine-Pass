"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const MILESTONES = [
  { count: 1,   label: "First Pour",       desc: "Your wine journey begins." },
  { count: 5,   label: "Getting the Taste", desc: "Five estates explored." },
  { count: 10,  label: "Wine Wanderer",     desc: "Bronze rank unlocked." },
  { count: 25,  label: "Cape Explorer",     desc: "A quarter century of visits." },
  { count: 50,  label: "Silver Palate",     desc: "Silver rank unlocked." },
  { count: 100, label: "Connoisseur",       desc: "Gold rank unlocked." },
  { count: 200, label: "Grand Cru",         desc: "An extraordinary dedication." },
  { count: 300, label: "Master of the Cape", desc: "Legendary status." },
];

type Rank = "Explorer" | "Bronze" | "Silver" | "Gold" | "Elite";

function getRank(visited: number, total: number): Rank {
  if (total > 0 && visited >= total) return "Elite";
  if (visited >= 100) return "Gold";
  if (visited >= 50) return "Silver";
  if (visited >= 10) return "Bronze";
  return "Explorer";
}

const RANK_STYLES: Record<Rank, { color: string; border: string; label: string; roman: string }> = {
  Explorer: { color: "#8C8070", border: "rgba(140,128,112,0.3)", label: "Explorer",  roman: "I"    },
  Bronze:   { color: "#B8965A", border: "rgba(184,150,90,0.4)",  label: "Bronze",    roman: "II"   },
  Silver:   { color: "#B8AFA0", border: "rgba(184,175,160,0.4)", label: "Silver",    roman: "III"  },
  Gold:     { color: "#D4AE7A", border: "rgba(212,174,122,0.5)", label: "Gold",      roman: "IV"   },
  Elite:    { color: "#D4AE7A", border: "rgba(212,174,122,0.6)", label: "Elite",     roman: "V"    },
};

export default function BadgesClient() {
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [totalEstates, setTotalEstates] = useState(0);
  const [visitedCount, setVisitedCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) { setSignedIn(!!data.session); setLoading(false); }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session);
    });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setErrorMsg(null);
      const { data: sd } = await supabase.auth.getSession();
      if (!sd.session) { setTotalEstates(0); setVisitedCount(0); return; }

      const { data: eData, error: eErr } = await supabase
        .from("estates").select('"Estate ID","Status"').neq("Status", "Closed");
      if (cancelled) return;
      if (eErr) { setErrorMsg(eErr.message); return; }
      setTotalEstates((eData ?? []).length);

      const { data: vData, error: vErr } = await supabase
        .from("visits").select("estate_id").eq("user_id", sd.session.user.id);
      if (cancelled) return;
      if (vErr) { setErrorMsg(vErr.message); return; }
      setVisitedCount((vData ?? []).length);
    };
    load();
    return () => { cancelled = true; };
  }, [signedIn]);

  const rank = useMemo(() => getRank(visitedCount, totalEstates), [visitedCount, totalEstates]);
  const rankStyle = RANK_STYLES[rank];
  const pct = totalEstates > 0 ? Math.round((visitedCount / totalEstates) * 100) : 0;

  const nextText = useMemo(() => {
    if (rank === "Explorer") return "Bronze at 10 visits";
    if (rank === "Bronze")   return "Silver at 50 visits";
    if (rank === "Silver")   return "Gold at 100 visits";
    if (rank === "Gold")     return "Elite by visiting every estate";
    return "Elite — all estates visited";
  }, [rank]);

  const toGo = useMemo(() => {
    if (rank === "Explorer") return Math.max(0, 10 - visitedCount);
    if (rank === "Bronze")   return Math.max(0, 50 - visitedCount);
    if (rank === "Silver")   return Math.max(0, 100 - visitedCount);
    if (rank === "Gold")     return Math.max(0, totalEstates - visitedCount);
    return 0;
  }, [rank, visitedCount, totalEstates]);

  if (loading) return (
    <div style={{ background: "#2C2420", border: "1px solid rgba(184,150,90,0.18)", padding: "2rem", fontSize: "0.78rem", color: "#8C8070", letterSpacing: "0.1em" }}>
      Loading badges…
    </div>
  );

  if (!signedIn) return (
    <div style={{ background: "#2C2420", border: "1px solid rgba(184,150,90,0.18)", padding: "2rem" }}>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", color: "#F5F0E8", marginBottom: "0.5rem" }}>
        Sign in to see your badges
      </div>
      <p style={{ fontSize: "0.75rem", color: "#8C8070", lineHeight: 1.7 }}>
        Your milestones and rank are saved to your account.
      </p>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {errorMsg && (
        <div style={{ background: "rgba(192,57,43,0.15)", border: "1px solid rgba(192,57,43,0.3)", color: "#E07070", padding: "1rem", fontSize: "0.72rem" }}>
          {errorMsg}
        </div>
      )}

      {/* Rank card */}
      <div style={{
        background: "#2C2420",
        border: `1px solid ${rankStyle.border}`,
        padding: "2.5rem",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          background: `linear-gradient(to right, #6B1A2A, ${rankStyle.color})`,
        }} />
        {/* Large background rank numeral */}
        <div style={{
          position: "absolute", right: "2rem", top: "50%", transform: "translateY(-50%)",
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "8rem", fontWeight: 300, lineHeight: 1,
          color: "rgba(184,150,90,0.06)", pointerEvents: "none",
          userSelect: "none",
        }}>
          {rankStyle.roman}
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1.5rem" }}>
          <div>
            <div style={{ fontSize: "0.58rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "#8C8070", marginBottom: "0.8rem" }}>
              Current rank
            </div>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "3rem", fontWeight: 300,
              color: rankStyle.color, lineHeight: 1, marginBottom: "0.5rem",
            }}>
              {rankStyle.label}
            </div>
            <div style={{ fontSize: "0.72rem", color: "#8C8070", marginBottom: "0.3rem" }}>
              <span style={{ color: "#D4AE7A" }}>{visitedCount}</span> of {totalEstates} estates visited
            </div>
            <div style={{ fontSize: "0.7rem", color: "#8C8070" }}>
              {rank === "Elite"
                ? "Elite unlocked — every estate visited."
                : `Next: ${nextText} — ${toGo} to go`}
            </div>
          </div>

          <div style={{
            background: "rgba(26,20,16,0.5)",
            border: `1px solid ${rankStyle.border}`,
            padding: "1.2rem 1.8rem",
            textAlign: "center",
            flexShrink: 0,
          }}>
            <div style={{ fontSize: "0.58rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#8C8070", marginBottom: "0.4rem" }}>
              Completion
            </div>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "2.5rem", fontWeight: 300, color: rankStyle.color, lineHeight: 1,
            }}>
              {pct}%
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: "2rem", height: "1px", background: "rgba(184,150,90,0.12)" }}>
          <div style={{
            height: "100%", width: `${pct}%`,
            background: rankStyle.color,
            transition: "width 0.6s ease",
          }} />
        </div>
      </div>

      {/* Milestones grid */}
      <div style={{
        background: "#2C2420",
        border: "1px solid rgba(184,150,90,0.18)",
        padding: "2rem 2.5rem",
        position: "relative",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <div style={{ fontSize: "0.58rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "#8C8070", marginBottom: "0.4rem" }}>
              Visit milestones
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.5rem", fontWeight: 300, color: "#F5F0E8" }}>
              {visitedCount} total visits
            </div>
          </div>
          <div style={{
            fontSize: "0.62rem", letterSpacing: "0.15em",
            color: "#B8965A",
            border: "1px solid rgba(184,150,90,0.25)",
            padding: "0.35rem 0.9rem",
          }}>
            {MILESTONES.filter(m => visitedCount >= m.count).length} / {MILESTONES.length} earned
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: "1px",
          background: "rgba(184,150,90,0.1)",
        }}>
          {MILESTONES.map((m) => {
            const earned = visitedCount >= m.count;
            return (
              <div key={m.count} style={{
                background: earned ? "rgba(107,26,42,0.2)" : "#2C2420",
                padding: "1.5rem",
                transition: "background 0.2s",
              }}>
                <div style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "2rem", fontWeight: 300,
                  color: earned ? "#D4AE7A" : "rgba(184,150,90,0.15)",
                  lineHeight: 1, marginBottom: "0.8rem",
                }}>
                  {m.count}
                </div>
                <div style={{
                  fontSize: "0.75rem", fontWeight: 500,
                  color: earned ? "#F5F0E8" : "#8C8070",
                  marginBottom: "0.3rem",
                  fontFamily: "'Cormorant Garamond', serif",
                }}>
                  {m.label}
                </div>
                <div style={{ fontSize: "0.62rem", color: earned ? "#B8AFA0" : "#8C8070", lineHeight: 1.6 }}>
                  {earned ? m.desc : `${Math.max(0, m.count - visitedCount)} to go`}
                </div>
                {earned && (
                  <div style={{
                    marginTop: "0.8rem",
                    fontSize: "0.55rem", letterSpacing: "0.2em",
                    textTransform: "uppercase", color: "#B8965A",
                  }}>
                    Unlocked ✓
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
