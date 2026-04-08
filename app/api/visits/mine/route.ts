import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Read the user's session from cookies (Supabase sets these when logged in)
  // NOTE: If auth isn't working yet, this will return 401 — that's okay for now.
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ visited: [] }, { status: 200 });
  }

  const { data, error } = await supabase
    .from("visits")
    .select("estate_id")
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    visited: (data ?? []).map((r) => r.estate_id),
  });
}