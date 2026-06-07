import type { AppData } from "@/lib/data/types";
import type { CartLine } from "@/types/domain";
import { getAvailableQty } from "@/lib/inventory/fifo";
import { resolveProductInventoryItem } from "@/lib/inventory/resolve-product-inventory";
import {
  canFulfillRecipeItemStock,
  resolveRecipeItemConsumptionId,
  resolveRecipeItemLineQuantity,
} from "@/lib/recipes/resolve-consumption-item";

type LineDemand = Pick<CartLine, "productId" | "modifierIds" | "quantity">;

function addDemand(map: Map<string, number>, inventoryItemId: string, qty: number) {
  if (qty <= 0) return;
  map.set(inventoryItemId, (map.get(inventoryItemId) ?? 0) + qty);
}

/** Inventory units required for one cart line (mirrors sale consumption logic). */
export function getLineInventoryDemand(
  data: AppData,
  line: LineDemand,
  outletId: string
): Map<string, number> {
  const demand = new Map<string, number>();
  const product = data.products.find((p) => p.id === line.productId);
  if (!product) return demand;

  if (!product.isRecipeBased) {
    const inv = resolveProductInventoryItem(data, line.productId);
    if (inv) {
      addDemand(demand, inv.id, line.quantity);
    }
    return demand;
  }

  const recipe = data.recipes.find((r) => r.productId === line.productId && r.isActive);
  if (!recipe) return demand;

  const getQty = (id: string) => getAvailableQty(data, id, outletId);
  const getItemType = (id: string) => data.inventoryItems.find((i) => i.id === id)?.type;
  const consumptionContext = { saleQuantity: line.quantity, yieldFactor: recipe.yieldFactor };
  for (const ri of data.recipeItems.filter((x) => x.recipeId === recipe.id)) {
    if (ri.modifierId && !line.modifierIds.includes(ri.modifierId)) continue;
    const inventoryItemId = resolveRecipeItemConsumptionId(
      ri,
      getQty,
      getItemType,
      consumptionContext
    );
    const perUnit = resolveRecipeItemLineQuantity(ri, inventoryItemId) * recipe.yieldFactor;
    addDemand(demand, inventoryItemId, perUnit * line.quantity);
  }

  return demand;
}

export function getCartInventoryDemand(
  data: AppData,
  lines: CartLine[],
  outletId: string
): Map<string, number> {
  const total = new Map<string, number>();
  for (const line of lines) {
    for (const [invId, qty] of getLineInventoryDemand(data, line, outletId)) {
      addDemand(total, invId, qty);
    }
  }
  return total;
}

export type StockValidationResult =
  | { ok: true }
  | { ok: false; message: string; productName?: string };

function validateRecipeSubstituteStock(
  data: AppData,
  lines: CartLine[],
  outletId: string
): StockValidationResult | null {
  const getQty = (id: string) => getAvailableQty(data, id, outletId);
  const getItemType = (id: string) => data.inventoryItems.find((i) => i.id === id)?.type;

  for (const line of lines) {
    const product = data.products.find((p) => p.id === line.productId);
    if (!product?.isRecipeBased) continue;
    const recipe = data.recipes.find((r) => r.productId === line.productId && r.isActive);
    if (!recipe) continue;

    const context = { saleQuantity: line.quantity, yieldFactor: recipe.yieldFactor };
    for (const ri of data.recipeItems.filter((x) => x.recipeId === recipe.id)) {
      if (ri.modifierId && !line.modifierIds.includes(ri.modifierId)) continue;
      if (!ri.substituteInventoryItemId) continue;
      if (canFulfillRecipeItemStock(ri, getQty, context, getItemType)) continue;

      return {
        ok: false,
        message: `Stok bahan tidak cukup untuk ${product.name} (substitute dan bahan utama habis atau tidak mencukupi).`,
        productName: product.name,
      };
    }
  }

  return null;
}

export function validateCartStock(
  data: AppData,
  lines: CartLine[],
  outletId: string,
  productNameForMessage?: string
): StockValidationResult {
  const substituteError = validateRecipeSubstituteStock(data, lines, outletId);
  if (substituteError) return substituteError;

  const demand = getCartInventoryDemand(data, lines, outletId);
  if (demand.size === 0) return { ok: true };

  for (const [invId, needed] of demand) {
    const available = getAvailableQty(data, invId, outletId);
    if (needed > available + 1e-6) {
      const item = data.inventoryItems.find((i) => i.id === invId);
      const name = productNameForMessage ?? item?.name ?? "Produk";
      if (available <= 0) {
        return { ok: false, message: `Stok habis untuk ${name}.`, productName: name };
      }
      return {
        ok: false,
        message: `Stok tidak cukup untuk ${name} (tersedia ${Math.floor(available)}, butuh ${Math.ceil(needed)}).`,
        productName: name,
      };
    }
  }

  return { ok: true };
}
