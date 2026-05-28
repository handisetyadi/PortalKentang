"use client";

import { useCallback, useEffect, useState } from "react";
import type { AppData } from "@/lib/data/types";
import { loadAppData, saveAppData } from "@/lib/offline/db";
import { repairTransactions } from "@/lib/pos/repair-transactions";

export function useAppData() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const raw = await loadAppData();
      const d = repairTransactions(raw);
      if (d !== raw) await saveAppData(d);
      setData(d);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  const persist = useCallback(async (next: AppData) => {
    await saveAppData(next);
    setData(next);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh, persist };
}
