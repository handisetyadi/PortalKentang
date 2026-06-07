import type { RecipeItem } from "@/lib/data/types";
import type { InventoryItemType } from "@/types/domain";
import {
  getSubstitutePair,
  resolveRecipeItemConsumptionId,
  type RecipeConsumptionContext,
} from "./resolve-consumption-item";

/** SF substitute inventory IDs actually consumed for this sale (blocks matching byproduct output). */
export function getSubstituteSemiFinishedConsumedIds(
  recipeItems: RecipeItem[],
  recipeId: string,
  modifierIds: string[],
  getAvailableQty: (inventoryItemId: string) => number,
  getItemType: (inventoryItemId: string) => InventoryItemType | undefined,
  context: RecipeConsumptionContext
): Set<string> {
  const consumed = new Set<string>();

  for (const ri of recipeItems.filter((x) => x.recipeId === recipeId)) {
    if (ri.modifierId && !modifierIds.includes(ri.modifierId)) continue;
    if (!ri.substituteInventoryItemId) continue;

    const pair = getSubstitutePair(ri, getItemType);
    if (!pair) continue;

    const resolvedId = resolveRecipeItemConsumptionId(
      ri,
      getAvailableQty,
      getItemType,
      context
    );
    if (resolvedId === pair.sfId) {
      consumed.add(pair.sfId);
    }
  }

  return consumed;
}
