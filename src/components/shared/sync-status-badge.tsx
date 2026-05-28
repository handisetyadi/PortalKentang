"use client";

import { Wifi, WifiOff, RefreshCw, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSyncStore } from "@/stores/sync-store";
import { cn } from "@/lib/utils";

const labels = {
  online: "Online",
  offline: "Offline",
  syncing: "Syncing",
  conflict: "Conflict",
  failed: "Sync failed",
} as const;

export function SyncStatusBadge({ className }: { className?: string }) {
  const { status, pendingCount } = useSyncStore();

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
