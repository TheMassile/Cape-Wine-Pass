"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabaseClient";

type Status = "idle" | "working" | "success" | "error" | "noauth";

const REGIONS = [
  "Stellenbosch", "Franschhoek", "Constantia", "Paarl", "Durbanville",
  "Robertson", "Elgin", "Hemel-en-Aarde", "Swartland", "Tulbagh",
  "Wellington", "Breedekloof", "Cederberg/West Coast",
  "Garden Route / Plettenberg Bay", "Other",
];

export default function DiscoveryPage() {
  const [estateName, setEstateName] = useState("");
  const [region, setRegion]         = useState("");
  const [visitDate, setVisitDate]   = useState("");
  const [notes, setNotes]           = useState("");
  const [website, setWebsite]       = useState("");
  const [status, setStatus]         = useState<Status>("idle");
  const [focused, setFocused]       = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!estateName.trim() || !region) {
      setStatus("error");
      return;
    }

    setStatus("working");

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setStatus("noauth"); return; }

    const { error } = await supabase.from("discovery_submissions").insert({
      user_id:      session.user.id,
      user_email:   session.user.email,
      estate_name:  estateName.trim(),
      region,
      visit_date:   visitDate || null,
      notes:        notes.trim() || null,
      website:      website.trim() || null,
      status:       "pending",
    });

    if (error) { setStatus("error"); return; }
    setStatus("success");
  }

  const inputStyle = (field: string): React.CSSProperties => ({
    width: "100%",
    background: focused === field ? "rgba(44,36,32,0.95)" : "rgba(44,36,32,0.6)",
    border: `1px solid ${focused === field ? "rgba(184,150,90,0.55)" : "rgba(184,150,90,0.18)"}`,
    color: "#F5F0E8",
    fontFamily: "'Montserrat', sans-serif",
    fontSize: "0.85rem",
    fontWeight: 300,
    padding: "0.9rem 1.1rem",
    outline: "none",
    transition: "all 0.25s",
    WebkitAppearance: "none" as const,
  });

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.58rem",
    letterSpacing: "0.22em",
    textTransform: "uppercase" as const,
    color: "#B8AFA0",
    marginBottom: "0.5rem",
  };

  if (status === "success") {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ maxWidth: "520px", width: "100%", textAlign: "center" }}>
          {/* Animated gold ring */}
          <div style={{
            width: "80px", height: "80px",
            border: "1px solid rgba(184,150,90,0.4)",
            borderRadius: "50%",
            margin: "0 auto 2rem",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(184,150,90,0.06)",
          }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <polyline points="4,14 11,21 24,7" stroke="#B8965A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <div style={{ fontSize: "0.6rem", letterSpacing: "0.28em", textTransform: "uppercase", color: "#B8965A", marginBottom: "1rem" }}>
            Discovery received
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.5rem", fontWeight: 300, color: "#F5F0E8", marginBottom: "1rem", lineHeight: 1.1 }}>
            Thank you for the <em style={{ fontStyle: "italic", color: "#D4AE7A" }}>find</em>.
          </h1>
          <p style={{ fontSize: "0.78rem", color: "#8C8070", lineHeight: 1.9, marginBottom: "2.5rem" }}>
            Your discovery has been submitted for review. If it meets our criteria we will add it to the Cape Wine Pass and credit the find to you.
          </p>
          <div style={{ display: "flex", gap: "1.5rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/regions" style={{
              background: "#6B1A2A", border: "1px solid #8C3042",
              color: "#F5F0E8", padding: "0.8rem 2rem",
              fontFamily: "'Montserrat', sans-serif",
              fontSize: "0.65rem", fontWeight: 500,
              letterSpacing: "0.2em", textTransform: "uppercase",
              textDecoration: "none",
            }}>
              Back to regions
            </Link>
            <button
              onClick={() => { setStatus("idle"); setEstateName(""); setRegion(""); setVisitDate(""); setNotes(""); setWebsite(""); }}
              style={{
                background: "transparent", border: "1px solid rgba(184,150,90,0.2)",
                color: "#8C8070", padding: "0.8rem 2rem",
                fontFamily: "'Montserrat', sans-serif",
                fontSize: "0.65rem", letterSpacing: "0.2em",
                textTransform: "uppercase", cursor: "pointer",
              }}
            >
              Submit another
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh" }}>

      {/* ── HERO HEADER ── */}
      <div style={{
        background: "#2C2420",
        borderBottom: "1px solid rgba(184,150,90,0.15)",
        padding: "4rem 1.5rem 3rem",
        position: "relative", overflow: "hidden",
        textAlign: "center",
      }}>
        {/* Background glow */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 60% 80% at 50% 100%, rgba(107,26,42,0.25) 0%, transparent 70%)",
        }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(to right, transparent, #B8965A, transparent)" }} />

        {/* Nav */}
        <div style={{ position: "absolute", top: "1.5rem", left: "1.5rem" }}>
          <Link href="/regions" style={{ fontSize: "0.58rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#8C8070", textDecoration: "none" }}>
            ← Regions
          </Link>
        </div>

        {/* Badge */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            border: "1px solid rgba(184,150,90,0.3)",
            padding: "0.35rem 1rem", marginBottom: "1.5rem",
          }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <polygon points="5,1 6.2,3.8 9.5,4 7,6.3 7.6,9.5 5,8 2.4,9.5 3,6.3 0.5,4 3.8,3.8" fill="#B8965A"/>
            </svg>
            <span style={{ fontSize: "0.58rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "#B8965A" }}>
              Explorer's Discovery
            </span>
          </div>

          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
            fontWeight: 300, color: "#F5F0E8",
            lineHeight: 1.05, marginBottom: "1rem",
          }}>
            Found something <em style={{ fontStyle: "italic", color: "#D4AE7A" }}>special</em>?
          </h1>

          <p style={{
            fontSize: "0.8rem", color: "#8C8070",
            lineHeight: 1.9, maxWidth: "480px",
            margin: "0 auto",
          }}>
            If you've discovered a wine estate that deserves a place on the Cape Wine Pass, tell us about it. Every great find starts with someone paying attention.
          </p>
        </div>
      </div>

      {/* ── FORM ── */}
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "3rem 1.5rem" }}>

        {/* Criteria note */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1px", background: "rgba(184,150,90,0.1)",
          border: "1px solid rgba(184,150,90,0.1)",
          marginBottom: "3rem",
        }}>
          {[
            { icon: "🍷", label: "Open for tasting" },
            { icon: "📍", label: "Western Cape" },
            { icon: "✨", label: "Worth the visit" },
          ].map(c => (
            <div key={c.label} style={{ background: "#2C2420", padding: "1.2rem", textAlign: "center" }}>
              <div style={{ fontSize: "1.1rem", marginBottom: "0.4rem" }}>{c.icon}</div>
              <div style={{ fontSize: "0.58rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#8C8070" }}>{c.label}</div>
            </div>
          ))}
        </div>

        {status === "noauth" && (
          <div style={{ background: "rgba(184,150,90,0.08)", border: "1px solid rgba(184,150,90,0.25)", padding: "1.2rem 1.4rem", marginBottom: "2rem" }}>
            <p style={{ fontSize: "0.75rem", color: "#D4AE7A", lineHeight: 1.7, margin: 0 }}>
              You need to be signed in to submit a discovery. <Link href="/login" style={{ color: "#D4AE7A", borderBottom: "1px solid rgba(184,150,90,0.4)" }}>Sign in here →</Link>
            </p>
          </div>
        )}

        {status === "error" && (
          <div style={{ background: "rgba(192,57,43,0.12)", border: "1px solid rgba(192,57,43,0.3)", padding: "1rem 1.2rem", marginBottom: "2rem" }}>
            <p style={{ fontSize: "0.72rem", color: "#E07070", margin: 0 }}>Please fill in the estate name and region before submitting.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* Estate name */}
          <div>
            <label style={labelStyle}>Estate name <span style={{ color: "#8C3042" }}>*</span></label>
            <input
              type="text"
              value={estateName}
              onChange={e => setEstateName(e.target.value)}
              onFocus={() => setFocused("name")}
              onBlur={() => setFocused(null)}
              placeholder="e.g. Vergelegen Wine Estate"
              style={inputStyle("name")}
              required
            />
          </div>

          {/* Region */}
          <div>
            <label style={labelStyle}>Region <span style={{ color: "#8C3042" }}>*</span></label>
            <select
              value={region}
              onChange={e => setRegion(e.target.value)}
              onFocus={() => setFocused("region")}
              onBlur={() => setFocused(null)}
              style={{ ...inputStyle("region"), cursor: "pointer" }}
              required
            >
              <option value="" style={{ background: "#2C2420" }}>Select a region…</option>
              {REGIONS.map(r => (
                <option key={r} value={r} style={{ background: "#2C2420" }}>{r}</option>
              ))}
            </select>
          </div>

          {/* Visit date + website side by side */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>When did you visit?</label>
              <input
                type="text"
                value={visitDate}
                onChange={e => setVisitDate(e.target.value)}
                onFocus={() => setFocused("date")}
                onBlur={() => setFocused(null)}
                placeholder="e.g. May 2026"
                style={inputStyle("date")}
              />
            </div>
            <div>
              <label style={labelStyle}>Website (if known)</label>
              <input
                type="text"
                value={website}
                onChange={e => setWebsite(e.target.value)}
                onFocus={() => setFocused("web")}
                onBlur={() => setFocused(null)}
                placeholder="e.g. vergelegen.co.za"
                style={inputStyle("web")}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Tell us about it</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onFocus={() => setFocused("notes")}
              onBlur={() => setFocused(null)}
              placeholder="What made it worth the visit? Tasting room, wines, views, experience…"
              rows={4}
              style={{ ...inputStyle("notes"), resize: "vertical" as const }}
            />
          </div>

          {/* Submit */}
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", paddingTop: "0.5rem" }}>
            <button
              type="submit"
              disabled={status === "working"}
              style={{
                background: status === "working" ? "#4A0F1C" : "#6B1A2A",
                color: "#F5F0E8",
                border: "1px solid #8C3042",
                padding: "1rem 2.5rem",
                fontFamily: "'Montserrat', sans-serif",
                fontSize: "0.68rem", fontWeight: 500,
                letterSpacing: "0.22em", textTransform: "uppercase",
                cursor: status === "working" ? "not-allowed" : "pointer",
                opacity: status === "working" ? 0.7 : 1,
                transition: "background 0.2s",
              }}
            >
              {status === "working" ? "Submitting…" : "Submit discovery"}
            </button>
            <span style={{ fontSize: "0.62rem", color: "#8C8070", letterSpacing: "0.08em" }}>
              All submissions are reviewed before being added.
            </span>
          </div>
        </form>

        {/* Bottom note */}
        <div style={{
          marginTop: "3rem",
          paddingTop: "2rem",
          borderTop: "1px solid rgba(184,150,90,0.1)",
          display: "flex", gap: "1rem", alignItems: "flex-start",
        }}>
          <div style={{ fontSize: "1rem", flexShrink: 0, marginTop: "0.1rem" }}>📬</div>
          <p style={{ fontSize: "0.7rem", color: "#8C8070", lineHeight: 1.8, margin: 0 }}>
            Every submission goes directly to the Cape Wine Pass team for review. If your discovery is added to the app, we'll note you as the finder. Thank you for helping build a more complete picture of the Western Cape wine world.
          </p>
        </div>
      </div>
    </main>
  );
}
