import VisitsClient from "./VisitsClient";

export default function VisitsPage() {
  return (
    <main style={{ minHeight: "100vh", padding: "3rem 1.5rem" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
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
        <VisitsClient />
      </div>
    </main>
  );
}
