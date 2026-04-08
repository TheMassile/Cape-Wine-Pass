import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabaseClient";

export async function GET() {
  // 1) Who is the logged-in user?
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  const user = userData?.user;

  if (userErr || !user) {
    // Not signed in: return empty progress
    return NextResponse.json({ byRegion: {} });
  }

  // 2) Get this user's visits (estate_id list)
  const { data: visits, error: visitsErr } = await supabase
    .from("visits")
    .select("estate_id")
    .eq("user_id", user.id);

  if (visitsErr) {
    return NextResponse.json({ error: visitsErr.message }, { status: 500 });
  }

  const estateIds = (visits ?? []).map((v: any) => v.estate_id);

  if (estateIds.length === 0) {
    return NextResponse.json({ byRegion: {} });
  }

  // 3) Look up regions for those estate IDs
  const { data: estates, error: estatesErr } = await supabase
    .from("estates")
    .select('"Estate ID","Region"')
    .in("Estate ID", estateIds);

  if (estatesErr) {
    return NextResponse.json({ error: estatesErr.message }, { status: 500 });
  }

  // 4) Count visited per region
  const byRegion: Record<string, number> = {};
  for (const row of estates ?? []) {
    const region = (row as any)["Region"];
    if (!region) continue;
    byRegion[region] = (byRegion[region] ?? 0) + 1;
  }

  return NextResponse.json({ byRegion });
}