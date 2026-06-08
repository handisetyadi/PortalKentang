"use client";

import { useCallback, useEffect, useState } from "react";
import type { AppData } from "@/lib/data/types";
import {
  loadAppData,
  persistAppDataRemote,
  persistSaleRemote,
  saveAppData,
} from "@/lib/offline/db";
import type { Transaction } from "@/lib/data/types";
import { repairTransactions } from "@/lib/pos/repair-transactions";
import { useAuth } from "@/components/providers/auth-provider";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export type PersistAppDataFn = (next: AppData) => Promise<{ remoteError?: string }>;

export function useAppData() {
  const { session } = useAuth();
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const raw = await loadAppData(session?.companyId);
      const d = repairTransactions(raw);
      if (d !== raw) await saveAppData(d);
      setData(d);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [session?.companyId]);

  const saveLocal = useCallback(async (next: AppData) => {
    await saveAppData(next);
    setData(next);
  }, []);

  const persist = useCallback<PersistAppDataFn>(
    async (next) => {
      await saveAppData(next);
      setData(next);
      let remoteError: string | undefined;
      if (session?.companyId && isSupabaseConfigured()) {
        try {
          const remoteResult = await persistAppDataRemote(next, session.companyId);
          remoteError = remoteResult.error;
        } catch (e) {
          remoteError = e instanceof Error ? e.message : "Remote persist failed";
          console.warn("Remote persist failed:", e);
        }
      }
      return { remoteError };
    },
    [session?.companyId]
  );

  useEffect(() => {
    if (session) {
      void refresh();
    } else if (!isSupabaseConfigured()) {
      void refresh();
    } else {
      setLoading(false);
    }
  }, [refresh, session]);

  const persistSale = useCallback(
    async (next: AppData, transaction: Transaction) => {
      await saveAppData(next);
      setData(next);
      if (
        session?.companyId &&
        isSupabaseConfigured() &&
        typeof navigator !== "undefined" &&
        navigator.onLine
      ) {
        await persistSaleRemote(next, session.companyId, transaction);
      }
    },
    [session?.companyId]
  );

  return { data, loading, error, refresh, saveLocal, persist, persistSale };
}
