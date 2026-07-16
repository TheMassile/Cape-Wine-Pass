import Link from "next/link";

export default function Logo() {
  return (
    <Link
      href="/"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.7rem",
        textDecoration: "none",
      }}
    >
      <svg width="34" height="34" viewBox="0 0 36 36" fill="none" style={{ flexShrink: 0 }}>
        <circle cx="18" cy="18" r="17" stroke="#B8965A" strokeWidth="1" />
        <path d="M17 12 Q15 8 18 6" stroke="#8CB87A" strokeWidth="1.1" fill="none" strokeLinecap="round" />
        <path d="M18 6 Q21 7 20.5 10" stroke="#8CB87A" strokeWidth="1" fill="none" strokeLinecap="round" />
        <circle cx="14" cy="14.5" r="2.5" fill="#B8965A" />
        <circle cx="19.2" cy="13.3" r="2.5" fill="#B8965A" />
        <circle cx="16.3" cy="18" r="2.5" fill="#D4AE7A" />
        <circle cx="21.4" cy="17.5" r="2.5" fill="#D4AE7A" />
        <circle cx="18.5" cy="22" r="2.5" fill="#B8965A" />
      </svg>
      <span
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "1.3rem",
          fontWeight: 400,
          color: "#F5F0E8",
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        Cape Wine <em style={{ fontStyle: "italic", color: "#D4AE7A" }}>Pass</em>
      </span>
    </Link>
  );
}