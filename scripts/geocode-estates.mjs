// Finds GPS coordinates for every estate that doesn't have them yet.
//
// How to run (in the Codespace terminal, from the project folder):
//     node scripts/geocode-estates.mjs
//
// It reads estates from Supabase (using the keys in .env.local), looks each one
// up on OpenStreetMap, and writes two files into scripts/output/:
//   - estate_coordinates.sql  -> paste into the Supabase SQL editor and Run
//   - estates_to_check.csv    -> estates it couldn't find, or isn't sure about
//                                (those are NOT included in the .sql file)
//
// It never changes the database itself. It waits 1 second between lookups
// (OpenStreetMap's rule). It only looks up estates that still have no coordinates,
// so you can run it again after pasting in the results. Allow ~20 minutes.

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

// --- read .env.local -------------------------------------------------------
const envFile = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error("Couldn't find NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}
const supabase = createClient(url, key);

// --- helpers ---------------------------------------------------------------
// Western Cape, roughly: west, north, east, south
const VIEWBOX = "17.0,-30.0,24.5,-35.0";
const inWesternCape = (lat, lon) => lat <= -30 && lat >= -35 && lon >= 17 && lon <= 24.5;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sqlText = (s) => `'${String(s).replace(/'/g, "''")}'`;
const csv = (s) => `"${String(s ?? "").replace(/"/g, '""')}"`;

const WINE_TYPES = new Set(["winery", "wine", "wine_cellar", "vineyard"]);

// If .env.local has GOOGLE_MAPS_API_KEY, Google Maps is used instead of
// OpenStreetMap. Google knows far more of the smaller estates.
const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY;

async function lookupGoogle(query) {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_KEY,
      "X-Goog-FieldMask": "places.displayName,places.location,places.types,places.formattedAddress",
    },
    body: JSON.stringify({
      textQuery: query,
      pageSize: 5,
      locationRestriction: { rectangle: { low: { latitude: -35, longitude: 17 }, high: { latitude: -30, longitude: 24.5 } } },
    }),
  });
  if (!res.ok) throw new Error(`Google said ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const body = await res.json();
  // Reshape Google's answer to look like OpenStreetMap's, so the rest of the script is the same.
  return (body.places ?? []).map((p) => ({
    lat: String(p.location?.latitude),
    lon: String(p.location?.longitude),
    type: (p.types ?? []).includes("winery") ? "winery" : (p.types ?? [])[0],
    name: p.displayName?.text ?? "",
    display_name: `${p.displayName?.text ?? ""}, ${p.formattedAddress ?? ""}`,
  }));
}

async function lookup(query) {
  if (GOOGLE_KEY) return lookupGoogle(query);
  const u = new URL("https://nominatim.openstreetmap.org/search");
  u.searchParams.set("q", query);
  u.searchParams.set("format", "jsonv2");
  u.searchParams.set("limit", "5");
  u.searchParams.set("countrycodes", "za");
  u.searchParams.set("viewbox", VIEWBOX);
  u.searchParams.set("bounded", "1");
  const res = await fetch(u, { headers: { "User-Agent": "CapeWinePass/1.0 (capewinepass.co.za)" } });
  if (!res.ok) throw new Error(`OpenStreetMap said ${res.status}`);
  return res.json();
}

// "Rustenberg Wine Estate" -> "Rustenberg", so OpenStreetMap's shorter names still match.
const SUFFIXES = /\b(wine estate|wine farm|family wines|wine cellar|wine company|wines|wine|estate|vineyards?|winery|cellars?|winemakers?|farm|the)\b/gi;
const cleanName = (name) => String(name).replace(/[()&,.'’-]/g, " ").replace(SUFFIXES, " ").replace(/\s+/g, " ").trim();
const words = (s) => cleanName(s).toLowerCase().split(" ").filter((w) => w.length > 2);

function distanceKm(aLat, aLon, bLat, bLon) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat), dLon = toRad(bLon - aLon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

// A result counts as "sure" if it looks like a wine place, or its name matches the
// estate's name, AND it's near the other estates already found in that region.
function pickBest(results, estateName, centre) {
  const ok = results.filter((r) => inWesternCape(Number(r.lat), Number(r.lon)));
  const near = (r, km) => !centre || distanceKm(centre.lat, centre.lon, Number(r.lat), Number(r.lon)) <= km;
  const looksWine = (r) => WINE_TYPES.has(r.type) || /wine|vineyard|cellar/i.test(r.display_name);
  const want = words(estateName);
  const nameMatch = (r) => {
    const got = words(r.name || r.display_name.split(",")[0]);
    return want.length > 0 && want.every((w) => got.includes(w));
  };
  const sure = ok.find((r) => (looksWine(r) && near(r, 40)) || (nameMatch(r) && centre && near(r, 25)));
  if (sure) return { hit: sure, sure: true };
  const maybe = ok.find((r) => near(r, 40));
  return maybe ? { hit: maybe, sure: false } : null;
}

// --- main ------------------------------------------------------------------
const { data: estates, error } = await supabase
  .from("estates")
  .select('"Estate ID","Estate Name","Region","Status",latitude,longitude');
if (error) {
  console.error("Couldn't read estates:", error.message);
  console.error("Have you run supabase/migrations/20261114010000_estate_coordinates.sql yet?");
  process.exit(1);
}

// Middle point of the estates already located in each region, used to sanity-check new matches.
const centres = new Map();
for (const e of estates) {
  if (e.latitude == null || e.longitude == null) continue;
  const c = centres.get(e.Region) ?? { lat: 0, lon: 0, n: 0 };
  c.lat += e.latitude; c.lon += e.longitude; c.n += 1;
  centres.set(e.Region, c);
}
for (const c of centres.values()) { c.lat /= c.n; c.lon /= c.n; }

const todo = estates
  .filter((e) => e.latitude == null && e.Status !== "Closed")
  .sort((a, b) => String(a["Estate ID"]).localeCompare(String(b["Estate ID"])));
console.log(`${todo.length} estates need coordinates. Using ${GOOGLE_KEY ? "Google Maps" : "OpenStreetMap"}.`);

const sql = ["-- Generated by scripts/geocode-estates.mjs. Paste into the Supabase SQL editor and Run.", "begin;"];
const check = ["estate_id,estate_name,region,status,found_as,latitude,longitude,google_maps_link"];
let sure = 0, unsure = 0, missing = 0;

for (const [i, e] of todo.entries()) {
  const name = e["Estate Name"];
  const clean = cleanName(name);
  const centre = centres.get(e.Region);
  const queries = GOOGLE_KEY
    ? [`${name}, ${e.Region}, South Africa`, `${clean} wine farm, ${e.Region}`]
    : [...new Set([`${name}, ${e.Region}`, `${clean}, ${e.Region}`, `${name} wine`, `${clean} wine farm`, clean].filter((q) => q.replace(/,.*/, "").trim()))];
  let best = null;
  for (const q of queries) {
    try {
      const found = pickBest(await lookup(q), name, centre);
      if (found && (!best || found.sure)) best = found;
    } catch (err) {
      console.log(`  lookup failed (${err.message}), waiting 10s and carrying on`);
      await sleep(10000);
    }
    await sleep(GOOGLE_KEY ? 200 : 1100);
    if (best?.sure) break;
  }

  const gmaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${e.Region} South Africa`)}`;
  if (best) {
    const lat = Number(best.hit.lat).toFixed(6);
    const lon = Number(best.hit.lon).toFixed(6);
    // Guesses we're not sure about are left switched off (commented out) so a
    // wrong pin never goes live. Check them and fix on the admin page.
    const line = `update public.estates set latitude = ${lat}, longitude = ${lon} where "Estate ID" = ${sqlText(e["Estate ID"])}; -- ${name}`;
    sql.push(best.sure ? line : `-- NOT SURE, check first: ${line}`);
    if (best.sure) sure++;
    else { unsure++; check.push([e["Estate ID"], name, e.Region, "not sure", best.hit.display_name, lat, lon, gmaps].map(csv).join(",")); }
  } else {
    missing++;
    check.push([e["Estate ID"], name, e.Region, "not found", "", "", "", gmaps].map(csv).join(","));
  }
  console.log(`[${i + 1}/${todo.length}] ${name}: ${best ? (best.sure ? "found" : "found, not sure") : "not found"}`);
}

sql.push("commit;");
const outDir = path.join(process.cwd(), "scripts", "output");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "estate_coordinates.sql"), sql.join("\n") + "\n");
fs.writeFileSync(path.join(outDir, "estates_to_check.csv"), check.join("\n") + "\n");

console.log("");
console.log(`Done. Found ${sure}, not sure about ${unsure}, couldn't find ${missing}.`);
console.log("Next: open scripts/output/estate_coordinates.sql, copy it all into the Supabase SQL editor and click Run.");
console.log("Then fix the estates listed in scripts/output/estates_to_check.csv on the admin page.");
