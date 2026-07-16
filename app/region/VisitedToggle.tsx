"use client";

import { useState } from "react";
import { supabase } from "@/app/lib/supabaseClient";

type Props = {
  estateId: string;
  visited: boolean;
  disabled?: boolean;
  onChange?: (estateId: string, nowVisited: boolean) => void;
};

export default function VisitedToggle({
  estateId,
  visited,
  disabled,
  onChange,
}: Props) {
  const [saving, setSaving] = useState(false);

  async function onToggle() {
    if (disabled || saving) return;

    const nextVisited = !visited;

    setSaving(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        alert("You are not signed into the wine app yet. Please log in again using the app login page.");
        setSaving(false);
        return;
      }

      if (nextVisited) {
        const { error } = await supabase.from("visits").insert([
          {
            user_id: session.user.id,
            estate_id: estateId,
          },
        ]);

        if (error) {
          alert(`Could not mark as visited: ${error.message}`);
          setSaving(false);
          return;
        }
      } else {
        const { error } = await supabase
          .from("visits")
          .delete()
          .eq("user_id", session.user.id)
          .eq("estate_id", estateId);

        if (error) {
          alert(`Could not remove visit: ${error.message}`);
          setSaving(false);
          return;
        }
      }

      onChange?.(estateId, nextVisited);
    } catch (err: any) {
      alert(err?.message ?? "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      onClick={onToggle}
      disabled={disabled || saving}
      style={{
        background: visited ? "transparent" : "#B8965A",
        border: visited ? "1px solid rgba(184,150,90,0.4)" : "1px solid #B8965A",
        color: visited ? "#D4AE7A" : "#F5F0E8",
        padding: "0.4rem 0.9rem",
        fontFamily: "'Montserrat', sans-serif",
        fontSize: "0.62rem",
        fontWeight: 500,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        cursor: disabled || saving ? "not-allowed" : "pointer",
        opacity: disabled || saving ? 0.6 : 1,
        transition: "all 0.2s",
      }}
    >
      {saving ? "Saving..." : visited ? "Visited ✓" : "Mark visited"}
    </button>
  );
}