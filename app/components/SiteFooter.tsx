import Link from "next/link";

const link = { fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase" as const, color: "var(--stone)", textDecoration: "none" };

export default function SiteFooter() {
  return (
    <footer style={{ borderTop: "1px solid rgba(184,150,90,0.15)", padding: "2rem 1.5rem", marginTop: "auto" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", gap: "2rem", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ ...link, color: "var(--stone)" }}>© {new Date().getFullYear()} Cape Wine Pass · Enjoy responsibly · 18+</span>
        <nav style={{ display: "flex", gap: "1.5rem" }}>
          <Link href="/privacy" className="back-link" style={link}>Privacy</Link>
          <Link href="/delete-account" className="back-link" style={link}>Delete account</Link>
        </nav>
      </div>
    </footer>
  );
}
