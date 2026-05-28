import { redirect } from "next/navigation";
import { AuthProvider } from "@/components/providers/auth-provider";
import { getSession } from "@/lib/auth/session";
import { AccentApplier } from "@/components/shell/accent-applier";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <AuthProvider session={session}>
      <AccentApplier color={session.accentColor} />
      {children}
    </AuthProvider>
  );
}
