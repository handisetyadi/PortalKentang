"use client";

import { Wifi, WifiOff, RefreshCw, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSyncStore } from "@/stores/sync-store";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { cn } from "@/lib/utils";

const labels = {
  online: "Online",
  offline: "Offline",
  syncing: "Syncing",
  conflict: "Conflict",
  failed: "Sync failed",
} as const;

export function SyncStatusBadge({ className }: { className?: string }) {
  const mounted = useHasMounted();
  const { status, pendingCount } = useSyncStore();

  if (!mounted) {
    return (
      <Badge variant="success" className={cn("gap-1", className)}>
        <Wifi className="h-3 w-3" />
        Online
      </Badge>
    );
  }

  const Icon =
    status === "offline"
      ? WifiOff
      : status === "syncing"
        ? RefreshCw
        : status === "failed" || status === "conflict"
          ? AlertTriangle
          : Wifi;

  return (
    <Badge
      variant={
        status === "online"
          ? "success"
          : status === "offline"
            ? "secondary"
            : status === "syncing"
              ? "default"
              : "warning"
      }
      className={cn("gap-1", className)}
    >
      <Icon className={cn("h-3 w-3", status === "syncing" && "animate-spin")} />
      {labels[status]}
      {pendingCount > 0 && ` (${pendingCount})`}
    </Badge>
  );
}
