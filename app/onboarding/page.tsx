"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function cleanHandle(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "") // only letters, numbers, underscore
    .slice(0, 20);
}

export default function OnboardingPage() {
  const [loading, setLoading] = useState(true);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

  const [handle, setHandle] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // 1) Ensure user is signed in
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const userId = data.session?.user?.id ?? null;
      setSessionUserId(userId);
      setLoading(false);

      if (!userId) {
        window.location.href = "/login";
      }
    });
  }, []);

  async function saveHandle(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorMsg("");

    if (!sessionUserId) {
      setStatus("error");
      setErrorMsg("You must be signed in.");
      return;
    }

    const cleaned = cleanHandle(handle);
    if (cleaned.length < 3) {
      setStatus("error");
      setErrorMsg("Handle must be at least 3 characters (letters/numbers/_).");
      return;
    }

    // 2) Check if handle already taken
    const { data: existing, error: checkError } = await supabase
      .from("profiles")
      .select("handle")
      .eq("handle", cleaned)
      .maybeSingle();

    if (checkError) {
      setStatus("error");
      setErrorMsg(checkError.message);
      return;
    }

    if (existing?.handle) {
      setStatus("error");
      setErrorMsg("That handle is already taken. Try another.");
      return;
    }

    // 3) Insert profile for this user
    const { error: insertError } = await supabase.from("profiles").insert({
      user_id: sessionUserId,
      handle: cleaned,
    });

    if (insertError) {
      setStatus("error");
      setErrorMsg(insertError.message);
      return;
    }

    // 4) Continue
    window.location.href = "/regions";
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <p>Loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-semibold">Choose your handle</h1>
        <p className="mt-2 text-gray-600">
          This is your public name. Keep it simple — you can change it later.
        </p>

        <form onSubmit={saveHandle} className="mt-6 space-y-3">
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="e.g. corkhunter"
            className="w-full rounded-lg border px-3 py-2"
          />
          <p className="text-xs text-gray-500">
            Allowed: letters, numbers, underscore. Max 20 characters.
          </p>

          <button
            type="submit"
            disabled={status === "saving"}
            className="w-full rounded-lg bg-black px-4 py-2 text-white disabled:opacity-60"
          >
            {status === "saving" ? "Saving..." : "Save handle"}
          </button>
        </form>

        {status === "error" && (
          <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {errorMsg}
          </div>
        )}
      </div>
    </main>
  );
}