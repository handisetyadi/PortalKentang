import type { InventoryItem, Product } from "@/lib/data/types";
import type { AddableInventoryType } from "./inventory-sku";
import type { InventoryItemFormValues } from "./inventory-item-form-schema";

const DEFAULT_TAX_RATE = 0.11;

export function createInventoryItemRecord(values: InventoryItemFormValues): {
  inventoryItem: InventoryItem;
  product?: Product;
} {
  const name = values.name.trim();
  const type = values.type as AddableInventoryType;
  const trackStock = values.trackStock;

  const inventoryItem: InventoryItem = {
    id: crypto.randomUUID(),
    type,
    sku: values.sku,
    name,
    baseUnit: values.baseUnit,
    trackStock,
    trackExpiry: trackStock && type !== "supply",
    fifoCosting: trackStock,
    isActive: true,
  };

  if (type !== "retail_good") {
    return { inventoryItem };
  }

  const product: Product = {
    id: crypto.randomUUID(),
    categoryId: values.categoryId!,
    inventoryItemId: inventoryItem.id,
    name,
    sku: values.sku,
    price: values.price!,
    taxRate: DEFAULT_TAX_RATE,
    isRecipeBased: false,
    isActive: true,
  };

  return { inventoryItem, product };
}
