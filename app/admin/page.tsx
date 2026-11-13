"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabaseClient";

type Estate = {
  "Estate ID": string;
  "Estate Name": string;
  Region: string;
  phone?: string | null;
  website?: string | null;
  description?: string | null;
  opening_hours?: string | null;
  "Restaurant (Y/N)"?: string | null;
  "Appointment Only (Y/N)"?: string | null;
  "Public Tasting (Y/N)"?: string | null;
  platter_available?: string | null;
  group_friendly?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";
type AccessState = "checking" | "signed-out" | "not-admin" | "admin" | "error";

export default function AdminPage() {
  // Access is decided by the database: you must be signed in AND listed in the
  // "admins" table. There is no shared password any more.
  const [access, setAccess]         = useState<AccessState>("checking");
  const authed = access === "admin";

  const [estates, setEstates]       = useState<Estate[]>([]);
  const [loading, setLoading]       = useState(false);
  const [q, setQ]                   = useState("");
  const [regionFilter, setRegionFilter] = useState("All");
  const [selected, setSelected]     = useState<Estate | null>(null);
  const [form, setForm]             = useState<Partial<Estate>>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [completedOnly, setCompletedOnly] = useState(false);
  const [missingGpsOnly, setMissingGpsOnly] = useState(false);
  const [coordsInput, setCoordsInput] = useState("");
  const [coordsError, setCoordsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function checkAccess() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) { if (!cancelled) setAccess("signed-out"); return; }
      const { data, error } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) { setAccess("error"); return; }
      setAccess(data ? "admin" : "not-admin");
    }
    checkAccess();
    const { data: sub } = supabase.auth.onAuthStateChange(() => { checkAccess(); });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!authed) return;
    setLoading(true);
    supabase
      .from("estates")
      .select(`"Estate ID","Estate Name","Region","Restaurant (Y/N)","Appointment Only (Y/N)","Public Tasting (Y/N)",phone,website,description,opening_hours,platter_available,group_friendly,latitude,longitude`)
      .neq("Status", "Closed")
      .order("Region")
      .then(({ data }) => {
        setEstates((data ?? []) as Estate[]);
        setLoading(false);
      });
  }, [authed]);

  const regions = useMemo(() => ["All", ...Array.from(new Set(estates.map(e => e.Region))).sort()], [estates]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return estates.filter(e => {
      if (regionFilter !== "All" && e.Region !== regionFilter) return false;
      if (qq && !(e["Estate Name"] ?? "").toLowerCase().includes(qq) && !(e["Estate ID"] ?? "").toLowerCase().includes(qq)) return false;
      if (missingGpsOnly && e.latitude != null) return false;
      if (completedOnly) {
        const hasData = e.phone || e.website || e.description || e.opening_hours;
        if (!hasData) return false;
      }
      return true;
    });
  }, [estates, q, regionFilter, completedOnly, missingGpsOnly]);

  const totalWithData = useMemo(() => estates.filter(e => e.phone || e.website || e.description || e.opening_hours).length, [estates]);

  function selectEstate(estate: Estate) {
    setSelected(estate);
    setForm({ ...estate });
    setCoordsInput(estate.latitude != null && estate.longitude != null ? `${estate.latitude}, ${estate.longitude}` : "");
    setCoordsError(null);
    setSaveStatus("idle");
  }

  function updateForm(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value || null }));
    setSaveStatus("idle");
  }

  async function saveEstate() {
    if (!selected) return;

    // Coordinates are typed as "latitude, longitude", the way Google Maps copies them.
    let latitude: number | null = null;
    let longitude: number | null = null;
    if (coordsInput.trim()) {
      const parts = coordsInput.split(",").map(p => Number(p.trim()));
      const ok = parts.length === 2 && parts.every(n => Number.isFinite(n))
        && parts[0] <= -30 && parts[0] >= -35 && parts[1] >= 17 && parts[1] <= 24.5;
      if (!ok) { setCoordsError("Paste as: -33.9321, 18.8602 (must be in the Western Cape)"); setSaveStatus("error"); return; }
      [latitude, longitude] = parts;
    }
    setCoordsError(null);
    setSaveStatus("saving");
    const payload = {
      phone: form.phone ?? null,
      website: form.website ?? null,
      description: form.description ?? null,
      opening_hours: form.opening_hours ?? null,
      "Restaurant (Y/N)": form["Restaurant (Y/N)"] ?? null,
      "Appointment Only (Y/N)": form["Appointment Only (Y/N)"] ?? null,
      "Public Tasting (Y/N)": form["Public Tasting (Y/N)"] ?? null,
      platter_available: form.platter_available ?? null,
      group_friendly: form.group_friendly ?? null,
      latitude,
      longitude,
    };
    const { data: updated, error } = await supabase
      .from("estates")
      .update(payload)
      .eq('"Estate ID"', selected["Estate ID"])
      .select('"Estate ID"');

    // If the database refused the change, no rows come back. Treat that as an error
    // rather than pretending it saved.
    if (error || !updated || updated.length === 0) { setSaveStatus("error"); return; }

    // Update local state
    setEstates(prev => prev.map(e =>
      e["Estate ID"] === selected["Estate ID"] ? { ...e, ...payload } : e
    ));
    setSelected(prev => prev ? { ...prev, ...payload } : null);
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2500);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "rgba(44,36,32,0.6)",
    border: "1px solid rgba(184,150,90,0.2)", color: "#F5F0E8",
    fontFamily: "'Montserrat', sans-serif", fontSize: "0.8rem",
    fontWeight: 300, padding: "0.65rem 0.9rem", outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "0.56rem", letterSpacing: "0.2em",
    textTransform: "uppercase", color: "#B8AFA0", marginBottom: "0.35rem",
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle, cursor: "pointer",
  };

  // ── LOGIN SCREEN ──
  if (!authed) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ maxWidth: "380px", width: "100%" }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.2rem", letterSpacing: "0.12em", color: "#D4AE7A", marginBottom: "2rem" }}>
            Cape Wine Pass
          </div>
          <div style={{ background: "#2C2420", border: "1px solid rgba(184,150,90,0.18)", padding: "2.5rem", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(to right, #6B1A2A, #B8965A)" }} />
            <div style={{ fontSize: "0.58rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "#B8965A", marginBottom: "0.6rem" }}>Admin access</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.8rem", fontWeight: 300, color: "#F5F0E8", marginBottom: "1.5rem" }}>Estate Manager</h1>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", fontSize: "0.78rem", color: "#B8AFA0", lineHeight: 1.7 }}>
              {access === "checking" && <p>Checking your access…</p>}
              {access === "signed-out" && (
                <>
                  <p>Sign in with your Cape Wine Pass account to manage estates.</p>
                  <Link href="/login" style={{ background: "#6B1A2A", border: "1px solid #8C3042", color: "#F5F0E8", padding: "0.85rem", fontFamily: "'Montserrat', sans-serif", fontSize: "0.68rem", fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", textAlign: "center", textDecoration: "none" }}>
                    Sign in
                  </Link>
                </>
              )}
              {access === "not-admin" && <p>Your account doesn&apos;t have admin access.</p>}
              {access === "error" && <p style={{ color: "#E07070" }}>Couldn&apos;t check admin access. Please try again later.</p>}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── ADMIN DASHBOARD ──
  return (
    <main style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 420px", height: "100vh", overflow: "hidden" }}>

      {/* ── LEFT: Estate list ── */}
      <div style={{ display: "flex", flexDirection: "column", borderRight: "1px solid rgba(184,150,90,0.15)", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ background: "#2C2420", borderBottom: "1px solid rgba(184,150,90,0.15)", padding: "1.2rem 1.5rem", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.2rem", color: "#D4AE7A" }}>Estate Manager</div>
            <div style={{ fontSize: "0.6rem", letterSpacing: "0.15em", color: "#B8965A" }}>
              {totalWithData} / {estates.length} estates have data
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ height: "2px", background: "rgba(184,150,90,0.12)", marginBottom: "1rem" }}>
            <div style={{ height: "100%", width: `${estates.length ? Math.round(totalWithData / estates.length * 100) : 0}%`, background: "#B8965A", transition: "width 0.4s" }} />
          </div>

          {/* Search */}
          <div style={{ position: "relative", marginBottom: "0.7rem" }}>
            <svg style={{ position: "absolute", left: "0.7rem", top: "50%", transform: "translateY(-50%)", width: "11px", height: "11px", stroke: "#8C8070", fill: "none", strokeWidth: 2 }} viewBox="0 0 16 16">
              <circle cx="6.5" cy="6.5" r="4.5"/><line x1="10" y1="10" x2="14" y2="14"/>
            </svg>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search estates…" style={{ ...inputStyle, padding: "0.55rem 0.8rem 0.55rem 2rem", fontSize: "0.75rem" }} />
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} style={{ ...selectStyle, padding: "0.4rem 0.7rem", fontSize: "0.68rem", flex: 1 }}>
              {regions.map(r => <option key={r} value={r} style={{ background: "#2C2420" }}>{r}</option>)}
            </select>
            <button
              onClick={() => setCompletedOnly(v => !v)}
              style={{
                fontSize: "0.58rem", letterSpacing: "0.15em", textTransform: "uppercase",
                padding: "0.4rem 0.8rem", cursor: "pointer", fontFamily: "'Montserrat', sans-serif",
                background: completedOnly ? "#6B1A2A" : "transparent",
                border: completedOnly ? "1px solid #8C3042" : "1px solid rgba(184,150,90,0.2)",
                color: completedOnly ? "#F5F0E8" : "#8C8070",
              }}
            >
              Has data
            </button>
            <button
              onClick={() => setMissingGpsOnly(v => !v)}
              style={{
                fontSize: "0.58rem", letterSpacing: "0.15em", textTransform: "uppercase",
                padding: "0.4rem 0.8rem", cursor: "pointer", fontFamily: "'Montserrat', sans-serif",
                background: missingGpsOnly ? "#6B1A2A" : "transparent",
                border: missingGpsOnly ? "1px solid #8C3042" : "1px solid rgba(184,150,90,0.2)",
                color: missingGpsOnly ? "#F5F0E8" : "#8C8070",
              }}
            >
              Missing GPS
            </button>
          </div>

          <div style={{ fontSize: "0.58rem", color: "#8C8070", marginTop: "0.6rem", letterSpacing: "0.1em" }}>
            Showing {filtered.length} estates
          </div>
        </div>

        {/* Estate list */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {loading ? (
            <div style={{ padding: "2rem", fontSize: "0.75rem", color: "#8C8070", textAlign: "center" }}>Loading estates…</div>
          ) : (
            filtered.map(e => {
              const hasData = !!(e.phone || e.website || e.description || e.opening_hours);
              const isSelected = selected?.["Estate ID"] === e["Estate ID"];
              return (
                <button
                  key={e["Estate ID"]}
                  onClick={() => selectEstate(e)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "0.9rem 1.5rem", background: isSelected ? "rgba(107,26,42,0.25)" : "transparent",
                    border: "none", borderBottom: "1px solid rgba(184,150,90,0.06)",
                    cursor: "pointer", textAlign: "left", transition: "background 0.15s",
                    borderLeft: isSelected ? "2px solid #6B1A2A" : "2px solid transparent",
                  }}
                >
                  <div>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "0.95rem", color: "#F5F0E8", marginBottom: "0.15rem" }}>
                      {e["Estate Name"]}
                    </div>
                    <div style={{ fontSize: "0.58rem", color: "#8C8070", letterSpacing: "0.08em" }}>
                      {e.Region} · {e["Estate ID"]}
                    </div>
                  </div>
                  <div style={{
                    width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0,
                    background: hasData ? "#8CB87A" : "rgba(184,150,90,0.2)",
                  }} />
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── RIGHT: Edit form ── */}
      <div style={{ overflowY: "auto", background: "#1A1410" }}>
        {!selected ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", padding: "2rem" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", color: "#8C8070", marginBottom: "0.5rem" }}>
                Select an estate
              </div>
              <div style={{ fontSize: "0.7rem", color: "#8C8070" }}>Click any estate on the left to edit its details</div>
            </div>
          </div>
        ) : (
          <div style={{ padding: "1.5rem" }}>
            {/* Estate header */}
            <div style={{ marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid rgba(184,150,90,0.12)" }}>
              <div style={{ fontSize: "0.56rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#B8965A", marginBottom: "0.4rem" }}>
                {selected.Region} · {selected["Estate ID"]}
              </div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.5rem", fontWeight: 300, color: "#F5F0E8" }}>
                {selected["Estate Name"]}
              </h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>

              {/* Description */}
              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  value={form.description ?? ""}
                  onChange={e => updateForm("description", e.target.value)}
                  placeholder="2–3 sentences about the estate's character, wines and experience…"
                  rows={4}
                  style={{ ...inputStyle, resize: "vertical" as const }}
                />
              </div>

              {/* Phone + Website */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input type="text" value={form.phone ?? ""} onChange={e => updateForm("phone", e.target.value)} placeholder="021 xxx xxxx" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Website</label>
                  <input type="text" value={form.website ?? ""} onChange={e => updateForm("website", e.target.value)} placeholder="www.estate.co.za" style={inputStyle} />
                </div>
              </div>

              {/* Opening hours */}
              <div>
                <label style={labelStyle}>Opening hours</label>
                <input type="text" value={form.opening_hours ?? ""} onChange={e => updateForm("opening_hours", e.target.value)} placeholder="Mon–Fri 9am–5pm, Sat 9am–3pm" style={inputStyle} />
              </div>

              {/* GPS coordinates */}
              <div>
                <label style={labelStyle}>GPS coordinates (latitude, longitude)</label>
                <input type="text" value={coordsInput} onChange={e => { setCoordsInput(e.target.value); setSaveStatus("idle"); }} placeholder="-33.9321, 18.8602" style={{ ...inputStyle, borderColor: coordsError ? "rgba(192,57,43,0.5)" : "rgba(184,150,90,0.2)" }} />
                {coordsError && <div style={{ fontSize: "0.65rem", color: "#E07070", marginTop: "0.4rem" }}>{coordsError}</div>}
                <div style={{ fontSize: "0.62rem", color: "#8C8070", marginTop: "0.4rem", lineHeight: 1.6 }}>
                  In Google Maps, right-click the tasting room and click the numbers at the top of the menu to copy them, then paste here.{" "}
                  <a href={coordsInput.trim() ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordsInput.trim())}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selected["Estate Name"]} ${selected.Region} South Africa`)}`} target="_blank" rel="noopener noreferrer" style={{ color: "#B8965A" }}>
                    {coordsInput.trim() ? "Check this pin on Google Maps" : "Find on Google Maps"}
                  </a>
                </div>
              </div>

              {/* Yes/No fields */}
              {[
                { field: "Restaurant (Y/N)", label: "Restaurant" },
                { field: "Appointment Only (Y/N)", label: "Appointment only" },
                { field: "Public Tasting (Y/N)", label: "Public tasting" },
                { field: "platter_available", label: "Platters available" },
                { field: "group_friendly", label: "Group friendly" },
              ].map(({ field, label }) => (
                <div key={field}>
                  <label style={labelStyle}>{label}</label>
                  <select
                    value={(form as any)[field] ?? ""}
                    onChange={e => updateForm(field, e.target.value)}
                    style={selectStyle}
                  >
                    <option value="" style={{ background: "#2C2420" }}>Unknown</option>
                    <option value="Y" style={{ background: "#2C2420" }}>Yes</option>
                    <option value="N" style={{ background: "#2C2420" }}>No</option>
                  </select>
                </div>
              ))}

              {/* Save button */}
              <button
                onClick={saveEstate}
                disabled={saveStatus === "saving"}
                style={{
                  background: saveStatus === "saved" ? "rgba(46,125,50,0.3)" : "#6B1A2A",
                  border: saveStatus === "saved" ? "1px solid rgba(46,125,50,0.5)" : "1px solid #8C3042",
                  color: "#F5F0E8", padding: "0.9rem",
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: "0.68rem", fontWeight: 500,
                  letterSpacing: "0.2em", textTransform: "uppercase",
                  cursor: saveStatus === "saving" ? "not-allowed" : "pointer",
                  opacity: saveStatus === "saving" ? 0.7 : 1,
                  transition: "all 0.2s", marginTop: "0.5rem",
                }}
              >
                {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved ✓" : saveStatus === "error" ? "Error — try again" : "Save changes"}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          main { grid-template-columns: 1fr !important; height: auto !important; }
        }
      `}</style>
    </main>
  );
}
