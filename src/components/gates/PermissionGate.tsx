"use client";

import { useAuth } from "@/components/providers/auth-provider";
import type { PermissionKey } from "@/types/domain";

interface PermissionGateProps {
  permission: PermissionKey | string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const { hasPermission } = useAuth();
  if (!hasPermission(permission)) return <>{fallback}</>;
  return <>{children}</>;
}
