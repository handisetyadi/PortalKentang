import type { SupabaseClient } from "@supabase/supabase-js";
import type { InventoryItem, Product } from "@/lib/data/types";
import { throwIfError } from "./base";

/** Insert or update a single inventory item and optional linked POS product (inventory first). */
export async function persistNewInventoryItem(
  supabase: SupabaseClient,
  companyId: string,
  inventoryItem: InventoryItem,
  product?: Product
): Promise<void> {
  const { error: invErr } = await supabase.from("inventory_items").upsert({
    id: inventoryItem.id,
    company_id: companyId,
    category_id: inventoryItem.categoryId ?? null,
    type: inventoryItem.type,
    sku: inventoryItem.sku,
    barcode: inventoryItem.barcode ?? null,
    name: inventoryItem.name,
    base_unit: inventoryItem.baseUnit,
    track_stock: inventoryItem.trackStock,
    track_expiry: inventoryItem.trackExpiry,
    fifo_costing: inventoryItem.fifoCosting,
    reorder_point: inventoryItem.reorderPoint ?? null,
    is_active: inventoryItem.isActive,
  });
  throwIfError(invErr);

  if (!product) return;

  const { error: prodErr } = await supabase.from("products").upsert({
    id: product.id,
    company_id: companyId,
    category_id: product.categoryId || null,
    inventory_item_id: product.inventoryItemId ?? null,
    name: product.name,
    sku: product.sku,
    barcode: product.barcode ?? null,
    description: product.description ?? null,
    price: product.price,
    tax_rate: product.taxRate,
    is_recipe_based: product.isRecipeBased,
    is_active: product.isActive,
  });
  throwIfError(prodErr);
}
