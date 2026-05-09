import BadgesClient from "./BadgesClient";

export default function BadgesPage() {
  return (
    <main style={{ minHeight: "100vh", padding: "3rem 1.5rem" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>

        {/* Top nav row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <a href="/" className="back-link" style={{ fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#8C8070", textDecoration: "none" }}>
            ← Home
          </a>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            {[{ href: "/regions", label: "Regions" }, { href: "/visits", label: "My Visits" }, { href: "/discovery", label: "Discoveries" }].map(l => (
              <a key={l.href} href={l.href} className="back-link" style={{ fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#8C8070", textDecoration: "none" }}>
                {l.label}
              </a>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: "0.5rem" }}>
          <div style={{
            fontSize: "0.6rem", letterSpacing: "0.25em",
            textTransform: "uppercase", color: "#B8965A", marginBottom: "0.8rem"
          }}>
            Your milestones
          </div>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(2.2rem, 5vw, 3.5rem)",
            fontWeight: 300, color: "#F5F0E8",
            lineHeight: 1.05, marginBottom: "0.5rem"
          }}>
            Wine <em style={{ fontStyle: "italic", color: "#D4AE7A" }}>Badges</em>
          </h1>
          <p style={{ fontSize: "0.78rem", color: "#8C8070", letterSpacing: "0.05em" }}>
            Earn badges by visiting estates and completing regions.
          </p>
        </div>
        <div style={{ marginTop: "2.5rem" }}>
          <BadgesClient />
        </div>

        <style>{`
          .back-link:hover { color: #D4AE7A !important; }
        `}</style>
      </div>
    </main>
  );
}
