import Link from "next/link";

const features = [
  {
    number: "01",
    title: "Track your progress",
    description: "Tick off estates region by region and see how close you are to completing each area of the Cape.",
  },
  {
    number: "02",
    title: "Save tasting notes",
    description: "Keep favourite reds, whites, rosés and personal comments for every estate you visit.",
  },
  {
    number: "03",
    title: "Keep favourites",
    description: "Mark the estates you love most and return to them easily, sorted by your own preferences.",
  },
  {
    number: "04",
    title: "Unlock milestones",
    description: "Earn milestone badges as you travel and build your own personal Western Cape wine story.",
  },
  {
    number: "05",
    title: "Family-friendly finds",
    description: "Vote on kid-friendly estates and discover which cellars welcome the whole family.",
  },
  {
    number: "06",
    title: "Browse by region",
    description: "Open Stellenbosch, Franschhoek, Constantia and more — all estates in one elegant place.",
  },
];

const steps = [
  {
    number: "01",
    title: "Explore",
    description: "Browse wine farms by region and discover estates you want to visit across the Western Cape.",
  },
  {
    number: "02",
    title: "Record",
    description: "Mark estates as visited, save tasting notes, and capture what stood out from every visit.",
  },
  {
    number: "03",
    title: "Build your pass",
    description: "Track progress, earn badges, and create your own lasting Western Cape wine journey.",
  },
];

export default function HomePage() {
  return (
    <main style={{ background: "#1A1410" }}>

      {/* ── HERO ── */}
      <section style={{ padding: "5rem 0 4rem", position: "relative", overflow: "hidden" }}>
        {/* Background glow */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 55% 50% at 75% 60%, rgba(107,26,42,0.32) 0%, transparent 70%), radial-gradient(ellipse 40% 60% at 20% 80%, rgba(74,15,28,0.28) 0%, transparent 65%)",
        }} />

        <div className="page-shell" style={{ position: "relative" }}>
          <div style={{ display: "grid", gap: "3rem", alignItems: "center", gridTemplateColumns: "1fr" }} className="hero-grid">

            {/* Left */}
            <div>
              <div style={{
                display: "inline-block",
                fontSize: "0.6rem", letterSpacing: "0.28em", textTransform: "uppercase",
                color: "#B8965A", border: "1px solid rgba(184,150,90,0.35)",
                padding: "0.4rem 1.2rem", marginBottom: "2rem",
              }}>
                Western Cape Wine Farm Tracker
              </div>

              <h1 style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(3rem, 7vw, 5.5rem)",
                fontWeight: 300, lineHeight: 1.0,
                color: "#F5F0E8", marginBottom: "0.5rem",
                letterSpacing: "-0.01em",
              }}>
                Discover, track and{" "}
                <em style={{ fontStyle: "italic", color: "#D4AE7A" }}>remember</em>{" "}
                the Cape.
              </h1>

              <p style={{
                fontSize: "0.82rem", color: "#B8AFA0", lineHeight: 1.9,
                maxWidth: "520px", margin: "1.8rem 0 2.5rem",
                letterSpacing: "0.02em",
              }}>
                Cape Wine Pass keeps your wine journey beautifully organised — estates visited,
                tasting notes saved, favourites remembered, milestones earned.
              </p>

              <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", alignItems: "center" }}>
                <Link href="/regions" className="btn-primary">
                  Explore the pass
                </Link>
                <Link href="/login" className="btn-secondary">
                  Create your account →
                </Link>
              </div>

              {/* Mini stat row */}
              <div style={{ display: "flex", gap: "3rem", marginTop: "3rem", flexWrap: "wrap" }}>
                {[
                  { num: "425+", label: "Wine estates" },
                  { num: "6+", label: "Regions" },
                  { num: "∞", label: "Memories" },
                ].map((s) => (
                  <div key={s.label}>
                    <div style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: "2rem", fontWeight: 300,
                      color: "#D4AE7A", lineHeight: 1,
                    }}>{s.num}</div>
                    <div style={{
                      fontSize: "0.58rem", letterSpacing: "0.22em",
                      textTransform: "uppercase", color: "#8C8070", marginTop: "0.25rem",
                    }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right card */}
            <div style={{
              background: "#2C2420",
              border: "1px solid rgba(184,150,90,0.2)",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: "3px",
                background: "linear-gradient(to right, #6B1A2A, #B8965A)",
              }} />
              <div style={{
                background: "linear-gradient(135deg, #1A1410 0%, #4A0F1C 50%, #2C1A0A 100%)",
                padding: "2.5rem",
              }}>
                <div style={{ fontSize: "0.58rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: "1rem" }}>
                  Your wine journey
                </div>
                <h2 style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "1.8rem", fontWeight: 300,
                  color: "#F5F0E8", lineHeight: 1.2, marginBottom: "1rem",
                }}>
                  One place to collect your Cape wine memories.
                </h2>
                <p style={{ fontSize: "0.75rem", color: "rgba(245,240,232,0.65)", lineHeight: 1.85 }}>
                  Keep everything together — estates visited, tasting notes, favourites,
                  progress, and family-friendly discoveries.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: "rgba(184,150,90,0.1)", margin: "1px" }}>
                {[
                  { label: "Save notes", title: "Favourite wines" },
                  { label: "Track visits", title: "Region progress" },
                  { label: "Keep favourites", title: "Loved estates" },
                  { label: "Unlock goals", title: "Milestone badges" },
                ].map((item) => (
                  <div key={item.title} style={{ background: "#2C2420", padding: "1.2rem 1.4rem" }}>
                    <div style={{ fontSize: "0.58rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#8C8070", marginBottom: "0.3rem" }}>
                      {item.label}
                    </div>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1rem", fontWeight: 400, color: "#F5F0E8" }}>
                      {item.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Divider */}
      <div style={{ width: "100%", height: "1px", background: "linear-gradient(to right, transparent, rgba(184,150,90,0.3), transparent)" }} />

      {/* ── FEATURES ── */}
      <section style={{ padding: "5rem 0" }}>
        <div className="page-shell">
          <div style={{ marginBottom: "3rem" }}>
            <div className="muted-label">Why use it</div>
            <h2 className="section-title" style={{ marginTop: "0.75rem" }}>
              Everything in one <em style={{ fontStyle: "italic", color: "#D4AE7A" }}>refined</em> place
            </h2>
            <p className="section-copy" style={{ marginTop: "1rem", maxWidth: "560px" }}>
              Instead of forgetting where you have been, what you loved, or which estates suit a
              family day out — Cape Wine Pass keeps your wine life beautifully in order.
            </p>
          </div>

          <div style={{
            display: "grid", gap: "1px",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            background: "rgba(184,150,90,0.12)",
            border: "1px solid rgba(184,150,90,0.12)",
          }}>
            {features.map((f) => (
              <div
                key={f.title}
                className="feature-cell"
              >
                <div style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "3rem", fontWeight: 300,
                  color: "rgba(184,150,90,0.15)", lineHeight: 1, marginBottom: "1rem",
                }}>
                  {f.number}
                </div>
                <h3 style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "1.3rem", fontWeight: 400,
                  color: "#F5F0E8", marginBottom: "0.7rem",
                }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: "0.75rem", color: "#B8AFA0", lineHeight: 1.85 }}>
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div style={{ width: "100%", height: "1px", background: "linear-gradient(to right, transparent, rgba(184,150,90,0.3), transparent)" }} />

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: "5rem 0", background: "rgba(184,150,90,0.03)" }}>
        <div className="page-shell">
          <div style={{ display: "grid", gap: "4rem", gridTemplateColumns: "1fr" }} className="journey-grid">

            {/* Steps */}
            <div>
              <div className="muted-label">How it works</div>
              <h2 className="section-title" style={{ marginTop: "0.75rem", marginBottom: "2.5rem" }}>
                Build your <em style={{ fontStyle: "italic", color: "#D4AE7A" }}>wine pass</em> in three steps
              </h2>

              <div>
                {steps.map((step, i) => (
                  <div
                    key={step.number}
                    style={{
                      display: "flex", gap: "2rem",
                      padding: "2rem 0",
                      borderBottom: i < steps.length - 1 ? "1px solid rgba(184,150,90,0.12)" : "none",
                    }}
                  >
                    <span style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: "0.9rem", color: "#8C3042",
                      letterSpacing: "0.1em", paddingTop: "0.2rem",
                      flexShrink: 0, width: "2rem", textAlign: "right",
                    }}>
                      {step.number}
                    </span>
                    <div>
                      <h3 style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: "1.5rem", fontWeight: 400,
                        color: "#F5F0E8", marginBottom: "0.5rem",
                      }}>
                        {step.title}
                      </h3>
                      <p style={{ fontSize: "0.76rem", color: "#B8AFA0", lineHeight: 1.85 }}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA card */}
            <div style={{
              background: "#2C2420",
              border: "1px solid rgba(184,150,90,0.2)",
              padding: "3rem", position: "relative",
            }}>
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: "2px",
                background: "linear-gradient(to right, #6B1A2A, #B8965A)",
              }} />
              <div className="muted-label" style={{ marginBottom: "1rem" }}>Begin your journey</div>
              <h2 style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "2rem", fontWeight: 300,
                color: "#F5F0E8", lineHeight: 1.15, marginBottom: "1rem",
              }}>
                Your Cape wine story starts <em style={{ fontStyle: "italic", color: "#D4AE7A" }}>here</em>.
              </h2>
              <p style={{ fontSize: "0.76rem", color: "#B8AFA0", lineHeight: 1.85, marginBottom: "2rem" }}>
                Join wine lovers across the Western Cape who are discovering, tracking and
                remembering the best estates the region has to offer.
              </p>
              <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
                <Link href="/regions" className="btn-primary">
                  Start exploring
                </Link>
                <Link href="/login" className="btn-secondary">
                  Create a free account →
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      <style>{`
        @media (min-width: 1024px) {
          .hero-grid { grid-template-columns: 1.2fr 0.8fr !important; }
          .journey-grid { grid-template-columns: 1fr 1fr !important; }
        }
        .feature-cell {
          background: #2C2420;
          padding: 2.5rem;
          transition: background 0.25s;
        }
        .feature-cell:hover {
          background: #3D3028;
        }
      `}</style>

    </main>
  );
}
