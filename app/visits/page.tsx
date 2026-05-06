import VisitsClient from "./VisitsClient";

export default function VisitsPage() {
  return (
    <main style={{ minHeight: "100vh", padding: "3rem 1.5rem" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Top nav row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <a href="/regions" style={{
            fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase",
            color: "#8C8070", textDecoration: "none", transition: "color 0.2s",
          }}
          className="back-link">
            ← Regions
          </a>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            {[{ href: "/regions", label: "Regions" }, { href: "/badges", label: "Badges" }].map(l => (
              <a key={l.href} href={l.href} style={{
                fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase",
                color: "#8C8070", textDecoration: "none", transition: "color 0.2s",
              }} className="back-link">{l.label}</a>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: "0.5rem" }}>
          <div style={{
            fontSize: "0.6rem", letterSpacing: "0.25em",
            textTransform: "uppercase", color: "#B8965A", marginBottom: "0.8rem"
          }}>
            Your journey
          </div>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(2.2rem, 5vw, 3.5rem)",
            fontWeight: 300, color: "#F5F0E8",
            lineHeight: 1.05, marginBottom: "0.5rem"
          }}>
            My <em style={{ fontStyle: "italic", color: "#D4AE7A" }}>Visits</em>
          </h1>
        </div>

        <style>{`
          .back-link:hover { color: #D4AE7A !important; }
        `}</style>
        <VisitsClient />
      </div>
    </main>
  );
}
