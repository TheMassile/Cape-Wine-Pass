"use client";

// Admin: book "Wine farm of the week" and "Red of the region" spots.
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabaseClient";

type Access = "checking" | "signed-out" | "not-admin" | "admin" | "error";
type Slot = "farm_of_week" | "red_of_region";
type Spot = {
  id: string;
  slot: Slot;
  estate_id: string;
  region: string | null;
  wine_name: string | null;
  blurb: string | null;
  link_url: string | null;
  starts_on: string;
  ends_on: string;
};
type Estate = { id: string; name: string; region: string };

const SLOT_LABEL: Record<Slot, string> = {
  farm_of_week: "Wine farm of the week",
  red_of_region: "Red of the region",
};

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

const field: React.CSSProperties = {
  width: "100%", background: "#1A1410", border: "1px solid rgba(184,150,90,0.25)", color: "#F5F0E8",
  padding: "0.6rem 0.75rem", fontSize: "0.85rem",
};
const label: React.CSSProperties = {
  display: "block", fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#B8965A", marginBottom: "0.35rem",
};

export default function FeaturedAdminPage() {
  const [access, setAccess] = useState<Access>("checking");
  const [estates, setEstates] = useState<Estate[]>([]);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [saving, setSaving] = useState(false);

  const today = new Date();
  const [slot, setSlot] = useState<Slot>("farm_of_week");
  const [estateId, setEstateId] = useState("");
  const [estateSearch, setEstateSearch] = useState("");
  const [wineName, setWineName] = useState("");
  const [blurb, setBlurb] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [startsOn, setStartsOn] = useState(isoDate(today));
  const [endsOn, setEndsOn] = useState(isoDate(new Date(today.getTime() + 6 * 86400000)));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      const user = s.session?.user;
      if (!user) { if (!cancelled) setAccess("signed-out"); return; }
      const { data, error } = await supabase.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
      if (cancelled) return;
      if (error) { setAccess("error"); return; }
      setAccess(data ? "admin" : "not-admin");
    })();
    return () => { cancelled = true; };
  }, []);

  const loadSpots = useCallback(async () => {
    const { data, error } = await supabase
      .from("featured")
      .select("id, slot, estate_id, region, wine_name, blurb, link_url, starts_on, ends_on")
      .order("starts_on", { ascending: false });
    if (error) { setMsg({ text: error.message, error: true }); return; }
    setSpots((data ?? []) as Spot[]);
  }, []);

  useEffect(() => {
    if (access !== "admin") return;
    (async () => {
      const { data } = await supabase.from("estates").select('"Estate ID","Estate Name","Region"').order('"Estate Name"');
      setEstates(((data ?? []) as Record<string, string>[]).map((e) => ({ id: e["Estate ID"], name: e["Estate Name"], region: e["Region"] })));
      await loadSpots();
    })();
  }, [access, loadSpots]);

  const estateById = useMemo(() => new Map(estates.map((e) => [e.id, e])), [estates]);
  const matches = useMemo(() => {
    const q = estateSearch.trim().toLowerCase();
    if (q.length < 2) return [];
    return estates.filter((e) => e.name.toLowerCase().includes(q)).slice(0, 8);
  }, [estateSearch, estates]);

  async function save() {
    setMsg(null);
    const estate = estateById.get(estateId);
    if (!estate) { setMsg({ text: "Pick an estate from the list.", error: true }); return; }
    if (endsOn < startsOn) { setMsg({ text: "The end date is before the start date.", error: true }); return; }
    if (linkUrl && !/^https?:\/\//.test(linkUrl)) { setMsg({ text: "The link must start with https://", error: true }); return; }
    setSaving(true);
    const { error } = await supabase.from("featured").insert({
      slot,
      estate_id: estate.id,
      region: slot === "red_of_region" ? estate.region : null,
      wine_name: wineName.trim() || null,
      blurb: blurb.trim() || null,
      link_url: linkUrl.trim() || null,
      starts_on: startsOn,
      ends_on: endsOn,
    });
    setSaving(false);
    if (error) { setMsg({ text: error.message, error: true }); return; }
    setMsg({ text: `Booked: ${estate.name}, ${startsOn} to ${endsOn}.` });
    setEstateId(""); setEstateSearch(""); setWineName(""); setBlurb(""); setLinkUrl("");
    await loadSpots();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("featured").delete().eq("id", id);
    if (error) { setMsg({ text: error.message, error: true }); return; }
    await loadSpots();
  }

  const todayIso = isoDate(new Date());

  return (
    <main className="page-shell" style={{ padding: "3rem 0 5rem", maxWidth: 760 }}>
      <Link href="/admin" style={{ fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#8C8070", textDecoration: "none" }}>
        ← Admin
      </Link>
      <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: "2.4rem", color: "#F5F0E8", margin: "1rem 0 0.5rem" }}>
        Featured spots
      </h1>
      <p style={{ fontSize: "0.8rem", color: "#8C8070", marginBottom: "2rem" }}>
        Paid spots show on the website home page and in the app on the dates you choose.
      </p>

      {access === "checking" && <p>Checking your access…</p>}
      {access === "signed-out" && <p>Please <Link href="/login" style={{ color: "#D4AE7A" }}>sign in</Link> with your admin account.</p>}
      {access === "not-admin" && <p>Your account doesn&apos;t have admin access.</p>}
      {access === "error" && <p style={{ color: "#E07070" }}>Couldn&apos;t check admin access. Please try again later.</p>}

      {access === "admin" && (
        <>
          <section style={{ background: "#2C2420", border: "1px solid rgba(184,150,90,0.18)", padding: "1.5rem", display: "grid", gap: "1rem" }}>
            <div>
              <span style={label}>Spot</span>
              <select value={slot} onChange={(e) => setSlot(e.target.value as Slot)} style={field}>
                <option value="farm_of_week">{SLOT_LABEL.farm_of_week}</option>
                <option value="red_of_region">{SLOT_LABEL.red_of_region}</option>
              </select>
            </div>
            <div>
              <span style={label}>Estate</span>
              <input value={estateSearch} onChange={(e) => { setEstateSearch(e.target.value); setEstateId(""); }} placeholder="Start typing the estate name" style={field} />
              {!estateId && matches.length > 0 && (
                <div style={{ border: "1px solid rgba(184,150,90,0.25)", borderTop: "none" }}>
                  {matches.map((e) => (
                    <button key={e.id} type="button" onClick={() => { setEstateId(e.id); setEstateSearch(e.name); }}
                      style={{ display: "block", width: "100%", textAlign: "left", background: "#1A1410", color: "#F5F0E8", padding: "0.5rem 0.75rem", border: "none", cursor: "pointer", fontSize: "0.85rem" }}>
                      {e.name} <span style={{ color: "#8C8070" }}>· {e.region}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <span style={label}>Wine (optional)</span>
              <input value={wineName} onChange={(e) => setWineName(e.target.value)} placeholder="e.g. 2021 Cabernet Sauvignon" style={field} />
            </div>
            <div>
              <span style={label}>Short description (optional, up to 280 characters)</span>
              <textarea value={blurb} maxLength={280} onChange={(e) => setBlurb(e.target.value)} rows={3} style={field} />
            </div>
            <div>
              <span style={label}>Booking or shop link (optional)</span>
              <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://" style={field} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <span style={label}>Starts</span>
                <input type="date" value={startsOn} onChange={(e) => setStartsOn(e.target.value)} style={field} />
              </div>
              <div>
                <span style={label}>Ends (inclusive)</span>
                <input type="date" value={endsOn} onChange={(e) => setEndsOn(e.target.value)} style={field} />
              </div>
            </div>
            <button type="button" onClick={save} disabled={saving}
              style={{ background: "#6B1A2A", border: "1px solid #8C3042", color: "#F5F0E8", padding: "0.75rem", fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer" }}>
              {saving ? "Saving…" : "Book this spot"}
            </button>
            {msg && <p style={{ color: msg.error ? "#E07070" : "#8CB87A", fontSize: "0.8rem", margin: 0 }}>{msg.text}</p>}
          </section>

          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: "1.5rem", color: "#F5F0E8", margin: "2.5rem 0 1rem" }}>
            Booked spots
          </h2>
          {spots.length === 0 && <p style={{ fontSize: "0.8rem", color: "#8C8070" }}>None yet.</p>}
          <div style={{ display: "grid", gap: "0.5rem" }}>
            {spots.map((s) => {
              const live = s.starts_on <= todayIso && todayIso <= s.ends_on;
              const past = s.ends_on < todayIso;
              return (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "1rem", background: "#2C2420", border: `1px solid ${live ? "rgba(140,184,122,0.5)" : "rgba(184,150,90,0.18)"}`, padding: "0.9rem 1rem", opacity: past ? 0.55 : 1 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: live ? "#8CB87A" : "#B8965A" }}>
                      {SLOT_LABEL[s.slot]} · {live ? "Live now" : past ? "Finished" : "Upcoming"}
                    </div>
                    <div style={{ color: "#F5F0E8", fontSize: "0.95rem", marginTop: "0.2rem" }}>
                      {estateById.get(s.estate_id)?.name ?? s.estate_id}{s.wine_name ? ` · ${s.wine_name}` : ""}
                    </div>
                    <div style={{ color: "#8C8070", fontSize: "0.75rem" }}>{s.starts_on} to {s.ends_on}</div>
                  </div>
                  <button type="button" onClick={() => remove(s.id)}
                    style={{ background: "transparent", border: "1px solid rgba(184,150,90,0.25)", color: "#B8AFA0", padding: "0.4rem 0.8rem", fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer" }}>
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}
