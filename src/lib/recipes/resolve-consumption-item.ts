import type { InventoryItemType } from "@/types/domain";

export type RecipeConsumptionContext = {
  saleQuantity: number;
  yieldFactor: number;
};

type RecipeItemLike = {
  inventoryItemId: string;
  substituteInventoryItemId?: string;
  quantity: number;
  substituteQuantity?: number;
};

export function getSubstitutePair(
  item: Pick<RecipeItemLike, "inventoryItemId" | "substituteInventoryItemId">,
  getItemType?: (inventoryItemId: string) => InventoryItemType | undefined
): { sfId: string; rmId: string } | null {
  if (!item.substituteInventoryItemId) return null;

  const primaryId = item.inventoryItemId;
  const substituteId = item.substituteInventoryItemId;
  const primaryType = getItemType?.(primaryId);
  const substituteType = getItemType?.(substituteId);

  if (primaryType === "raw_material" && substituteType === "raw_material") {
    return null;
  }

  if (primaryType === "semi_finished_good") {
    return { sfId: primaryId, rmId: substituteId };
  }
  if (substituteType === "semi_finished_good") {
    return { sfId: substituteId, rmId: primaryId };
  }

  return { sfId: substituteId, rmId: primaryId };
}

function getSubstituteNeeds(
  item: RecipeItemLike,
  context: RecipeConsumptionContext
): { sfNeeded: number; rmNeeded: number } {
  const multiplier = context.saleQuantity * context.yieldFactor;
  return {
    sfNeeded: (item.substituteQuantity ?? item.quantity) * multiplier,
    rmNeeded: item.quantity * multiplier,
  };
}

/** True when at least one substitute option has stock; both empty blocks the sale. */
export function canFulfillRecipeItemStock(
  item: RecipeItemLike,
  getAvailableQty: (inventoryItemId: string) => number,
  context: RecipeConsumptionContext,
  getItemType?: (inventoryItemId: string) => InventoryItemType | undefined
): boolean {
  if (!item.substituteInventoryItemId) {
    const needed = item.quantity * context.saleQuantity * context.yieldFactor;
    return getAvailableQty(item.inventoryItemId) >= needed;
  }

  const pair = getSubstitutePair(item, getItemType);
  if (!pair) {
    const needed = item.quantity * context.saleQuantity * context.yieldFactor;
    return getAvailableQty(item.inventoryItemId) >= needed;
  }

  const { sfNeeded, rmNeeded } = getSubstituteNeeds(item, context);
  const sfAvail = getAvailableQty(pair.sfId);
  const rmAvail = getAvailableQty(pair.rmId);

  if (sfAvail <= 0 && rmAvail <= 0) return false;
  if (sfAvail >= sfNeeded) return true;
  if (rmAvail >= rmNeeded) return true;
  return false;
}

/**
 * When a recipe line offers both a byproduct (semi-finished) and a raw material,
 * consume the byproduct first if stock is available; otherwise fall back to raw material.
 */
export function resolveConsumptionInventoryItem(
  line: {
    semiFinishedInventoryItemId?: string;
    rawMaterialInventoryItemId?: string;
  },
  getAvailableQty: (inventoryItemId: string) => number
): string | null {
  const byproductId = line.semiFinishedInventoryItemId;
  const rawId = line.rawMaterialInventoryItemId;

  if (byproductId && rawId) {
    return getAvailableQty(byproductId) > 0 ? byproductId : rawId;
  }

  return byproductId ?? rawId ?? null;
}

export function hasConsumptionChoice(line: {
  semiFinishedInventoryItemId?: string;
  rawMaterialInventoryItemId?: string;
}): boolean {
  return Boolean(line.semiFinishedInventoryItemId && line.rawMaterialInventoryItemId);
}

/** Resolves which inventory item to consume for a recipe material line. */
export function resolveRecipeItemConsumptionId(
  item: RecipeItemLike,
  getAvailableQty: (inventoryItemId: string) => number,
  getItemType?: (inventoryItemId: string) => InventoryItemType | undefined,
  context?: RecipeConsumptionContext
): string {
  if (!item.substituteInventoryItemId) {
    return item.inventoryItemId;
  }

  const primaryId = item.inventoryItemId;
  const substituteId = item.substituteInventoryItemId;
  const primaryType = getItemType?.(primaryId);
  const substituteType = getItemType?.(substituteId);

  if (primaryType === "raw_material" && substituteType === "raw_material") {
    return primaryId;
  }

  const pair = getSubstitutePair(item, getItemType);
  if (pair && context) {
    const { sfNeeded, rmNeeded } = getSubstituteNeeds(item, context);
    const sfAvail = getAvailableQty(pair.sfId);
    const rmAvail = getAvailableQty(pair.rmId);

    if (sfAvail >= sfNeeded) return pair.sfId;
    if (rmAvail >= rmNeeded) return pair.rmId;
    if (rmAvail > 0) return pair.rmId;
    if (sfAvail > 0) return pair.sfId;
    return pair.rmId;
  }

  if (pair) {
    const sfAvail = getAvailableQty(pair.sfId);
    return sfAvail > 0 ? pair.sfId : pair.rmId;
  }

  return (
    resolveConsumptionInventoryItem(
      {
        semiFinishedInventoryItemId: substituteId,
        rawMaterialInventoryItemId: primaryId,
      },
      getAvailableQty
    ) ?? primaryId
  );
}

export function resolveRecipeItemLineQuantity(
  item: {
    inventoryItemId: string;
    substituteInventoryItemId?: string;
    quantity: number;
    substituteQuantity?: number;
  },
  resolvedInventoryItemId: string
): number {
  if (
    item.substituteInventoryItemId &&
    resolvedInventoryItemId === item.substituteInventoryItemId &&
    item.substituteQuantity != null
  ) {
    return item.substituteQuantity;
  }
  return item.quantity;
}
