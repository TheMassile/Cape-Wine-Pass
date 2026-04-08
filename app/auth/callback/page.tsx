"use client";

import { useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function AuthCallback() {
  useEffect(() => {
    (async () => {
      // Supabase v2 automatically parses #access_token from URL when you call getSession()
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        // If link expired/invalid, redirect to login with message
        window.location.replace(`/login?error=${encodeURIComponent(error.message)}`);
        return;
      }

      // If we got a session, redirect to /regions
      if (data.session) {
        window.location.replace("/regions");
        return;
      }

      // Fallback: redirect to login if no session
      window.location.replace("/login");
    })();
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <p>Signing you in…</p>
    </main>
  );
}