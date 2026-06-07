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

/** Semi-finished goods registered in inventory that can be selected as recipe byproducts. */
export function getRecipeByproductOptions(items: InventoryItem[]): InventoryItem[] {
  return items.filter((i) => i.isActive && i.type === "semi_finished_good");
}

export function getRecipeRawMaterialOptions(items: InventoryItem[]): InventoryItem[] {
  return items.filter((i) => i.isActive && i.type === "raw_material");
}

export function isKnownInventoryItem(items: InventoryItem[], inventoryItemId: string): boolean {
  return items.some((i) => i.id === inventoryItemId);
}
