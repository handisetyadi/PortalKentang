"use client";

import { LogOut } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/auth/actions";
import { SyncStatusBadge } from "@/components/shared/sync-status-badge";
import { OfflineQueueDrawer } from "@/components/shared/offline-queue-drawer";

export function TopBar({
  title,
  actions,
}: {
  title: string;
  actions?: React.ReactNode;
}) {
  const { session } = useAuth();

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      <div className="flex min-w-0 items-center gap-3">
        <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
        {actions}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <SyncStatusBadge className="hidden sm:flex" />
        <OfflineQueueDrawer />
        <span className="hidden text-sm text-muted-foreground md:inline">{session?.fullName}</span>
        <form action={logoutAction}>
          <Button type="submit" variant="ghost" size="sm">
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}
