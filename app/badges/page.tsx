import BadgesClient from "./BadgesClient";

export default function BadgesPage() {
  return (
    <main style={{ minHeight: "100vh", padding: "3rem 1.5rem" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
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
      </div>
    </main>
  );
}
