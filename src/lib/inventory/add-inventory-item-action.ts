"use server";

import { requireSession, sessionHasPermission } from "@/lib/auth/session";
import { createInventoryItemRecord } from "@/lib/inventory/create-inventory-item";
import type { InventoryItemFormValues } from "@/lib/inventory/inventory-item-form-schema";
import {
  assertInventoryItemNameAvailable,
  assertProductNameAvailable,
} from "@/lib/repositories/inventory-item-repository";
import { persistNewInventoryItem } from "@/lib/repositories/persist-inventory-item";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseEnvConfigured } from "@/lib/supabase/env";
import type { InventoryItem, Product } from "@/lib/data/types";

export type AddInventoryItemResult =
  | { ok: true; inventoryItem: InventoryItem; product?: Product }
  | { ok: false; message: string };

export async function addInventoryItemAction(
  values: InventoryItemFormValues
): Promise<AddInventoryItemResult> {
  const session = await requireSession();

  if (!sessionHasPermission(session, "inventory.item.manage")) {
    return { ok: false, message: "You do not have permission to manage inventory items." };
  }

  if (isSupabaseEnvConfigured()) {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      return { ok: false, message: "Not signed in to Supabase. Please log in again." };
    }

    try {
      await assertInventoryItemNameAvailable(supabase, session.companyId, values.name);
      if (values.type === "retail_good") {
        await assertProductNameAvailable(supabase, session.companyId, values.name);
      }
    } catch (e) {
      return {
        ok: false,
        message: e instanceof Error ? e.message : "Name validation failed",
      };
    }
  }

  const { inventoryItem, product } = createInventoryItemRecord(values);

  if (isSupabaseEnvConfigured()) {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      return { ok: false, message: "Not signed in to Supabase. Please log in again." };
    }

    try {
      await persistNewInventoryItem(supabase, session.companyId, inventoryItem, product);
    } catch (e) {
      return {
        ok: false,
        message: e instanceof Error ? e.message : "Failed to save item to server",
      };
    }
  }

  return { ok: true, inventoryItem, product };
}
