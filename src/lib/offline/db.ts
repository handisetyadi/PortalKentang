import Dexie, { type Table } from "dexie";
import type { AppData } from "@/lib/data/types";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { hydrateAppData } from "@/lib/repositories/hydrate-app-data";
import {
  persistAppDataToSupabaseAction,
  persistSaleToSupabaseAction,
} from "@/lib/offline/server-actions";
import type { Transaction } from "@/lib/data/types";
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
  companyId!: Table<{ id: string; companyId: string }, string>;

  constructor() {
    super("PortalKentangDB");
    this.version(2).stores({
      appData: "id",
      syncQueue: "id, status, createdAt",
      catalogVersion: "id",
      companyId: "id",
    });
  }
}

export const db = new PortalKentangDB();

const DATA_KEY = "main";
const COMPANY_KEY = "tenant";

export async function getCachedCompanyId(): Promise<string | null> {
  const row = await db.companyId.get(COMPANY_KEY);
  return row?.companyId ?? null;
}

export async function setCachedCompanyId(companyId: string): Promise<void> {
  await db.companyId.put({ id: COMPANY_KEY, companyId });
}

export async function loadAppData(companyId?: string): Promise<AppData> {
  if (isSupabaseConfigured() && companyId) {
    try {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) {
        const remote = await hydrateAppData(supabase, companyId);
        await saveAppData(remote);
        await setCachedCompanyId(companyId);
        return remote;
      }
    } catch (e) {
      console.warn("Supabase hydrate failed, using cache:", e);
    }
  }

  const existing = await db.appData.get(DATA_KEY);
  if (existing) {
    const { id: _, ...data } = existing;
    return data as AppData;
  }

  if (!isSupabaseConfigured()) {
    const seed = createMockSeed();
    await saveAppData(seed);
    return seed;
  }

  console.warn(
    "No IndexedDB cache and no Supabase session — loading demo seed. Set env vars and log in for live data."
  );
  const seed = createMockSeed();
  await saveAppData(seed);
  return seed;
}

export async function saveAppData(data: AppData): Promise<void> {
  await db.appData.put({ ...data, id: DATA_KEY });
}

export async function persistAppDataRemote(
  data: AppData,
  companyId: string
): Promise<void> {
  await saveAppData(data);
  if (!isSupabaseConfigured()) return;
  const result = await persistAppDataToSupabaseAction(data, companyId);
  if (result.error) {
    console.warn("Remote persist failed:", result.error);
  }
}

export async function persistSaleRemote(
  data: AppData,
  companyId: string,
  transaction: Transaction
): Promise<void> {
  await saveAppData(data);
  if (!isSupabaseConfigured()) return;
  const result = await persistSaleToSupabaseAction(data, companyId, transaction);
  if (result.error) throw new Error(result.error);
}

export async function resetAppData(): Promise<AppData> {
  const seed = createMockSeed();
  await saveAppData(seed);
  return seed;
}
