"use client";

import { useEffect, useState, useTransition } from "react";
import { supabase } from "@/app/lib/supabaseClient";

type Props = {
  estateId: string;
  initialUpvotes?: number;
  initialDownvotes?: number;
  initialUserVote?: 1 | -1 | null;
};

type VoteRow = {
  vote: number;
};

export default function KidFriendlyVote({
  estateId,
  initialUpvotes = 0,
  initialDownvotes = 0,
  initialUserVote = null,
}: Props) {
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [userVote, setUserVote] = useState<1 | -1 | null>(initialUserVote);
  const [authChecked, setAuthChecked] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    async function loadVoteData() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const user = session?.user ?? null;

        const { data: allVotes } = await supabase
          .from("estate_kid_friendly_votes")
          .select("vote")
          .eq("estate_id", estateId);

        const voteRows = (allVotes ?? []) as VoteRow[];
        const ups = voteRows.filter((row) => row.vote === 1).length;
        const downs = voteRows.filter((row) => row.vote === -1).length;

        if (!user) {
          if (!cancelled) {
            setUpvotes(ups);
            setDownvotes(downs);
            setUserVote(null);
            setAuthChecked(true);
          }
          return;
        }

        const { data: myVoteRow } = await supabase
          .from("estate_kid_friendly_votes")
          .select("vote")
          .eq("estate_id", estateId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (!cancelled) {
          setUpvotes(ups);
          setDownvotes(downs);
          setUserVote((myVoteRow?.vote as 1 | -1 | null) ?? null);
          setAuthChecked(true);
        }
      } catch {
        if (!cancelled) {
          setUpvotes(initialUpvotes);
          setDownvotes(initialDownvotes);
          setUserVote(initialUserVote);
          setAuthChecked(true);
        }
      }
    }

    loadVoteData();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadVoteData();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [estateId, initialUpvotes, initialDownvotes, initialUserVote]);

  async function refreshCounts() {
    try {
      const { data } = await supabase
        .from("estate_kid_friendly_votes")
        .select("vote")
        .eq("estate_id", estateId);

      const voteRows = (data ?? []) as VoteRow[];
      const ups = voteRows.filter((row) => row.vote === 1).length;
      const downs = voteRows.filter((row) => row.vote === -1).length;

      setUpvotes(ups);
      setDownvotes(downs);
    } catch {
      // keep current values
    }
  }

  function applyOptimisticChange(previousVote: 1 | -1 | null, newVote: 1 | -1) {
    let nextUpvotes = upvotes;
    let nextDownvotes = downvotes;

    if (previousVote === 1) nextUpvotes = Math.max(0, nextUpvotes - 1);
    if (previousVote === -1) nextDownvotes = Math.max(0, nextDownvotes - 1);

    if (newVote === 1) nextUpvotes += 1;
    if (newVote === -1) nextDownvotes += 1;

    setUpvotes(nextUpvotes);
    setDownvotes(nextDownvotes);
    setUserVote(newVote);
  }

  async function handleVote(vote: 1 | -1) {
    startTransition(async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const user = session?.user ?? null;

        if (!user) {
          alert("Please log in using the wine app login page before voting.");
          return;
        }

        const previousVote = userVote;

        applyOptimisticChange(previousVote, vote);

        const { error } = await supabase
          .from("estate_kid_friendly_votes")
          .upsert(
            {
              estate_id: estateId,
              user_id: user.id,
              vote,
            },
            {
              onConflict: "estate_id,user_id",
            }
          );

        if (error) {
          setUserVote(previousVote);
          await refreshCounts();
          alert(`Could not save your vote: ${error.message}`);
          return;
        }

        await refreshCounts();
      } catch {
        await refreshCounts();
        alert("Something went wrong while saving your vote.");
      }
    });
  }

  const disabled = !authChecked || isPending;

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="font-medium">Kid friendly?</span>

      <button
        type="button"
        onClick={() => handleVote(1)}
        disabled={disabled}
        className={`rounded-full border px-3 py-1 transition ${
          userVote === 1
            ? "border-green-600 bg-green-100 font-semibold"
            : "border-gray-300 bg-white hover:bg-gray-50"
        } ${disabled ? "opacity-60" : ""}`}
      >
        👍 {upvotes}
      </button>

      <button
        type="button"
        onClick={() => handleVote(-1)}
        disabled={disabled}
        className={`rounded-full border px-3 py-1 transition ${
          userVote === -1
            ? "border-red-600 bg-red-100 font-semibold"
            : "border-gray-300 bg-white hover:bg-gray-50"
        } ${disabled ? "opacity-60" : ""}`}
      >
        👎 {downvotes}
      </button>
    </div>
  );
}