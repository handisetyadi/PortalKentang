import type { AppData, InventoryItem, Product } from "@/lib/data/types";

function isValidRetailInventoryItem(item: InventoryItem | undefined): item is InventoryItem {
  return Boolean(item?.isActive && item.type === "retail_good" && item.trackStock);
}

/** Inventory item consumed for a non-recipe POS product. */
export function resolveProductInventoryItem(
  data: AppData,
  productId: string
): InventoryItem | null {
  const product = data.products.find((p) => p.id === productId);
  if (!product || product.isRecipeBased) return null;

  if (product.inventoryItemId) {
    const linked = data.inventoryItems.find((i) => i.id === product.inventoryItemId);
    if (isValidRetailInventoryItem(linked)) return linked;
  }

  const bySku = data.inventoryItems.find(
    (i) => i.sku === product.sku && isValidRetailInventoryItem(i)
  );
  return bySku ?? null;
}

export function assertNonRecipeProductsHaveRetailInventory(data: AppData): void {
  const missing: Product[] = [];

  for (const product of data.products) {
    if (!product.isActive || product.isRecipeBased) continue;
    if (!resolveProductInventoryItem(data, product.id)) {
      missing.push(product);
    }
  }

  if (missing.length > 0) {
    const names = missing.map((p) => p.name).join(", ");
    throw new Error(`Non-recipe products missing retail_good inventory: ${names}`);
  }
}
