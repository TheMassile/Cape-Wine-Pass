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
    <main style={{ minHeight: "100vh", padding: "3rem 1.5rem" }}>
      <div style={{ maxWidth: "860px", margin: "0 auto" }}>

        {/* Page header */}
        {/* Top nav row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <a href="/" className="back-link" style={{ fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#8C8070", textDecoration: "none" }}>
            ← Home
          </a>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            {[{ href: "/visits", label: "My Visits" }, { href: "/badges", label: "Badges" }].map(l => (
              <a key={l.href} href={l.href} className="back-link" style={{ fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#8C8070", textDecoration: "none" }}>{l.label}</a>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: "0.5rem" }}>
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
            lineHeight: 1.05, marginBottom: "0.5rem"
          }}>
            Wine <em style={{ fontStyle: "italic", color: "#D4AE7A" }}>Regions</em>
          </h1>
          <p style={{ fontSize: "0.78rem", color: "#8C8070", letterSpacing: "0.05em" }}>
            {totalEstates} estates across {regions.length} regions
          </p>
        </div>

        <RegionsProgress regions={regions} />

        <style>{`
          .back-link:hover { color: #D4AE7A !important; }
        `}</style>
      </div>
    </main>
  );
}
