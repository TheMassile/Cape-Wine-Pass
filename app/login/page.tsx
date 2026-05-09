"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "working" | "error" | "success">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password;

    if (!cleanEmail) { setStatus("error"); setMessage("Please enter your email address."); return; }
    if (!cleanPassword) { setStatus("error"); setMessage("Please enter your password."); return; }
    if (cleanPassword.length < 6) { setStatus("error"); setMessage("Password must be at least 6 characters."); return; }

    setStatus("working");
    setMessage("");

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: cleanPassword });
      if (error) { setStatus("error"); setMessage(error.message); return; }
      window.location.replace("/regions");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: cleanPassword,
      options: { data: { full_name: name.trim() || undefined } }
    });
    if (error) { setStatus("error"); setMessage(error.message); return; }
    setStatus("success");
    setMessage("Account created! Check your inbox to confirm your email, then sign in.");
  }

  const regions = ["Stellenbosch", "Franschhoek", "Constantia", "Hemel-en-Aarde", "Paarl", "Robertson", "Swartland", "Elgin"];

  return (
    <main style={{
      minHeight: "100vh",
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
    }}>

      {/* ── LEFT PANEL ── */}
      <div style={{
        background: "#2C2420",
        borderRight: "1px solid rgba(184,150,90,0.15)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "3rem",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Top accent line */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "3px",
          background: "linear-gradient(to right, #6B1A2A, #B8965A)",
        }} />
        {/* Glow */}
        <div style={{
          position: "absolute", bottom: "-100px", right: "-100px",
          width: "500px", height: "500px",
          background: "radial-gradient(ellipse, rgba(107,26,42,0.35) 0%, transparent 65%)",
          pointerEvents: "none",
        }} />

        {/* Logo */}
        <Link href="/" style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "1.3rem", fontWeight: 400,
          letterSpacing: "0.12em", color: "#D4AE7A",
          textDecoration: "none", position: "relative", zIndex: 1,
        }}>
          Cape Wine Pass
        </Link>

        {/* Quote */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "4.5rem", lineHeight: 0.6,
            color: "rgba(184,150,90,0.25)", marginBottom: "1.5rem",
          }}>"</div>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "1.9rem", fontWeight: 300,
            color: "#F5F0E8", lineHeight: 1.2, marginBottom: "1rem",
          }}>
            Your <em style={{ fontStyle: "italic", color: "#D4AE7A" }}>wine journey</em> across the Western Cape, beautifully remembered.
          </h2>
          <p style={{ fontSize: "0.75rem", color: "#8C8070", lineHeight: 1.85, maxWidth: "340px" }}>
            Track estates, save tasting notes, earn milestones — and never forget a great bottle again.
          </p>
        </div>

        {/* Region tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", position: "relative", zIndex: 1 }}>
          {regions.map(r => (
            <span key={r} style={{
              fontSize: "0.58rem", letterSpacing: "0.16em",
              textTransform: "uppercase", color: "#8C8070",
              border: "1px solid rgba(184,150,90,0.18)",
              padding: "0.3rem 0.8rem",
            }}>{r}</span>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "4rem 3rem",
        overflowY: "auto",
      }}>
        <div style={{ width: "100%", maxWidth: "380px" }}>

          {/* Mode label */}
          <div style={{
            fontSize: "0.6rem", letterSpacing: "0.25em",
            textTransform: "uppercase", color: "#B8965A",
            marginBottom: "1rem",
          }}>
            {mode === "signin" ? "Welcome back" : "Get started free"}
          </div>

          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "2.4rem", fontWeight: 300,
            color: "#F5F0E8", marginBottom: "0.5rem", lineHeight: 1.1,
          }}>
            {mode === "signin" ? "Sign in" : "Create your pass"}
          </h1>

          <p style={{ fontSize: "0.75rem", color: "#8C8070", marginBottom: "2rem", lineHeight: 1.7 }}>
            {mode === "signin" ? "No account yet? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setStatus("idle"); setMessage(""); }}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#D4AE7A", fontSize: "0.75rem", padding: 0,
                borderBottom: "1px solid rgba(184,150,90,0.4)",
                fontFamily: "'Montserrat', sans-serif",
              }}
            >
              {mode === "signin" ? "Create one free" : "Sign in"}
            </button>
          </p>

          {/* Alert */}
          {status === "error" && (
            <div style={{
              background: "rgba(192,57,43,0.15)", border: "1px solid rgba(192,57,43,0.3)",
              color: "#E07070", padding: "0.85rem 1rem",
              fontSize: "0.72rem", lineHeight: 1.6, marginBottom: "1.2rem",
            }}>
              {message}
            </div>
          )}
          {status === "success" && (
            <div style={{
              background: "rgba(46,125,50,0.15)", border: "1px solid rgba(46,125,50,0.3)",
              color: "#81C784", padding: "0.85rem 1rem",
              fontSize: "0.72rem", lineHeight: 1.6, marginBottom: "1.2rem",
            }}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>

            {mode === "signup" && (
              <div>
                <label style={{ display: "block", fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#B8AFA0", marginBottom: "0.45rem" }}>
                  Your name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="First name"
                  autoComplete="given-name"
                  style={{ width: "100%", padding: "0.85rem 1rem" }}
                />
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#B8AFA0", marginBottom: "0.45rem" }}>
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                style={{ width: "100%", padding: "0.85rem 1rem" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#B8AFA0", marginBottom: "0.45rem" }}>
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === "signin" ? "••••••••" : "Min. 6 characters"}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                style={{ width: "100%", padding: "0.85rem 1rem" }}
              />
            </div>

            <button
              type="submit"
              disabled={status === "working"}
              style={{
                width: "100%",
                background: status === "working" ? "#4A0F1C" : "#6B1A2A",
                color: "#F5F0E8",
                border: "1px solid #8C3042",
                padding: "1rem",
                fontFamily: "'Montserrat', sans-serif",
                fontSize: "0.7rem",
                fontWeight: 500,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                cursor: status === "working" ? "not-allowed" : "pointer",
                opacity: status === "working" ? 0.7 : 1,
                transition: "background 0.2s",
                marginTop: "0.3rem",
              }}
            >
              {status === "working"
                ? mode === "signin" ? "Signing in…" : "Creating your pass…"
                : mode === "signin" ? "Sign in to your pass" : "Create my wine pass"}
            </button>
          </form>

          <div style={{ marginTop: "2rem", borderTop: "1px solid rgba(184,150,90,0.1)", paddingTop: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
            <Link href="/" style={{
              fontSize: "0.65rem", letterSpacing: "0.15em",
              color: "#8C8070", textDecoration: "none",
              textTransform: "uppercase",
            }}>
              ← Back to home
            </Link>
            {mode === "signin" && (
              <Link href="/reset-password" style={{
                fontSize: "0.65rem", letterSpacing: "0.15em",
                color: "#8C8070", textDecoration: "none",
                textTransform: "uppercase",
                borderBottom: "1px solid rgba(184,150,90,0.25)",
                paddingBottom: "1px",
              }}>
                Forgot password?
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Responsive: stack on mobile */}
      <style>{`
        @media (max-width: 720px) {
          main { grid-template-columns: 1fr !important; }
          main > div:first-child { display: none !important; }
          main > div:last-child { padding: 3rem 1.5rem !important; }
        }
      `}</style>
    </main>
  );
}
