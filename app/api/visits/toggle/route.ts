import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  // 1) Read JSON safely
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be valid JSON" }, { status: 400 });
  }

  // 2) Accept both estateId and estate_id (handy when you refactor)
  const estateId = body?.estateId ?? body?.estate_id;

  if (!estateId || typeof estateId !== "string") {
    return NextResponse.json(
      { error: 'Invalid payload. Expected JSON like: { "estateId": "STB001" }' },
      { status: 400 }
    );
  }

  // 3) Create Supabase client (anon key) — relies on auth cookies/session if you’re using them
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnon);

  // 4) Get the logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  // 5) Toggle: if exists -> delete, else -> insert
  const { data: existing, error: selErr } = await supabase
    .from("visits")
    .select("estate_id")
    .eq("user_id", user.id)
    .eq("estate_id", estateId)
    .maybeSingle();

  if (selErr) {
    return NextResponse.json({ error: selErr.message }, { status: 400 });
  }

  if (existing) {
    const { error: delErr } = await supabase
      .from("visits")
      .delete()
      .eq("user_id", user.id)
      .eq("estate_id", estateId);

    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 400 });
    }

    return NextResponse.json({ visited: false });
  } else {
    const { error: insErr } = await supabase
      .from("visits")
      .insert([{ user_id: user.id, estate_id: estateId }]);

    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 400 });
    }

    return NextResponse.json({ visited: true });
  }
}