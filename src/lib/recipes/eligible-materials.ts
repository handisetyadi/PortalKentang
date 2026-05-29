import type { InventoryItem } from "@/lib/data/types";
import type { InventoryItemType } from "@/types/domain";

const RECIPE_MATERIAL_TYPES: InventoryItemType[] = ["raw_material", "semi_finished_good"];

export function isRecipeMaterialType(type: InventoryItemType): boolean {
  return RECIPE_MATERIAL_TYPES.includes(type);
}

/** Raw materials and semi-finished goods available for recipe lines (stock qty may be zero). */
export function getRecipeEligibleMaterials(items: InventoryItem[]): InventoryItem[] {
  return items.filter((i) => i.isActive && isRecipeMaterialType(i.type));
}

export function isKnownInventoryItem(items: InventoryItem[], inventoryItemId: string): boolean {
  return items.some((i) => i.id === inventoryItemId);
}
