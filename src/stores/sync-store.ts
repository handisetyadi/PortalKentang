import { create } from "zustand";
import type { SyncStatus } from "@/types/domain";

interface SyncState {
  status: SyncStatus;
  pendingCount: number;
  lastSyncAt?: string;
  setStatus: (status: SyncStatus) => void;
  setPendingCount: (n: number) => void;
  setLastSync: (at: string) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  status: typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "online",
  pendingCount: 0,
  lastSyncAt: undefined,
  setStatus: (status) => set({ status }),
  setPendingCount: (pendingCount) => set({ pendingCount }),
  setLastSync: (lastSyncAt) => set({ lastSyncAt }),
}));
