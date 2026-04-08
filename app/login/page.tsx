"use client";

import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [status, setStatus] = useState<
    "idle" | "working" | "error" | "success"
  >("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const cleanedEmail = email.trim().toLowerCase();
    const cleanedPassword = password;

    if (!cleanedEmail) {
      setStatus("error");
      setMessage("Please enter your email address.");
      return;
    }

    if (!cleanedPassword) {
      setStatus("error");
      setMessage("Please enter your password.");
      return;
    }

    if (cleanedPassword.length < 6) {
      setStatus("error");
      setMessage("Password must be at least 6 characters.");
      return;
    }

    setStatus("working");
    setMessage("");

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanedEmail,
        password: cleanedPassword,
      });

      if (error) {
        setStatus("error");
        setMessage(error.message);
        return;
      }

      window.location.replace("/regions");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: cleanedEmail,
      password: cleanedPassword,
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("success");
    setMessage(
      "Account created. If email confirmation is enabled, please check your inbox before signing in."
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold">
          {mode === "signin" ? "Sign in" : "Sign up"}
        </h1>

        <p className="mt-2 text-gray-600">
          {mode === "signin"
            ? "Use your email and password to sign in."
            : "Create an account with your email and password."}
        </p>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setStatus("idle");
              setMessage("");
            }}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              mode === "signin"
                ? "bg-black text-white"
                : "border border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
            }`}
          >
            Sign in
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setStatus("idle");
              setMessage("");
            }}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              mode === "signup"
                ? "bg-black text-white"
                : "border border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
            }`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
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
            placeholder={
              mode === "signin" ? "Your password" : "Create a password"
            }
            className="w-full rounded-lg border px-3 py-2"
            autoComplete={
              mode === "signin" ? "current-password" : "new-password"
            }
          />

          <button
            type="submit"
            disabled={status === "working"}
            className="w-full rounded-lg bg-black px-4 py-2 text-white disabled:opacity-60"
          >
            {status === "working"
              ? mode === "signin"
                ? "Signing in..."
                : "Creating account..."
              : mode === "signin"
              ? "Sign in"
              : "Create account"}
          </button>
        </form>

        {status === "error" && (
          <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {message}
          </div>
        )}

        {status === "success" && (
          <div className="mt-4 rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-700">
            {message}
          </div>
        )}

        <a className="mt-6 inline-block underline" href="/">
          ← Back
        </a>
      </div>
    </main>
  );
}