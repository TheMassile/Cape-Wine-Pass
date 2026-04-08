"use client";

import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [status, setStatus] = useState<"idle" | "signing" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function signIn(e: React.FormEvent) {
    e.preventDefault();

    const cleanedEmail = email.trim().toLowerCase();
    const cleanedPassword = password;

    if (!cleanedEmail) {
      setStatus("error");
      setErrorMsg("Please enter your email address.");
      return;
    }

    if (!cleanedPassword) {
      setStatus("error");
      setErrorMsg("Please enter your password.");
      return;
    }

    setStatus("signing");
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithPassword({
      email: cleanedEmail,
      password: cleanedPassword,
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
      return;
    }

    // success
    window.location.replace("/regions");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-semibold">Sign in</h1>
        <p className="mt-2 text-gray-600">
          Use your email and password to sign in.
        </p>

        <form onSubmit={signIn} className="mt-6 space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="w-full rounded-lg border px-3 py-2"
            autoComplete="email"
          />

          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            className="w-full rounded-lg border px-3 py-2"
            autoComplete="current-password"
          />

          <button
            type="submit"
            disabled={status === "signing"}
            className="w-full rounded-lg bg-black px-4 py-2 text-white disabled:opacity-60"
          >
            {status === "signing" ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {status === "error" && (
          <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        <a className="mt-6 inline-block underline" href="/">
          ← Back
        </a>
      </div>
    </main>
  );
}