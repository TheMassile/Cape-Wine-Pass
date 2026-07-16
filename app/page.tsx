import Image from "next/image";
import Link from "next/link";

const features = [
  {
    number: "01",
    title: "Track your progress",
    description: "Tick off estates region by region and see how close you are to completing each area of the Cape.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#B8965A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12.5l2.5 2.5L16 9" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Save tasting notes",
    description: "Keep favourite reds, whites, rosés and personal comments for every estate you visit.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#B8965A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 3h10l-1 7a4 4 0 01-8 0L7 3z" />
        <path d="M12 14v6" />
        <path d="M9 20h6" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Keep favourites",
    description: "Mark the estates you love most and return to them easily, sorted by your own preferences.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#B8965A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20s-7-4.35-9.5-8.5C1 8 2.5 4.5 6 4.5c2 0 3.5 1.2 4 2.5.5-1.3 2-2.5 4-2.5 3.5 0 5 3.5 3.5 7C19 15.65 12 20 12 20z" />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Unlock milestones",
    description: "Earn milestone badges as you travel and build your own personal Western Cape wine story.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#B8965A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="9" r="5.5" />
        <path d="M9 13.5L7 21l5-2.5 5 2.5-2-7.5" />
      </svg>
    ),
  },
  {
    number: "05",
    title: "Family-friendly finds",
    description: "Vote on kid-friendly estates and discover which cellars welcome the whole family.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#B8965A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8.5" cy="7" r="2.5" />
        <circle cx="16" cy="8" r="2" />
        <path d="M3.5 19c0-3 2.2-5 5-5s5 2 5 5" />
        <path d="M14 19c0-2 1.6-4 3.5-4.2" />
      </svg>
    ),
  },
  {
    number: "06",
    title: "Browse by region",
    description: "Open Stellenbosch, Franschhoek, Constantia and more — all estates in one elegant place.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#B8965A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M14.5 9.5L13 13l-3.5 1.5L11 11l3.5-1.5z" />
      </svg>
    ),
  },
];

export default function HomePage() {
  return (
    <main style={{ background: "#1A1410" }}>

      {/* ── HERO ── */}
      <section style={{ padding: "5rem 0 4rem", position: "relative", overflow: "hidden" }}>

        {/* Background photo */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <Image
            src="/images/hero-winelands.jpg"
            alt="Stellenbosch mountains and vineyards at sunrise"
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover", objectPosition: "center 30%" }}
          />
        </div>

        {/* Dark overlay for text legibility */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
          background: "linear-gradient(180deg, rgba(26,20,16,0.45) 0%, rgba(26,20,16,0.78) 55%, rgba(26,20,16,0.96) 100%)",
        }} />

        {/* Background glow */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2,
          background: "radial-gradient(ellipse 55% 50% at 75% 60%, rgba(107,26,42,0.32) 0%, transparent 70%), radial-gradient(ellipse 40% 60% at 20% 80%, rgba(74,15,28,0.28) 0%, transparent 65%)",
        }} />

        <div className="page-shell" style={{ position: "relative", zIndex: 3 }}>
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

              <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", alignItems: "center", marginTop: "2.5rem" }}>
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
                  <div key={s.label} style={{ textAlign: "center" }}>
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
                  Cape Wine Pass keeps your wine journey beautifully organised — estates visited,
                  tasting notes saved, favourites remembered, milestones earned.
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

      {/* ── WHY USE IT + FEATURES + CTA (merged) ── */}
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

          {/* Supporting image */}
          <div style={{
            position: "relative", width: "100%", height: "320px",
            marginBottom: "3.5rem", border: "1px solid rgba(184,150,90,0.2)", overflow: "hidden",
          }}>
            <Image
              src="/images/features-vineyard.jpg"
              alt="Wine glasses and protea flower, Stellenbosch"
              fill
              sizes="(max-width: 768px) 100vw, 72rem"
              style={{ objectFit: "cover" }}
            />
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
                <div style={{ marginBottom: "0.9rem" }}>
                  {f.icon}
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

          {/* Closing CTA card */}
          <div style={{
            background: "#2C2420",
            border: "1px solid rgba(184,150,90,0.2)",
            padding: "3rem", position: "relative",
            marginTop: "4rem",
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
            <p style={{ fontSize: "0.76rem", color: "#B8AFA0", lineHeight: 1.85, marginBottom: "2rem", maxWidth: "560px" }}>
              Join wine lovers across the Western Cape who are discovering, tracking and
              remembering the best estates the region has to offer.
            </p>
            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
              <Link href="/regions" className="btn-primary">
                Start exploring
              </Link>
              <Link href="/login" className="btn-secondary">
                Create your account →
              </Link>
            </div>
          </div>

        </div>
      </section>

      <style>{`
        @media (min-width: 1024px) {
          .hero-grid { grid-template-columns: 1.2fr 0.8fr !important; }
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