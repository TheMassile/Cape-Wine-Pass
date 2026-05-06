"use client";

import { useEffect, useState, useTransition } from "react";
import { supabase } from "@/app/lib/supabaseClient";

type Props = {
  estateId: string;
  initialUpvotes?: number;
  initialDownvotes?: number;
  initialUserVote?: 1 | -1 | null;
  requireVisited?: boolean;   // if true, block voting unless visited
  visited?: boolean;          // whether user has visited this estate
};

type VoteRow = { vote: number };

export default function KidFriendlyVote({
  estateId,
  initialUpvotes = 0,
  initialDownvotes = 0,
  initialUserVote = null,
  requireVisited = false,
  visited = false,
}: Props) {
  const [upvotes, setUpvotes]     = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [userVote, setUserVote]   = useState<1 | -1 | null>(initialUserVote);
  const [authChecked, setAuthChecked] = useState(false);
  const [isPending, startTransition]  = useTransition();
  const [tooltip, setTooltip]     = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user ?? null;

        const { data: allVotes } = await supabase
          .from("estate_kid_friendly_votes").select("vote").eq("estate_id", estateId);

        const rows = (allVotes ?? []) as VoteRow[];
        const ups   = rows.filter(r => r.vote === 1).length;
        const downs = rows.filter(r => r.vote === -1).length;

        if (!user) {
          if (!cancelled) { setUpvotes(ups); setDownvotes(downs); setUserVote(null); setAuthChecked(true); }
          return;
        }

        const { data: myRow } = await supabase
          .from("estate_kid_friendly_votes").select("vote")
          .eq("estate_id", estateId).eq("user_id", user.id).maybeSingle();

        if (!cancelled) {
          setUpvotes(ups); setDownvotes(downs);
          setUserVote((myRow?.vote as 1 | -1 | null) ?? null);
          setAuthChecked(true);
        }
      } catch {
        if (!cancelled) {
          setUpvotes(initialUpvotes); setDownvotes(initialDownvotes);
          setUserVote(initialUserVote); setAuthChecked(true);
        }
      }
    }

    load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => load());
    return () => { cancelled = true; subscription.unsubscribe(); };
  }, [estateId, initialUpvotes, initialDownvotes, initialUserVote]);

  async function refreshCounts() {
    try {
      const { data } = await supabase
        .from("estate_kid_friendly_votes").select("vote").eq("estate_id", estateId);
      const rows = (data ?? []) as VoteRow[];
      setUpvotes(rows.filter(r => r.vote === 1).length);
      setDownvotes(rows.filter(r => r.vote === -1).length);
    } catch { /* keep current */ }
  }

  async function handleVote(vote: 1 | -1) {
    // Block if visit required but not visited
    if (requireVisited && !visited) {
      setTooltip("Mark this estate as visited before voting.");
      setTimeout(() => setTooltip(""), 2500);
      return;
    }

    startTransition(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user ?? null;
        if (!user) {
          setTooltip("Please sign in before voting.");
          setTimeout(() => setTooltip(""), 2500);
          return;
        }

        const previousVote = userVote;

        // ── TOGGLE: clicking the same button removes the vote ──
        if (previousVote === vote) {
          // Optimistic removal
          setUserVote(null);
          if (vote === 1)  setUpvotes(v => Math.max(0, v - 1));
          if (vote === -1) setDownvotes(v => Math.max(0, v - 1));

          const { error } = await supabase
            .from("estate_kid_friendly_votes")
            .delete()
            .eq("estate_id", estateId)
            .eq("user_id", user.id);

          if (error) {
            setUserVote(previousVote);
            await refreshCounts();
          } else {
            await refreshCounts();
          }
          return;
        }

        // ── SWITCH or NEW vote ──
        // Optimistic
        if (previousVote === 1)  setUpvotes(v => Math.max(0, v - 1));
        if (previousVote === -1) setDownvotes(v => Math.max(0, v - 1));
        if (vote === 1)  setUpvotes(v => v + 1);
        if (vote === -1) setDownvotes(v => v + 1);
        setUserVote(vote);

        const { error } = await supabase
          .from("estate_kid_friendly_votes")
          .upsert({ estate_id: estateId, user_id: user.id, vote }, { onConflict: "estate_id,user_id" });

        if (error) {
          setUserVote(previousVote);
          await refreshCounts();
        } else {
          await refreshCounts();
        }
      } catch {
        await refreshCounts();
      }
    });
  }

  const blocked  = requireVisited && !visited;
  const disabled = !authChecked || isPending;

  const btnBase: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: "0.3rem",
    fontSize: "0.68rem", padding: "0.25rem 0.7rem",
    fontFamily: "'Montserrat', sans-serif", letterSpacing: "0.05em",
    cursor: blocked || disabled ? "not-allowed" : "pointer",
    border: "1px solid rgba(184,150,90,0.2)",
    background: "transparent", color: "#8C8070",
    transition: "all 0.2s",
    opacity: disabled ? 0.5 : 1,
  };

  const upActive:   React.CSSProperties = { ...btnBase, background: "rgba(140,184,122,0.15)", border: "1px solid rgba(140,184,122,0.4)", color: "#8CB87A" };
  const downActive: React.CSSProperties = { ...btnBase, background: "rgba(192,57,43,0.12)",   border: "1px solid rgba(192,57,43,0.3)",   color: "#E07070" };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", flexWrap: "wrap" }}>
      <span style={{ fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#8C8070" }}>
        Kid friendly?
      </span>

      <button
        type="button"
        onClick={() => handleVote(1)}
        disabled={disabled}
        style={userVote === 1 ? upActive : btnBase}
        title={blocked ? "Visit this estate first" : userVote === 1 ? "Click to remove your vote" : "Vote kid-friendly"}
      >
        👍 {upvotes}
      </button>

      <button
        type="button"
        onClick={() => handleVote(-1)}
        disabled={disabled}
        style={userVote === -1 ? downActive : btnBase}
        title={blocked ? "Visit this estate first" : userVote === -1 ? "Click to remove your vote" : "Vote not kid-friendly"}
      >
        👎 {downvotes}
      </button>

      {tooltip && (
        <span style={{ fontSize: "0.62rem", color: "#B8965A", letterSpacing: "0.08em", fontStyle: "italic" }}>
          {tooltip}
        </span>
      )}
    </div>
  );
}
