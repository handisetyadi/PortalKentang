import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isSupabaseEnvConfigured } from "@/lib/supabase/env";

export async function GET() {
  if (!isSupabaseEnvConfigured()) {
    return NextResponse.json({
      ok: false,
      supabase: { configured: false, connected: false, reason: "missing_env" },
    });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  try {
    const supabase = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error } = await supabase.from("companies").select("id").limit(1);
    const connected = !error;

    return NextResponse.json({
      ok: connected,
      supabase: {
        configured: true,
        connected,
        host: new URL(url).host,
        ...(error ? { reason: error.message } : {}),
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({
      ok: false,
      supabase: { configured: true, connected: false, reason: message },
    });
  }
}
