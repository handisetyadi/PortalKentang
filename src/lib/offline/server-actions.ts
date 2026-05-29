"use server";

import { requireSession } from "@/lib/auth/session";
import { persistAppData } from "@/lib/repositories/persist-app-data";
import { persistSale } from "@/lib/repositories/persist-sale";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseEnvConfigured } from "@/lib/supabase/env";
import type { AppData, Transaction } from "@/lib/data/types";

export type OfflinePersistResult = { error?: string };

async function getAuthenticatedSupabase() {
  const supabase = await createClient();
  const { data: auth, error } = await supabase.auth.getUser();
  if (error || !auth.user) {
    return { supabase: null, error: "Not signed in to Supabase. Please log out and sign in again." };
  }
  return { supabase, error: undefined };
}

/** Refresh Supabase auth cookies from the server (middleware / login session). */
export async function refreshSupabaseSessionAction(): Promise<{ ok: boolean }> {
  if (!isSupabaseEnvConfigured()) return { ok: false };
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  return { ok: Boolean(auth.user) };
}

export async function persistSaleToSupabaseAction(
  data: AppData,
  companyId: string,
  transaction: Transaction
): Promise<OfflinePersistResult> {
  if (!isSupabaseEnvConfigured()) return {};

  const session = await requireSession();
  if (session.companyId !== companyId) {
    return { error: "Company mismatch." };
  }

  const { supabase, error } = await getAuthenticatedSupabase();
  if (!supabase) return { error };

  try {
    await persistSale(supabase, companyId, data, transaction);
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to save sale" };
  }
}

export async function persistAppDataToSupabaseAction(
  data: AppData,
  companyId: string
): Promise<OfflinePersistResult> {
  if (!isSupabaseEnvConfigured()) return {};

  const session = await requireSession();
  if (session.companyId !== companyId) {
    return { error: "Company mismatch." };
  }

  const { supabase, error } = await getAuthenticatedSupabase();
  if (!supabase) return { error };

  try {
    await persistAppData(supabase, companyId, data);
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to sync data" };
  }
}
