import { redirect } from "next/navigation";
import { SupabaseSessionBridge } from "@/components/auth/supabase-session-bridge";
import { AuthProvider } from "@/components/providers/auth-provider";
import { getSession } from "@/lib/auth/session";
import { AccentApplier } from "@/components/shell/accent-applier";
import { isSupabaseEnvConfigured } from "@/lib/supabase/env";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const supabaseReady = isSupabaseEnvConfigured();

  return (
    <AuthProvider session={session}>
      <SupabaseSessionBridge />
      <AccentApplier color={session.accentColor} />
      {!supabaseReady && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
          Supabase environment variables are missing on this deployment. The app is using demo
          data. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your host
          settings, then redeploy.
        </div>
      )}
      {children}
    </AuthProvider>
  );
}
