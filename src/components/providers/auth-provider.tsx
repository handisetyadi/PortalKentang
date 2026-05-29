"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { AppRole, UserSession } from "@/types/domain";

type AuthContextValue = {
  session: UserSession | null;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: AppRole | string) => boolean;
  hasAnyRole: (roles: (AppRole | string)[]) => boolean;
};

const AuthContext = createContext<AuthContextValue>({
  session: null,
  hasPermission: () => false,
  hasRole: () => false,
  hasAnyRole: () => false,
});

export function AuthProvider({
  session,
  children,
}: {
  session: UserSession | null;
  children: ReactNode;
}) {
  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      hasPermission: (permission) => session?.permissions.includes(permission) ?? false,
      hasRole: (role) => session?.roles.includes(role as AppRole) ?? false,
      hasAnyRole: (roles) =>
        roles.some((r) => session?.roles.includes(r as AppRole) ?? false),
    }),
    [session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
