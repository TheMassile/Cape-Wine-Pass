import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import RegionsProgress from "./RegionsProgress";

type RegionRow = {
  Region: string;
  total: number;
};

export default async function RegionsPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from("estates")
    .select('"Region","Status"')
    .neq("Status", "Closed");

  if (error) {
    return (
      <main style={{ minHeight: "100vh", padding: "3rem 1.5rem" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <p style={{
            background: "rgba(192,57,43,0.15)",
            border: "1px solid rgba(192,57,43,0.3)",
            color: "#E07070", padding: "1rem 1.2rem", fontSize: "0.78rem"
          }}>
            {error.message}
          </p>
        </div>
      </main>
    );
  }

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const region = (row as any)["Region"] as string | null;
    if (!region) continue;
    counts.set(region, (counts.get(region) ?? 0) + 1);
  }

  const regions: RegionRow[] = Array.from(counts.entries())
    .map(([Region, total]) => ({ Region, total }))
    .sort((a, b) => a.Region.localeCompare(b.Region));

  const totalEstates = regions.reduce((sum, r) => sum + r.total, 0);

  return (
    <main style={{ minHeight: "100vh" }}>

      {/* ── HERO BANNER ── */}
      <div style={{
        position: "relative", overflow: "hidden",
        minHeight: "380px",
        display: "flex", alignItems: "center",
        borderBottom: "1px solid rgba(184,150,90,0.15)",
      }}>
        {/* Background photo */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <Image
            src="/images/regions-hero.jpg"
            alt="Vineyards and mountains across the Western Cape wine regions"
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover" }}
          />
        </div>

        {/* Light overlay so the photo stays the focal point */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
          background: "linear-gradient(100deg, rgba(26,20,16,0.88) 0%, rgba(26,20,16,0.5) 40%, rgba(26,20,16,0.15) 75%, rgba(26,20,16,0.05) 100%)",
        }} />

        <div className="page-shell" style={{ position: "relative", zIndex: 2, padding: "3rem 0" }}>
          <div style={{
            fontSize: "0.6rem", letterSpacing: "0.25em",
            textTransform: "uppercase", color: "#B8965A", marginBottom: "0.8rem"
          }}>
            Western Cape
          </div>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(2.2rem, 5vw, 3.5rem)",
            fontWeight: 300, color: "#F5F0E8",
            lineHeight: 1.05, marginBottom: "0.5rem",
            textShadow: "0 2px 12px rgba(0,0,0,0.5)",
          }}>
            Wine <em style={{ fontStyle: "italic", color: "#D4AE7A" }}>Regions</em>
          </h1>
          <p style={{ fontSize: "0.78rem", color: "#D4C9B8", letterSpacing: "0.05em" }}>
            {totalEstates} estates across {regions.length} regions
          </p>
        </div>
      </div>

      {/* ── REGION LIST ── */}
      <div className="page-shell" style={{ padding: "2.5rem 0" }}>
        <RegionsProgress regions={regions} />
      </div>
    </main>
  );
}