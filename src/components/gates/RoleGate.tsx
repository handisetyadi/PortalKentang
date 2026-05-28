"use client";

import { useAuth } from "@/components/providers/auth-provider";
import type { AppRole } from "@/types/domain";

interface RoleGateProps {
  roles: AppRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGate({ roles, children, fallback = null }: RoleGateProps) {
  const { hasAnyRole } = useAuth();
  if (!hasAnyRole(roles)) return <>{fallback}</>;
  return <>{children}</>;
}
