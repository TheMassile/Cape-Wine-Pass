import type { ReactNode } from "react";

// Shared layout for the privacy policy and account deletion pages.
export function LegalPage({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <main style={{ minHeight: "100vh", padding: "3rem 1.5rem 5rem" }}>
      <article className="legal" style={{ maxWidth: "760px", margin: "0 auto" }}>
        <p style={{ fontSize: "0.6rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--gold)", marginBottom: "0.75rem" }}>
          {eyebrow}
        </p>
        <h1 style={{ fontFamily: "var(--font-serif, 'Cormorant Garamond', serif)", fontWeight: 300, fontSize: "2.6rem", lineHeight: 1.1, color: "var(--cream)", marginBottom: "2rem" }}>
          {title}
        </h1>
        {children}
      </article>
    </main>
  );
}

export function H2({ children }: { children: ReactNode }) {
  return (
    <h2 style={{ fontFamily: "var(--font-serif, 'Cormorant Garamond', serif)", fontWeight: 400, fontSize: "1.6rem", color: "var(--gold-light)", margin: "2.5rem 0 0.75rem" }}>
      {children}
    </h2>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p style={{ fontSize: "0.92rem", lineHeight: 1.75, color: "var(--stone-light)", marginBottom: "0.9rem" }}>{children}</p>;
}

export function UL({ children }: { children: ReactNode }) {
  return (
    <ul style={{ fontSize: "0.92rem", lineHeight: 1.75, color: "var(--stone-light)", margin: "0 0 0.9rem 1.2rem", listStyle: "disc" }}>
      {children}
    </ul>
  );
}
