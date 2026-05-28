"use client";

import { createContext, useContext, useMemo } from "react";
import type { AppRole, UserSession } from "@/types/domain";
import { isDemoSuperuserSession } from "@/lib/auth/demo-superuser";

type AuthContextValue = {
  session: UserSession | null;
  isDemoSuperuser: boolean;
  hasPermission: (key: string) => boolean;
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  session,
  children,
}: {
  session: UserSession | null;
  children: React.ReactNode;
}) {
  const value = useMemo<AuthContextValue>(() => {
    const isDemo = isDemoSuperuserSession(session);

    return {
      session,
      isDemoSuperuser: isDemo,
      hasPermission: (key: string) => {
        if (!session) return false;
        if (isDemo) return true;
        return session.permissions.includes(key);
      },
      hasRole: (role: AppRole) => {
        if (!session) return false;
        if (isDemo) return true;
        return session.roles.includes(role);
      },
      hasAnyRole: (roles: AppRole[]) => {
        if (!session) return false;
        if (isDemo) return true;
        return roles.some((r) => session.roles.includes(r));
      },
    };
  }, [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
