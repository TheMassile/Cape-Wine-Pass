"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabaseClient";

type Step = "request" | "update" | "done";

export default function ResetPasswordPage() {
  const [step, setStep]         = useState<Step>("request");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [status, setStatus]     = useState<"idle" | "working" | "error" | "success">("idle");
  const [message, setMessage]   = useState("");

  // When user lands here from the reset email link,
  // Supabase puts a session in the URL hash — detect it
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("type=recovery")) {
      setStep("update");
    }

    // Also listen for auth state change (Supabase auto-signs them in)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setStep("update");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setStatus("error"); setMessage("Please enter your email address."); return; }
    setStatus("working");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) { setStatus("error"); setMessage(error.message); return; }
    setStatus("success");
    setMessage("Check your inbox — we've sent a password reset link.");
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!password || password.length < 6) { setStatus("error"); setMessage("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setStatus("error"); setMessage("Passwords do not match."); return; }
    setStatus("working");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setStatus("error"); setMessage(error.message); return; }
    setStep("done");
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(44,36,32,0.6)",
    border: "1px solid rgba(184,150,90,0.2)",
    color: "#F5F0E8",
    fontFamily: "'Montserrat', sans-serif",
    fontSize: "0.85rem", fontWeight: 300,
    padding: "0.9rem 1.1rem",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.58rem", letterSpacing: "0.22em",
    textTransform: "uppercase", color: "#B8AFA0",
    marginBottom: "0.5rem",
  };

  // ── DONE ──
  if (step === "done") {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ maxWidth: "420px", width: "100%", textAlign: "center" }}>
          <div style={{ width: "72px", height: "72px", border: "1px solid rgba(184,150,90,0.35)", borderRadius: "50%", margin: "0 auto 2rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <polyline points="3,12 9,18 21,6" stroke="#B8965A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{ fontSize: "0.6rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#B8965A", marginBottom: "1rem" }}>Password updated</div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.2rem", fontWeight: 300, color: "#F5F0E8", marginBottom: "1rem", lineHeight: 1.1 }}>
            You're all set.
          </h1>
          <p style={{ fontSize: "0.76rem", color: "#8C8070", lineHeight: 1.85, marginBottom: "2rem" }}>
            Your password has been updated. Sign in to continue your wine journey.
          </p>
          <Link href="/login" style={{ display: "inline-block", background: "#6B1A2A", border: "1px solid #8C3042", color: "#F5F0E8", padding: "0.85rem 2rem", fontFamily: "'Montserrat', sans-serif", fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", textDecoration: "none" }}>
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ maxWidth: "420px", width: "100%" }}>

        {/* Logo */}
        <Link href="/" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.2rem", fontWeight: 400, letterSpacing: "0.12em", color: "#D4AE7A", textDecoration: "none", display: "block", marginBottom: "2.5rem" }}>
          Cape Wine Pass
        </Link>

        {/* Card */}
        <div style={{ background: "#2C2420", border: "1px solid rgba(184,150,90,0.18)", padding: "2.5rem", position: "relative" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(to right, #6B1A2A, #B8965A)" }} />

          <div style={{ fontSize: "0.58rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "#B8965A", marginBottom: "0.8rem" }}>
            {step === "request" ? "Account recovery" : "Choose a new password"}
          </div>

          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2rem", fontWeight: 300, color: "#F5F0E8", marginBottom: "0.6rem", lineHeight: 1.1 }}>
            {step === "request" ? "Reset your password" : "New password"}
          </h1>

          <p style={{ fontSize: "0.74rem", color: "#8C8070", lineHeight: 1.8, marginBottom: "2rem" }}>
            {step === "request"
              ? "Enter the email address on your account and we'll send you a reset link."
              : "Choose a strong password for your Cape Wine Pass account."}
          </p>

          {/* Alert */}
          {status === "error" && (
            <div style={{ background: "rgba(192,57,43,0.15)", border: "1px solid rgba(192,57,43,0.3)", color: "#E07070", padding: "0.85rem 1rem", fontSize: "0.72rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
              {message}
            </div>
          )}
          {status === "success" && (
            <div style={{ background: "rgba(46,125,50,0.15)", border: "1px solid rgba(46,125,50,0.3)", color: "#81C784", padding: "0.85rem 1rem", fontSize: "0.72rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
              {message}
            </div>
          )}

          {/* REQUEST FORM */}
          {step === "request" && status !== "success" && (
            <form onSubmit={handleRequest} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              <div>
                <label style={labelStyle}>Email address</label>
                <input
                  type="email" required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  style={inputStyle}
                />
              </div>
              <button
                type="submit"
                disabled={status === "working"}
                style={{ background: status === "working" ? "#4A0F1C" : "#6B1A2A", color: "#F5F0E8", border: "1px solid #8C3042", padding: "1rem", fontFamily: "'Montserrat', sans-serif", fontSize: "0.68rem", fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", cursor: status === "working" ? "not-allowed" : "pointer", opacity: status === "working" ? 0.7 : 1 }}
              >
                {status === "working" ? "Sending…" : "Send reset link"}
              </button>
            </form>
          )}

          {/* UPDATE FORM */}
          {step === "update" && (
            <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              <div>
                <label style={labelStyle}>New password</label>
                <input
                  type="password" required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Confirm new password</label>
                <input
                  type="password" required
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  style={inputStyle}
                />
              </div>
              <button
                type="submit"
                disabled={status === "working"}
                style={{ background: status === "working" ? "#4A0F1C" : "#6B1A2A", color: "#F5F0E8", border: "1px solid #8C3042", padding: "1rem", fontFamily: "'Montserrat', sans-serif", fontSize: "0.68rem", fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", cursor: status === "working" ? "not-allowed" : "pointer", opacity: status === "working" ? 0.7 : 1 }}
              >
                {status === "working" ? "Updating…" : "Update password"}
              </button>
            </form>
          )}
        </div>

        {/* Back link */}
        <div style={{ marginTop: "1.5rem" }}>
          <Link href="/login" style={{ fontSize: "0.62rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#8C8070", textDecoration: "none" }}>
            ← Back to sign in
          </Link>
        </div>

      </div>
    </main>
  );
}
