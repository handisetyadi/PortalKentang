"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { db, type SyncQueueItem } from "@/lib/offline/db";
import { processSyncQueue, refreshSyncCounts } from "@/lib/offline/sync-engine";

export function OfflineQueueDrawer() {
  const [items, setItems] = useState<SyncQueueItem[]>([]);
  const [open, setOpen] = useState(false);

  const load = async () => {
    const all = await db.syncQueue.toArray();
    setItems(all.filter((i) => i.status !== "pending" || true));
    await refreshSyncCounts();
  };

  useEffect(() => {
    if (open) void load();
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          Sync queue
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Offline sync queue</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending items.</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="rounded-md border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{item.type}</span>
                  <Badge variant={item.status === "failed" ? "destructive" : "secondary"}>
                    {item.status}
                  </Badge>
                </div>
                {item.error && <p className="mt-1 text-destructive">{item.error}</p>}
                <p className="mt-1 text-xs text-muted-foreground">{item.createdAt}</p>
              </div>
            ))
          )}
          <Button
            className="w-full"
            onClick={async () => {
              await processSyncQueue();
              await load();
            }}
          >
            Retry sync
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
