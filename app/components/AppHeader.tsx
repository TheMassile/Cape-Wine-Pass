"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppHeader() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/regions",   label: "Regions"     },
    { href: "/visits",    label: "My Visits"   },
    { href: "/badges",    label: "Badges"      },
    { href: "/discovery", label: "Discoveries" },
  ];

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        borderBottom: "1px solid rgba(184,150,90,0.15)",
        background: "rgba(26,20,16,0.97)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <div className="page-shell">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1.1rem 0",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "1.25rem",
              fontWeight: 400,
              letterSpacing: "0.12em",
              color: "#D4AE7A",
              textDecoration: "none",
              lineHeight: 1,
            }}
          >
            Cape Wine Pass
          </Link>

          {/* Nav */}
          <nav style={{ display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap" }}>
            {navLinks.map((link) => {
              const isActive = pathname?.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: "0.62rem",
                    fontWeight: 400,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    textDecoration: "none",
                    color: isActive ? "#D4AE7A" : "#8C8070",
                    borderBottom: isActive ? "1px solid rgba(184,150,90,0.5)" : "none",
                    paddingBottom: isActive ? "2px" : "0",
                    transition: "color 0.2s",
                  }}
                >
                  {link.label}
                </Link>
              );
            })}

            {/* Sign in button */}
            <Link
              href="/login"
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontSize: "0.62rem",
                fontWeight: 500,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                textDecoration: "none",
                color: "#F5F0E8",
                background: "#6B1A2A",
                border: "1px solid #8C3042",
                padding: "0.45rem 1.2rem",
                transition: "background 0.2s",
              }}
            >
              Sign in
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
