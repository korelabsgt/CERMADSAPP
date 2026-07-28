import { NextRequest, NextResponse } from "next/server";

async function checkSupabaseHealth(): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) return false;

  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/health`, {
      headers: { apikey: anonKey },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const checkDb = request.nextUrl.searchParams.get("db") === "1";

  if (!checkDb) {
    return NextResponse.json({ ok: true });
  }

  const dbOk = await checkSupabaseHealth();
  if (!dbOk) {
    return NextResponse.json({ ok: false, db: false }, { status: 503 });
  }

  return NextResponse.json({ ok: true, db: true });
}
