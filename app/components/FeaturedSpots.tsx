"use client";

// Paid "Wine farm of the week" and "Red of the region" spots, shown on the home page.
// Spots are added by admins at /admin/featured; the database only returns spots running today.
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabaseClient";

type Spot = {
  id: string;
  slot: "farm_of_week" | "red_of_region";
  estate_id: string;
  region: string | null;
  wine_name: string | null;
  blurb: string | null;
  link_url: string | null;
};

type EstateInfo = { name: string; region: string };

export default function FeaturedSpots() {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [estates, setEstates] = useState<Record<string, EstateInfo>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("featured")
        .select("id, slot, estate_id, region, wine_name, blurb, link_url")
        .order("slot")
        .order("starts_on", { ascending: false });
      const rows = (data ?? []) as Spot[];
      if (cancelled || rows.length === 0) return;
      const { data: est } = await supabase
        .from("estates")
        .select('"Estate ID","Estate Name","Region"')
        .in('"Estate ID"', rows.map((r) => r.estate_id));
      const map: Record<string, EstateInfo> = {};
      for (const e of (est ?? []) as Record<string, string>[]) {
        map[e["Estate ID"]] = { name: e["Estate Name"], region: e["Region"] };
      }
      if (!cancelled) {
        setEstates(map);
        setSpots(rows);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (spots.length === 0) return null;

  return (
    <section style={{ padding: "3rem 0 1rem" }}>
      <div className="page-shell">
        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          {spots.map((s) => {
            const estate = estates[s.estate_id];
            const label = s.slot === "farm_of_week" ? "Wine farm of the week" : `Red of the region${s.region || estate?.region ? ` · ${s.region || estate?.region}` : ""}`;
            return (
              <div key={s.id} style={{ background: "#2C2420", border: "1px solid rgba(212,174,122,0.45)", padding: "1.6rem 1.8rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                <div style={{ fontSize: "0.6rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#B8965A" }}>
                  {label}
                </div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.7rem", color: "#F5F0E8", lineHeight: 1.15 }}>
                  {estate?.name ?? "A Cape wine estate"}
                </div>
                {s.wine_name && <div style={{ fontSize: "0.85rem", color: "#D4AE7A" }}>{s.wine_name}</div>}
                {s.blurb && <p style={{ fontSize: "0.8rem", color: "#B8AFA0", lineHeight: 1.7, margin: 0 }}>{s.blurb}</p>}
                <div style={{ display: "flex", gap: "1.2rem", marginTop: "0.4rem", fontSize: "0.62rem", letterSpacing: "0.18em", textTransform: "uppercase" }}>
                  <Link href={`/estate/${encodeURIComponent(s.estate_id)}`} style={{ color: "#D4AE7A", textDecoration: "none" }}>
                    View estate →
                  </Link>
                  {s.link_url && (
                    <a href={s.link_url} target="_blank" rel="noopener noreferrer sponsored" style={{ color: "#8C8070", textDecoration: "none" }}>
                      Book or shop ↗
                    </a>
                  )}
                </div>
                <div style={{ fontSize: "0.55rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#5C5248" }}>Sponsored</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
