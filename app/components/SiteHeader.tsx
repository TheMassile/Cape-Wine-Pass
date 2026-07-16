"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "./Logo";
import { supabase } from "@/app/lib/supabaseClient";

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive) setUserId(data.session?.user?.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (alive) setUserId(session?.user?.id ?? null);
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  const navLinks = [
    { href: "/regions", label: "Regions" },
    { href: "/visits", label: "My Visits" },
    { href: "/badges", label: "Badges" },
    { href: "/discovery", label: "Discoveries" },
  ];

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 100,
      background: "#1A1410",
      borderBottom: "1px solid rgba(184,150,90,0.15)",
    }}>
      <div className="page-shell" style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "1rem 0",
      }}>
        <Logo />

        <button
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Menu"
          style={{
            background: "transparent", border: "1px solid rgba(184,150,90,0.3)",
            width: "40px", height: "40px",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: "4px", cursor: "pointer",
          }}
        >
          <span style={{ width: "18px", height: "1px", background: "#B8965A", display: "block", transition: "transform 0.2s", transform: menuOpen ? "translateY(5px) rotate(45deg)" : "none" }} />
          <span style={{ width: "18px", height: "1px", background: "#B8965A", display: "block", opacity: menuOpen ? 0 : 1, transition: "opacity 0.2s" }} />
          <span style={{ width: "18px", height: "1px", background: "#B8965A", display: "block", transition: "transform 0.2s", transform: menuOpen ? "translateY(-5px) rotate(-45deg)" : "none" }} />
        </button>
      </div>

      {/* Dropdown menu */}
      {menuOpen && (
        <div style={{
          borderTop: "1px solid rgba(184,150,90,0.15)",
          background: "#2C2420",
        }}>
          <div className="page-shell" style={{ display: "flex", flexDirection: "column", padding: "1rem 0" }}>
            {navLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  padding: "0.9rem 0",
                  fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase",
                  color: "#B8AFA0", textDecoration: "none",
                  borderBottom: "1px solid rgba(184,150,90,0.08)",
                }}
              >
                {l.label}
              </Link>
            ))}

            {userId ? (
              <button
                onClick={() => { supabase.auth.signOut(); setMenuOpen(false); }}
                style={{
                  marginTop: "1rem",
                  background: "transparent", border: "1px solid rgba(184,150,90,0.25)",
                  color: "#8C8070", padding: "0.6rem 1.2rem",
                  fontFamily: "'Montserrat', sans-serif", fontSize: "0.62rem",
                  letterSpacing: "0.18em", textTransform: "uppercase", cursor: "pointer",
                  alignSelf: "flex-start",
                }}
              >
                Sign out
              </button>
            ) : (
              <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", marginTop: "1rem", flexWrap: "wrap" }}>
                <Link href="/login" onClick={() => setMenuOpen(false)} style={{
                  background: "#6B1A2A", border: "1px solid #8C3042", color: "#F5F0E8",
                  padding: "0.55rem 1.4rem", fontFamily: "'Montserrat', sans-serif",
                  fontSize: "0.62rem", letterSpacing: "0.18em", textTransform: "uppercase", textDecoration: "none",
                }}>
                  Sign in
                </Link>
                <Link href="/onboarding" onClick={() => setMenuOpen(false)} style={{
                  fontSize: "0.68rem", color: "#D4AE7A", textDecoration: "underline",
                }}>
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}