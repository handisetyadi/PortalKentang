import Dexie, { type Table } from "dexie";
import type { AppData } from "@/lib/data/types";
import { createMockSeed } from "@/lib/data/mock-seed";

export type SyncQueueItem = {
  id: string;
  type: "transaction" | "stock" | "print";
  payload: unknown;
  status: "pending" | "syncing" | "failed" | "conflict";
  error?: string;
  createdAt: string;
  updatedAt: string;
};

class PortalKentangDB extends Dexie {
  appData!: Table<AppData & { id: string }, string>;
  syncQueue!: Table<SyncQueueItem, string>;
  catalogVersion!: Table<{ id: string; version: string; cachedAt: string }, string>;

  constructor() {
    super("PortalKentangDB");
    this.version(1).stores({
      appData: "id",
      syncQueue: "id, status, createdAt",
      catalogVersion: "id",
    });
  }
}

export const db = new PortalKentangDB();

const DATA_KEY = "main";

export async function loadAppData(): Promise<AppData> {
  const existing = await db.appData.get(DATA_KEY);
  if (existing) {
    const { id: _, ...data } = existing;
    return data as AppData;
  }
  const seed = createMockSeed();
  await saveAppData(seed);
  return seed;
}

export async function saveAppData(data: AppData): Promise<void> {
  await db.appData.put({ ...data, id: DATA_KEY });
}

export async function resetAppData(): Promise<AppData> {
  const seed = createMockSeed();
  await saveAppData(seed);
  return seed;
}
