import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import RegionClient from "./RegionClient";

export type EstateRow = {
  "Estate ID": string;
  "Estate Name": string;
  Region: string;
  Status?: string | null;
  "Appointment Only (Y/N)"?: string | null;
  "Restaurant (Y/N)"?: string | null;
  "Kid Friendly (Yes/No/Unknown)"?: string | null;
};

export default async function RegionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const regionName = decodeURIComponent(slug ?? "");

  if (!regionName) {
    return (
      <main style={{ minHeight: "100vh", padding: "3rem 1.5rem" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <p style={{ fontSize: "0.78rem", color: "#8C8070" }}>Region not found.</p>
          <Link href="/regions" style={{ color: "#D4AE7A", fontSize: "0.72rem", marginTop: "1rem", display: "inline-block" }}>
            ← Back to regions
          </Link>
        </div>
      </main>
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from("estates")
    .select(`"Estate ID","Estate Name","Region","Status","Appointment Only (Y/N)","Restaurant (Y/N)","Kid Friendly (Yes/No/Unknown)"`)
    .eq("Region", regionName)
    .neq("Status", "Closed")
    .order("Estate Name", { ascending: true });

  const estates: EstateRow[] = (data ?? []) as EstateRow[];

  return (
    <main style={{ minHeight: "100vh", padding: "3rem 1.5rem" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <Link href="/regions" className="back-link">
            ← Regions
          </Link>

          <div style={{
            fontSize: "0.6rem", letterSpacing: "0.25em",
            textTransform: "uppercase", color: "#B8965A", marginBottom: "0.6rem",
          }}>
            Western Cape
          </div>

          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(2.2rem, 5vw, 3.5rem)",
            fontWeight: 300, color: "#F5F0E8",
            lineHeight: 1.05, marginBottom: "0.4rem",
          }}>
            {regionName}
          </h1>

          <p style={{ fontSize: "0.75rem", color: "#8C8070", letterSpacing: "0.05em" }}>
            {estates.length} estates in this region
          </p>
        </div>

        {error && (
          <div style={{
            background: "rgba(192,57,43,0.15)", border: "1px solid rgba(192,57,43,0.3)",
            color: "#E07070", padding: "1rem", fontSize: "0.72rem", marginBottom: "1.5rem",
          }}>
            {error.message}
          </div>
        )}

        <RegionClient regionName={regionName} estates={estates} />

      </div>

      <style>{`
        .back-link {
          font-size: 0.6rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #8C8070;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          margin-bottom: 1.2rem;
          transition: color 0.2s;
        }
        .back-link:hover { color: #D4AE7A; }
      `}</style>
    </main>
  );
}
