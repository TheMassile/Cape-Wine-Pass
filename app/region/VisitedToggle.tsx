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
      className="rounded-full border px-3 py-1 text-xs disabled:opacity-60"
    >
      {saving ? "Saving..." : visited ? "Visited ✓" : "Mark visited"}
    </button>
  );
}