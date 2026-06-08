import { describe, expect, it } from "vitest";
import { createMockSeed } from "@/lib/data/mock-seed";
import { consumeStockForSale, getAvailableQty } from "./fifo";
import { IDS } from "@/lib/data/ids";

function setupRecipeWithSubstituteAndByproduct(
  data: ReturnType<typeof createMockSeed>,
  options: {
    byproductQty: number;
    substituteQty?: number;
    primaryQty?: number;
    sfRemaining?: number;
    rmRemaining?: number;
  }
) {
  const product = data.products.find((p) => p.sku === "FD-002")!;
  const recipe = data.recipes.find((r) => r.productId === product.id)!;
  recipe.yieldFactor = 1;
  const milk = data.inventoryItems.find((i) => i.sku === "RM-002")!;
  const dough = data.inventoryItems.find((i) => i.sku === "SF-001")!;

  data.recipeItems.push({
    id: crypto.randomUUID(),
    recipeId: recipe.id,
    inventoryItemId: milk.id,
    substituteInventoryItemId: dough.id,
    substituteQuantity: options.substituteQty ?? 1,
    substituteUnit: "pcs",
    quantity: options.primaryQty ?? 200,
    unit: "ml",
    conversionToBaseFactor: 1,
    isOptional: false,
  });

  data.recipeByproducts.push({
    id: crypto.randomUUID(),
    recipeId: recipe.id,
    semiFinishedInventoryItemId: dough.id,
    quantity: options.byproductQty,
    unit: "ml",
    expiryDays: 7,
    costAllocationPercent: 0,
  });

  if (options.sfRemaining != null || options.rmRemaining != null) {
    data.fifoLayers = data.fifoLayers.map((layer) => {
      if (layer.inventoryItemId === dough.id && options.sfRemaining != null) {
        return { ...layer, quantityRemaining: options.sfRemaining };
      }
      if (layer.inventoryItemId === milk.id && options.rmRemaining != null) {
        return { ...layer, quantityRemaining: options.rmRemaining };
      }
      return layer;
    });
  }

  return { product, dough, milk };
}

describe("produceByproductsForSale via consumeStockForSale", () => {
  it("increases byproduct stock when substitute item differs from byproduct output", () => {
    const data = createMockSeed();
    const product = data.products.find((p) => p.sku === "BEV-002")!;
    const recipe = data.recipes.find((r) => r.productId === product.id)!;
    const espressoItem = data.inventoryItems.find((i) => i.type === "semi_finished_good")!;

    data.recipeByproducts.push({
      id: crypto.randomUUID(),
      recipeId: recipe.id,
      semiFinishedInventoryItemId: espressoItem.id,
      quantity: 10,
      unit: "ml",
      expiryDays: 7,
      costAllocationPercent: 0,
    });

    const before = getAvailableQty(data, espressoItem.id, IDS.outlet1);
    const txnItemId = crypto.randomUUID();
    const { data: after } = consumeStockForSale(data, {
      outletId: IDS.outlet1,
      warehouseId: IDS.warehouse1,
      productId: product.id,
      modifierIds: [],
      quantity: 1,
      transactionItemId: txnItemId,
    });
    const afterQty = getAvailableQty(after, espressoItem.id, IDS.outlet1);

    expect(afterQty - before).toBe(10);
    expect(
      after.stockLedger.some(
        (e) =>
          e.movementType === "byproduct_creation" &&
          e.inventoryItemId === espressoItem.id &&
          e.quantityDelta === 10
      )
    ).toBe(true);
  });

  it("skips byproduct when the same SF was consumed as substitute", () => {
    const data = createMockSeed();
    const { product, dough } = setupRecipeWithSubstituteAndByproduct(data, {
      byproductQty: 10,
      substituteQty: 1,
      sfRemaining: 50,
      rmRemaining: 10000,
    });

    const before = getAvailableQty(data, dough.id, IDS.outlet1);
    const txnItemId = crypto.randomUUID();
    const { data: after } = consumeStockForSale(data, {
      outletId: IDS.outlet1,
      warehouseId: IDS.warehouse1,
      productId: product.id,
      modifierIds: [],
      quantity: 1,
      transactionItemId: txnItemId,
    });
    const afterQty = getAvailableQty(after, dough.id, IDS.outlet1);

    expect(afterQty - before).toBe(-1);
    expect(
      after.stockLedger.some(
        (e) => e.movementType === "byproduct_creation" && e.inventoryItemId === dough.id
      )
    ).toBe(false);
  });

  it("produces 20ml byproduct for qty 3 when 2 RM units feed SF for the 3rd", () => {
    const data = createMockSeed();
    const { product, dough, milk } = setupRecipeWithSubstituteAndByproduct(data, {
      byproductQty: 10,
      substituteQty: 20,
      primaryQty: 200,
      sfRemaining: 0,
      rmRemaining: 10000,
    });

    const doughBefore = getAvailableQty(data, dough.id, IDS.outlet1);
    const milkBefore = getAvailableQty(data, milk.id, IDS.outlet1);
    const txnItemId = crypto.randomUUID();
    const { data: after } = consumeStockForSale(data, {
      outletId: IDS.outlet1,
      warehouseId: IDS.warehouse1,
      productId: product.id,
      modifierIds: [],
      quantity: 3,
      transactionItemId: txnItemId,
    });

    expect(getAvailableQty(after, dough.id, IDS.outlet1) - doughBefore).toBe(0);
    expect(getAvailableQty(after, milk.id, IDS.outlet1) - milkBefore).toBe(-400);
    const byproductCreated = after.stockLedger
      .filter(
        (e) =>
          e.movementType === "byproduct_creation" &&
          e.inventoryItemId === dough.id &&
          e.sourceId === txnItemId
      )
      .reduce((sum, e) => sum + e.quantityDelta, 0);
    expect(byproductCreated).toBe(20);
  });

  it("still produces byproduct when RM fallback is used instead of SF substitute", () => {
    const data = createMockSeed();
    const { product, dough, milk } = setupRecipeWithSubstituteAndByproduct(data, {
      byproductQty: 10,
      substituteQty: 20,
      primaryQty: 200,
      sfRemaining: 0,
      rmRemaining: 10000,
    });

    const doughBefore = getAvailableQty(data, dough.id, IDS.outlet1);
    const milkBefore = getAvailableQty(data, milk.id, IDS.outlet1);
    const txnItemId = crypto.randomUUID();
    const { data: after } = consumeStockForSale(data, {
      outletId: IDS.outlet1,
      warehouseId: IDS.warehouse1,
      productId: product.id,
      modifierIds: [],
      quantity: 1,
      transactionItemId: txnItemId,
    });

    expect(getAvailableQty(after, dough.id, IDS.outlet1) - doughBefore).toBe(10);
    expect(getAvailableQty(after, milk.id, IDS.outlet1) - milkBefore).toBe(-200);
    expect(
      after.stockLedger.some(
        (e) =>
          e.movementType === "byproduct_creation" &&
          e.inventoryItemId === dough.id &&
          e.quantityDelta === 10
      )
    ).toBe(true);
  });
});
