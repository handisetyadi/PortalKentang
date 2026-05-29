"use client";

import { db, persistAppDataRemote, getCachedCompanyId } from "./db";
import { useSyncStore } from "@/stores/sync-store";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { AppData } from "@/lib/data/types";

export async function refreshSyncCounts() {
  const pending = await db.syncQueue.where("status").equals("pending").count();
  const failed = await db.syncQueue.where("status").equals("failed").count();
  const store = useSyncStore.getState();
  store.setPendingCount(pending + failed);
  if (failed > 0) store.setStatus("failed");
  else if (pending > 0) store.setStatus("syncing");
  else if (!navigator.onLine) store.setStatus("offline");
  else store.setStatus("online");
}

export function initSyncListeners() {
  if (typeof window === "undefined") return () => {};

  const onOnline = () => {
    useSyncStore.getState().setStatus("online");
    void processSyncQueue();
  };
  const onOffline = () => useSyncStore.getState().setStatus("offline");

  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);
  void refreshSyncCounts();

  return () => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
  };
}

export async function processSyncQueue(): Promise<void> {
  const store = useSyncStore.getState();
  if (!navigator.onLine) {
    store.setStatus("offline");
    return;
  }

  const pending = await db.syncQueue.where("status").equals("pending").toArray();
  if (pending.length === 0) {
    store.setStatus("online");
    store.setPendingCount(0);
    return;
  }

  if (!isSupabaseConfigured()) {
    for (const item of pending) {
      await db.syncQueue.delete(item.id);
    }
    await refreshSyncCounts();
    return;
  }

  store.setStatus("syncing");
  const companyId = await getCachedCompanyId();
  const cached = await db.appData.get("main");
  if (companyId && cached) {
    const { id: _, ...appData } = cached;
    try {
      await persistAppDataRemote(appData as AppData, companyId);
      for (const item of pending) {
        await db.syncQueue.delete(item.id);
      }
      store.setLastSync(new Date().toISOString());
      store.setStatus("online");
    } catch {
      store.setStatus("failed");
    }
  }

  await refreshSyncCounts();
}

export async function enqueueSync(
  type: "transaction" | "stock" | "print",
  payload: unknown
): Promise<void> {
  const now = new Date().toISOString();
  await db.syncQueue.add({
    id: crypto.randomUUID(),
    type,
    payload,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  });
  await refreshSyncCounts();
  if (navigator.onLine && isSupabaseConfigured()) {
    const companyId = await getCachedCompanyId();
    const cached = await db.appData.get("main");
    if (companyId && cached) {
      const { id: _, ...appData } = cached;
      void persistAppDataRemote(appData as AppData, companyId).then(() => processSyncQueue());
    }
  }
}
