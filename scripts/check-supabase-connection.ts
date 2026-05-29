/**
 * Supabase connectivity diagnostic — run: npx tsx scripts/check-supabase-connection.ts
 */
import { readFileSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";

function loadEnv(): Record<string, string> {
  const path = join(process.cwd(), ".env.local");
  const raw = readFileSync(path, "utf8");
  const env: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i > 0) env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return env;
}

async function main() {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  console.log("Env:", {
    hasUrl: Boolean(url),
    hasAnonKey: Boolean(anonKey),
    hasServiceKey: Boolean(serviceKey),
    host: url ? new URL(url).host : null,
  });

  if (!url || !anonKey) {
    console.error("FAIL: missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    process.exit(1);
  }

  const healthRes = await fetch(`${url}/auth/v1/health`, { headers: { apikey: anonKey } });
  console.log("Auth health:", healthRes.status, healthRes.ok ? "OK" : "FAIL");

  const supabase = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: companies, error } = await supabase.from("companies").select("slug").limit(1);
  console.log("Anon DB:", error ? `FAIL ${error.message}` : `OK slug=${companies?.[0]?.slug}`);

  if (serviceKey) {
    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error: adminErr } = await admin.from("products").select("id").limit(1);
    console.log("Service role DB:", adminErr ? `FAIL ${adminErr.message}` : "OK");
  }

  console.log("All checks passed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
