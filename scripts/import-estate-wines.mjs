// Fills each estate's wine list by reading the estate's own website.
//
// How to run (in the Codespace terminal, from the project folder):
//     node scripts/import-estate-wines.mjs --limit 10     <- try 10 estates first
//     node scripts/import-estate-wines.mjs                <- then all the rest
//
// What it needs in .env.local:
//     NEXT_PUBLIC_SUPABASE_URL=...        (already there)
//     NEXT_PUBLIC_SUPABASE_ANON_KEY=...   (already there)
//     ANTHROPIC_API_KEY=sk-ant-...        (from console.anthropic.com -> API keys)
//
// For each estate with a website it:
//   1. opens the home page and up to 3 pages that look like wine / shop pages,
//   2. asks Claude to list the wines that estate makes (name + red / white / rosé & other),
//   3. remembers the answer in scripts/output/wine-import-progress.json.
// Running it again skips estates already done, so you can stop (Ctrl+C) and carry on later.
//
// At the end it writes scripts/output/estate_wines_import.sql -> paste into the
// Supabase SQL editor and Run. It never changes the database itself.
// Every imported wine is labelled source = 'import', so a bad batch can be removed with:
//     delete from public.wines where source = 'import';

import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

// --- settings --------------------------------------------------------------
const MODEL = "claude-opus-5-5";
const PRICE_IN = 4 / 1e6; // US$ per input token
const PRICE_OUT = 20 / 1e6; // US$ per output token
const CONCURRENCY = 4;
const MAX_PAGES = 4; // home page + 3 wine-looking pages
const MAX_CHARS_PER_PAGE = 15000;
const FETCH_TIMEOUT_MS = 15000;

const args = process.argv.slice(2);
const limitArg = args.indexOf("--limit");
const LIMIT = limitArg >= 0 ? Number(args[limitArg + 1]) : Infinity;
const RETRY_EMPTY = args.includes("--retry-empty");

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
if (!process.env.ANTHROPIC_API_KEY) {
  console.error("Add ANTHROPIC_API_KEY=sk-ant-... to .env.local first (console.anthropic.com -> API keys).");
  process.exit(1);
}
const supabase = createClient(url, key);
const claude = new Anthropic();

const outDir = path.join(process.cwd(), "scripts", "output");
fs.mkdirSync(outDir, { recursive: true });
const progressFile = path.join(outDir, "wine-import-progress.json");
const progress = fs.existsSync(progressFile) ? JSON.parse(fs.readFileSync(progressFile, "utf8")) : {};
const saveProgress = () => fs.writeFileSync(progressFile, JSON.stringify(progress, null, 1));

// --- reading websites ------------------------------------------------------
const WINE_LINK = /wine|shop|store|range|collection|cellar|portfolio|product|buy|tasting/i;
const SKIP_LINK = /\.(pdf|jpe?g|png|gif|webp|zip|mp4)(\?|$)|wp-login|cart|checkout|account|facebook|instagram|twitter|mailto:|tel:/i;

function normaliseSite(site) {
  let s = String(site ?? "").trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try {
    return new URL(s);
  } catch {
    return null;
  }
}

async function fetchPage(u) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(u, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; CapeWinePassBot/1.0)", Accept: "text/html" },
    });
    if (!res.ok || !(res.headers.get("content-type") ?? "").includes("html")) return null;
    return { url: res.url, html: await res.text() };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function htmlToText(html) {
  return html
    .replace(/<(script|style|noscript|svg|iframe)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>|<\/(p|div|li|h[1-6]|tr|section|article)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&#8211;|&ndash;/g, "-")
    .replace(/&eacute;/g, "é")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim()
    .slice(0, MAX_CHARS_PER_PAGE);
}

function wineLinks(html, base) {
  const found = new Map();
  for (const m of html.matchAll(/<a\s[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const [, href, inner] = m;
    const label = inner.replace(/<[^>]+>/g, " ").trim();
    if (SKIP_LINK.test(href) || !(WINE_LINK.test(href) || WINE_LINK.test(label))) continue;
    try {
      const u = new URL(href, base);
      if (u.hostname.replace(/^www\./, "") !== base.hostname.replace(/^www\./, "")) continue;
      u.hash = "";
      // Prefer pages whose address mentions wine.
      const score = (/wine/i.test(u.pathname) ? 2 : 0) + (/wine/i.test(label) ? 1 : 0);
      if (!found.has(u.href) || found.get(u.href) < score) found.set(u.href, score);
    } catch {
      // ignore broken links
    }
  }
  return [...found.entries()].sort((a, b) => b[1] - a[1]).map(([u]) => u);
}

async function readEstateSite(site) {
  const home = await fetchPage(site.href);
  if (!home) return null;
  const pages = [{ url: home.url, text: htmlToText(home.html) }];
  for (const link of wineLinks(home.html, new URL(home.url))) {
    if (pages.length >= MAX_PAGES) break;
    if (pages.some((p) => p.url === link)) continue;
    const page = await fetchPage(link);
    if (page) pages.push({ url: page.url, text: htmlToText(page.html) });
  }
  return pages;
}

// --- asking Claude ---------------------------------------------------------
const SCHEMA = {
  type: "object",
  properties: {
    wines: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          colour: { type: "string", enum: ["red", "white", "rose_other"] },
        },
        required: ["name", "colour"],
        additionalProperties: false,
      },
    },
  },
  required: ["wines"],
  additionalProperties: false,
};

const SYSTEM = `You build the wine list for one South African wine estate in a wine-tourism app, where visitors pick their favourite red, white and rosé from the estate's list.

You get text scraped from the estate's own website. List the wines this estate makes and sells under its own labels, as a visitor would recognise them on a tasting menu.

- Name each wine the way the estate does: range or label plus cultivar or blend name, e.g. "Reserve Pinotage", "The Chocolate Block", "Chenin Blanc". Leave out vintage years, bottle sizes, prices and "wine" suffixes.
- colour: "red" for red wines; "white" for white wines; "rose_other" for rosé, blanc de noir, sparkling / MCC / Cap Classique, dessert, fortified and port-style wines.
- Leave out anything that isn't wine (brandy, gin, olive oil, gift packs, merchandise, events), wines from other producers, and duplicates of the same wine in different vintages.
- Only list wines the text actually shows. If the text shows no wines (e.g. an error page or a page about something else), return an empty list.`;

async function extractWines(estateName, pages) {
  const content = pages.map((p) => `=== Page: ${p.url} ===\n${p.text}`).join("\n\n");
  const response = await claude.beta.messages.create({
    model: MODEL,
    max_tokens: 8000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
    system: SYSTEM,
    messages: [{ role: "user", content: `Estate: ${estateName}\n\n${content}` }],
  });
  const cost = response.usage.input_tokens * PRICE_IN + response.usage.output_tokens * PRICE_OUT;
  if (response.stop_reason === "refusal") return { wines: [], cost, note: "declined" };
  if (response.stop_reason === "max_tokens") return { wines: [], cost, note: "answer too long" };
  const text = response.content.find((b) => b.type === "text")?.text ?? "";
  try {
    return { wines: JSON.parse(text).wines ?? [], cost };
  } catch {
    return { wines: [], cost, note: "unreadable answer" };
  }
}

// --- main ------------------------------------------------------------------
const { data: estates, error } = await supabase
  .from("estates")
  .select(`"Estate ID","Estate Name",website,Status`)
  .order("Estate Name");
if (error) {
  console.error("Couldn't read estates:", error.message);
  process.exit(1);
}

const todo = estates
  .filter((e) => e.Status !== "Closed" && normaliseSite(e.website))
  .filter((e) => {
    const done = progress[e["Estate ID"]];
    return !done || (RETRY_EMPTY && done.wines.length === 0);
  })
  .slice(0, LIMIT);

console.log(`${estates.length} estates, ${todo.length} to read now (${Object.keys(progress).length} done before).`);
let spent = 0;
let n = 0;

async function worker() {
  while (todo.length) {
    const e = todo.shift();
    const id = e["Estate ID"];
    const name = e["Estate Name"];
    const label = `[${++n}] ${name}`;
    try {
      const pages = await readEstateSite(normaliseSite(e.website));
      if (!pages) {
        progress[id] = { name, wines: [], note: "website didn't open" };
        console.log(`${label}: website didn't open`);
      } else {
        const r = await extractWines(name, pages);
        spent += r.cost;
        progress[id] = { name, wines: r.wines, note: r.note ?? null };
        console.log(`${label}: ${r.wines.length} wines${r.note ? ` (${r.note})` : ""}  ·  US$${spent.toFixed(2)} so far`);
      }
    } catch (err) {
      if (err instanceof Anthropic.AuthenticationError) {
        console.error("Your ANTHROPIC_API_KEY was refused. Check it in .env.local.");
        process.exit(1);
      }
      if (err instanceof Anthropic.RateLimitError) {
        console.log(`${label}: busy, will retry later`);
        todo.push(e);
        await new Promise((r) => setTimeout(r, 20000));
        continue;
      }
      console.log(`${label}: skipped (${err instanceof Anthropic.APIError ? `API ${err.status}` : err.message})`);
    }
    saveProgress();
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));

// --- write the SQL ---------------------------------------------------------
const sqlText = (s) => `'${String(s).replace(/'/g, "''")}'`;
const clean = (s) => String(s).replace(/\s+/g, " ").trim();
const rows = [];
for (const [id, r] of Object.entries(progress)) {
  for (const w of r.wines) {
    const nameOk = clean(w.name);
    if (nameOk.length < 2 || nameOk.length > 80) continue;
    rows.push(`(${sqlText(id)}, ${sqlText(w.colour)}, ${sqlText(nameOk)}, 'import')`);
  }
}
const sql = [
  "-- Wines found on estate websites by scripts/import-estate-wines.mjs",
  "-- Paste into the Supabase SQL editor and Run. Safe to run more than once.",
  "insert into public.wines (estate_id, colour, name, source) values",
  rows.join(",\n"),
  "on conflict (estate_id, colour, lower(btrim(name))) do nothing;",
  "",
  "select source, colour, count(*) as wines from public.wines group by source, colour order by source, colour;",
  "",
].join("\n");
const sqlFile = path.join(outDir, "estate_wines_import.sql");
if (rows.length) fs.writeFileSync(sqlFile, sql);

const withWines = Object.values(progress).filter((r) => r.wines.length).length;
console.log(`\nDone. This run cost about US$${spent.toFixed(2)}.`);
console.log(`${withWines} estates have wines, ${rows.length} wines in total.`);
if (rows.length) console.log(`Next: open ${path.relative(process.cwd(), sqlFile)}, copy it all into the Supabase SQL editor and Run.`);
