import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { notFound } from "next/navigation";

type EstateDetail = {
  "Estate ID": string;
  "Estate Name": string;
  Region: string;
  "Public Tasting (Y/N)"?: string | null;
  "Appointment Only (Y/N)"?: string | null;
  "Restaurant (Y/N)"?: string | null;
  "Kid Friendly (Yes/No/Unknown)"?: string | null;
  phone?: string | null;
  website?: string | null;
  description?: string | null;
  opening_hours?: string | null;
  platter_available?: string | null;
  group_friendly?: string | null;
};

export default async function EstatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const estateId = decodeURIComponent(id ?? "");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from("estates")
    .select(`"Estate ID","Estate Name","Region","Public Tasting (Y/N)","Appointment Only (Y/N)","Restaurant (Y/N)","Kid Friendly (Yes/No/Unknown)",phone,website,description,opening_hours,platter_available,group_friendly`)
    .eq('"Estate ID"', estateId)
    .single();

  if (error || !data) notFound();

  const estate = data as EstateDetail;

  const tags = [
    estate["Public Tasting (Y/N)"] === "Y" && { label: "Public tasting", color: "#B8AFA0" },
    estate["Appointment Only (Y/N)"] === "Y" && { label: "By appointment", color: "#B8AFA0" },
    estate["Restaurant (Y/N)"] === "Y" && { label: "Restaurant", color: "#8CB87A" },
    estate.platter_available === "Y" && { label: "Platters available", color: "#8CB87A" },
    estate.group_friendly === "Y" && { label: "Group friendly", color: "#8CB87A" },
  ].filter(Boolean) as { label: string; color: string }[];

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${estate["Estate Name"]} ${estate.Region} Western Cape wine estate`
  )}`;

  return (
    <main style={{ minHeight: "100vh", padding: "3rem 1.5rem" }}>
      <div style={{ maxWidth: "780px", margin: "0 auto" }}>

        {/* Back nav */}
        <Link
          href={`/region/${encodeURIComponent(estate.Region)}`}
          style={{
            fontSize: "0.6rem", letterSpacing: "0.18em",
            textTransform: "uppercase", color: "#8C8070",
            textDecoration: "none", display: "inline-block",
            marginBottom: "2rem",
          }}
        >
          ← {estate.Region}
        </Link>

        {/* Header */}
        <div style={{
          background: "#2C2420",
          border: "1px solid rgba(184,150,90,0.18)",
          padding: "2.5rem",
          marginBottom: "1px",
          position: "relative",
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(to right, #6B1A2A, #B8965A)" }} />

          <div style={{ fontSize: "0.58rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "#B8965A", marginBottom: "0.6rem" }}>
            {estate.Region} · {estate["Estate ID"]}
          </div>

          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(2rem, 5vw, 3rem)",
            fontWeight: 300, color: "#F5F0E8",
            lineHeight: 1.05, marginBottom: "1rem",
          }}>
            {estate["Estate Name"]}
          </h1>

          {/* Tags */}
          {tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem" }}>
              {tags.map(t => (
                <span key={t.label} style={{
                  fontSize: "0.55rem", letterSpacing: "0.15em",
                  textTransform: "uppercase", color: t.color,
                  border: `1px solid ${t.color}40`,
                  padding: "0.25rem 0.7rem",
                }}>
                  {t.label}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {estate.description ? (
            <p style={{ fontSize: "0.82rem", color: "#B8AFA0", lineHeight: 1.9 }}>
              {estate.description}
            </p>
          ) : (
            <p style={{ fontSize: "0.78rem", color: "#8C8070", lineHeight: 1.8, fontStyle: "italic" }}>
              Estate details coming soon. Know something about this estate? Submit a discovery to help us keep the Cape Wine Pass up to date.
            </p>
          )}
        </div>

        {/* Info grid */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: "1px", background: "rgba(184,150,90,0.1)",
          marginBottom: "1px",
        }}>
          {[
            { label: "Opening hours", value: estate.opening_hours, icon: "🕐", isHours: true },
            { label: "Phone", value: estate.phone, icon: "📞", isPhone: true },
            { label: "Website", value: estate.website, icon: "🌐", isLink: true },
            { label: "Platters", value: estate.platter_available === "Y" ? "Available" : estate.platter_available === "N" ? "Not available" : null, icon: "🧀" },
            { label: "Groups", value: estate.group_friendly === "Y" ? "Group friendly" : estate.group_friendly === "N" ? "Not ideal for groups" : null, icon: "👥" },
            { label: "Tasting", value: estate["Public Tasting (Y/N)"] === "Y" ? "Public tastings" : estate["Appointment Only (Y/N)"] === "Y" ? "By appointment only" : null, icon: "🍷" },
          ].map(item => (
            <div key={item.label} style={{ background: "#2C2420", padding: "1.4rem 1.8rem" }}>
              <div style={{ fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#8C8070", marginBottom: "0.4rem" }}>
                {item.icon} {item.label}
              </div>
              {item.value ? (
                item.isLink ? (
                  
                    href={item.value.startsWith("http") ? item.value : `https://${item.value}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: "0.82rem", color: "#D4AE7A", textDecoration: "none", borderBottom: "1px solid rgba(184,150,90,0.3)" }}
                  >
                    {item.value}
                  </a>
                ) : item.isPhone ? (
                  <a href={`tel:${item.value}`} style={{ fontSize: "0.82rem", color: "#F5F0E8", textDecoration: "none" }}>
                    {item.value}
                  </a>
                ) : (
                  <div style={{ fontSize: "0.82rem", color: "#F5F0E8", lineHeight: 1.6 }}>{item.value}</div>
                )
              ) : (
                <div style={{ fontSize: "0.75rem", color: "#8C8070", fontStyle: "italic" }}>Not yet available</div>
              )}

              {item.isHours && (
                
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block",
                    fontSize: "0.62rem",
                    color: "#B8965A",
                    textDecoration: "underline",
                    marginTop: item.value ? "0.5rem" : "0.3rem",
                  }}
                >
                  Check current hours on Google Maps →
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{
          background: "#2C2420",
          border: "1px solid rgba(184,150,90,0.18)",
          padding: "1.5rem 2rem",
          display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center",
        }}>
          <Link
            href={`/region/${encodeURIComponent(estate.Region)}`}
            style={{
              background: "#6B1A2A", border: "1px solid #8C3042",
              color: "#F5F0E8", padding: "0.7rem 1.8rem",
              fontFamily: "'Montserrat', sans-serif",
              fontSize: "0.62rem", fontWeight: 500,
              letterSpacing: "0.2em", textTransform: "uppercase",
              textDecoration: "none",
            }}
          >
            Back to {estate.Region}
          </Link>

          {estate.website && (
            
              href={estate.website.startsWith("http") ? estate.website : `https://${estate.website}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "transparent", border: "1px solid rgba(184,150,90,0.2)",
                color: "#D4AE7A", padding: "0.7rem 1.8rem",
                fontFamily: "'Montserrat', sans-serif",
                fontSize: "0.62rem", letterSpacing: "0.2em",
                textTransform: "uppercase", textDecoration: "none",
              }}
            >
              Visit website →
            </a>
          )}
        </div>

      </div>
    </main>
  );
}