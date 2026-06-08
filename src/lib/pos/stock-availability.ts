import type { AppData } from "@/lib/data/types";
import type { CartLine } from "@/types/domain";
import { consumeStockForSale, getAvailableQty } from "@/lib/inventory/fifo";
import { resolveProductInventoryItem } from "@/lib/inventory/resolve-product-inventory";
import {
  resolveRecipeItemConsumptionId,
  resolveRecipeItemLineQuantity,
} from "@/lib/recipes/resolve-consumption-item";
import { IDS } from "@/lib/data/ids";

type LineDemand = Pick<CartLine, "productId" | "modifierIds" | "quantity">;

function addDemand(map: Map<string, number>, inventoryItemId: string, qty: number) {
  if (qty <= 0) return;
  map.set(inventoryItemId, (map.get(inventoryItemId) ?? 0) + qty);
}

/** Clone fifo layers for in-memory simulation without mutating live app data. */
export function cloneDataForStockSimulation(data: AppData): AppData {
  return {
    ...data,
    fifoLayers: data.fifoLayers.map((l) => ({ ...l })),
    stockLedger: [],
  };
}

/**
 * Simulates cart consumption line-by-line (same order as completeSale).
 * Credits byproducts from earlier lines before resolving substitutes on later lines.
 */
export function simulateCartStockConsumption(
  data: AppData,
  lines: CartLine[],
  outletId: string,
  warehouseId: string = IDS.warehouse1
): { ok: true; data: AppData } | { ok: false; message: string; productName?: string } {
  let sim = cloneDataForStockSimulation(data);

  for (const line of lines) {
    const product = data.products.find((p) => p.id === line.productId);
    const result = consumeStockForSale(sim, {
      outletId,
      warehouseId,
      productId: line.productId,
      variantId: line.variantId,
      modifierIds: line.modifierIds,
      quantity: line.quantity,
      transactionItemId: `sim-${line.id}`,
    });

    if (result.shortfall) {
      const item = data.inventoryItems.find((i) => i.id === result.shortfall!.inventoryItemId);
      const name = product?.name ?? item?.name ?? "Produk";
      const available = getAvailableQty(data, result.shortfall.inventoryItemId, outletId);
      if (available <= 0) {
        return {
          ok: false,
          message: `Stok habis untuk ${name} (${item?.name ?? "bahan"}).`,
          productName: name,
        };
      }
      return {
        ok: false,
        message: `Stok tidak cukup untuk ${name} (kurang ${Math.ceil(result.shortfall.amount)} ${item?.baseUnit ?? "unit"} ${item?.name ?? "bahan"}).`,
        productName: name,
      };
    }

    sim = result.data;
  }

  return { ok: true, data: sim };
}

/** Inventory units required for one cart line (static snapshot — no byproduct credits). */
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

export function validateCartStock(
  data: AppData,
  lines: CartLine[],
  outletId: string,
  productNameForMessage?: string
): StockValidationResult {
  if (lines.length === 0) return { ok: true };

  const simulation = simulateCartStockConsumption(data, lines, outletId);
  if (!simulation.ok) {
    if (productNameForMessage) {
      return { ...simulation, productName: productNameForMessage };
    }
    return simulation;
  }

  return { ok: true };
}
