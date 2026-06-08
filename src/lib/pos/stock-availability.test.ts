import { describe, expect, it } from "vitest";
import {
  validateCartStock,
  getLineInventoryDemand,
  simulateCartStockConsumption,
} from "./stock-availability";
import { getAvailableQty } from "@/lib/inventory/fifo";
import { createMockSeed } from "@/lib/data/mock-seed";
import { IDS } from "@/lib/data/ids";
import type { CartLine } from "@/types/domain";

function productLine(
  data: ReturnType<typeof createMockSeed>,
  sku: string,
  quantity: number
): CartLine {
  const product = data.products.find((p) => p.sku === sku)!;
  return {
    id: "l1",
    productId: product.id,
    productName: product.name,
    modifierIds: [],
    modifierNames: [],
    quantity,
    unitPrice: product.price,
    modifierPriceTotal: 0,
    discountAmount: 0,
    taxRate: product.taxRate,
  };
}

describe("validateCartStock", () => {
  it("passes when recipe ingredients are in stock", () => {
    const data = createMockSeed();
    expect(validateCartStock(data, [productLine(data, "FD-002", 1)], IDS.outlet1).ok).toBe(true);
  });

  it("fails when demand exceeds available potato stock", () => {
    const data = createMockSeed();
    const result = validateCartStock(data, [productLine(data, "FD-002", 1000)], IDS.outlet1);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/Stok/);
    }
  });
});

describe("getLineInventoryDemand", () => {
  it("returns potato demand for kentang goreng", () => {
    const data = createMockSeed();
    const product = data.products.find((p) => p.sku === "FD-002")!;
    const demand = getLineInventoryDemand(
      data,
      { productId: product.id, modifierIds: [], quantity: 2 },
      IDS.outlet1
    );
    expect(demand.size).toBeGreaterThan(0);
  });

  it("returns croissant retail inventory demand via inventory_item_id", () => {
    const data = createMockSeed();
    const product = data.products.find((p) => p.sku === "FD-001")!;
    const demand = getLineInventoryDemand(
      data,
      { productId: product.id, modifierIds: [], quantity: 1 },
      IDS.outlet1
    );
    const croissantInv = data.inventoryItems.find((i) => i.sku === "FG-001")!;
    expect(demand.get(croissantInv.id)).toBe(1);
  });

  it("returns sandwich retail inventory demand via inventory_item_id", () => {
    const data = createMockSeed();
    const product = data.products.find((p) => p.sku === "FD-003")!;
    const demand = getLineInventoryDemand(
      data,
      { productId: product.id, modifierIds: [], quantity: 2 },
      IDS.outlet1
    );
    const sandwichInv = data.inventoryItems.find((i) => i.sku === "FD-003")!;
    expect(demand.get(sandwichInv.id)).toBe(2);
  });
});

describe("validateCartStock with substitute materials", () => {
  it("passes when SF is short but RM can fulfill the recipe line", () => {
    const data = createMockSeed();
    const latte = data.products.find((p) => p.sku === "BEV-002")!;
    const recipe = data.recipes.find((r) => r.productId === latte.id)!;
    const milk = data.inventoryItems.find((i) => i.sku === "RM-002")!;
    const dough = data.inventoryItems.find((i) => i.sku === "SF-001")!;

    data.recipeItems.push({
      id: crypto.randomUUID(),
      recipeId: recipe.id,
      inventoryItemId: milk.id,
      substituteInventoryItemId: dough.id,
      substituteQuantity: 20,
      substituteUnit: "pcs",
      quantity: 200,
      unit: "ml",
      conversionToBaseFactor: 1,
      isOptional: false,
    });

    data.fifoLayers = data.fifoLayers.map((layer) =>
      layer.inventoryItemId === dough.id ? { ...layer, quantityRemaining: 10 } : layer
    );

    expect(validateCartStock(data, [productLine(data, "BEV-002", 1)], IDS.outlet1).ok).toBe(
      true
    );
  });

  it("fails when both substitute and primary stock are empty", () => {
    const data = createMockSeed();
    const latte = data.products.find((p) => p.sku === "BEV-002")!;
    const recipe = data.recipes.find((r) => r.productId === latte.id)!;
    const milk = data.inventoryItems.find((i) => i.sku === "RM-002")!;
    const dough = data.inventoryItems.find((i) => i.sku === "SF-001")!;

    data.recipeItems.push({
      id: crypto.randomUUID(),
      recipeId: recipe.id,
      inventoryItemId: milk.id,
      substituteInventoryItemId: dough.id,
      substituteQuantity: 20,
      substituteUnit: "pcs",
      quantity: 200,
      unit: "ml",
      conversionToBaseFactor: 1,
      isOptional: false,
    });

    data.fifoLayers = data.fifoLayers.map((layer) =>
      layer.inventoryItemId === dough.id || layer.inventoryItemId === milk.id
        ? { ...layer, quantityRemaining: 0 }
        : layer
    );

    expect(validateCartStock(data, [productLine(data, "BEV-002", 1)], IDS.outlet1).ok).toBe(
      false
    );
  });
});

describe("sequential cart simulation (byproduct → substitute)", () => {
  function setupKopKentangLike(data: ReturnType<typeof createMockSeed>) {
    const product = data.products.find((p) => p.sku === "FD-002")!;
    const recipe = data.recipes.find((r) => r.productId === product.id)!;
    recipe.yieldFactor = 1;
    const milk = data.inventoryItems.find((i) => i.sku === "RM-002")!;
    const espresso = data.inventoryItems.find((i) => i.type === "semi_finished_good")!;

    data.recipeItems.push({
      id: crypto.randomUUID(),
      recipeId: recipe.id,
      inventoryItemId: milk.id,
      substituteInventoryItemId: espresso.id,
      substituteQuantity: 20,
      substituteUnit: "ml",
      quantity: 200,
      unit: "ml",
      conversionToBaseFactor: 1,
      isOptional: false,
    });

    data.recipeByproducts.push({
      id: crypto.randomUUID(),
      recipeId: recipe.id,
      semiFinishedInventoryItemId: espresso.id,
      quantity: 10,
      unit: "ml",
      expiryDays: 7,
      costAllocationPercent: 0,
    });

    data.fifoLayers = data.fifoLayers.map((layer) =>
      layer.inventoryItemId === espresso.id ? { ...layer, quantityRemaining: 0 } : layer
    );

    return { product, espresso, milk };
  }

  it("passes 3 units when 2 RM runs produce enough SF for the 3rd (0 SF initial)", () => {
    const data = createMockSeed();
    const { product, espresso } = setupKopKentangLike(data);
    const lines = [1, 2, 3].map((n) => ({
      ...productLine(data, "FD-002", 1),
      id: `line-${n}`,
    }));

    expect(validateCartStock(data, lines, IDS.outlet1).ok).toBe(true);

    const singleLine = [{ ...productLine(data, "FD-002", 3), id: "line-qty-3" }];
    expect(validateCartStock(data, singleLine, IDS.outlet1).ok).toBe(true);

    const sim = simulateCartStockConsumption(data, lines, IDS.outlet1);
    expect(sim.ok).toBe(true);
    if (sim.ok) {
      expect(getAvailableQty(sim.data, espresso.id, IDS.outlet1)).toBe(0);
    }

    const simSingle = simulateCartStockConsumption(data, singleLine, IDS.outlet1);
    expect(simSingle.ok).toBe(true);
    if (simSingle.ok) {
      expect(getAvailableQty(simSingle.data, espresso.id, IDS.outlet1)).toBe(0);
    }
  });

  it("fails 3 units when RM stock cannot support two full RM productions", () => {
    const data = createMockSeed();
    const { product, milk } = setupKopKentangLike(data);
    data.fifoLayers = data.fifoLayers.map((layer) =>
      layer.inventoryItemId === milk.id ? { ...layer, quantityRemaining: 200 } : layer
    );

    const lines = [1, 2, 3].map((n) => ({
      ...productLine(data, "FD-002", 1),
      id: `line-${n}`,
    }));

    expect(validateCartStock(data, lines, IDS.outlet1).ok).toBe(false);
  });

  it("uses existing SF on later line when 10ml espresso is in stock before sale", () => {
    const data = createMockSeed();
    const { product, espresso } = setupKopKentangLike(data);
    data.fifoLayers = data.fifoLayers.map((layer) =>
      layer.inventoryItemId === espresso.id ? { ...layer, quantityRemaining: 10 } : layer
    );

    const lines = [1, 2, 3].map((n) => ({
      ...productLine(data, "FD-002", 1),
      id: `line-${n}`,
    }));

    expect(validateCartStock(data, lines, IDS.outlet1).ok).toBe(true);
    const sim = simulateCartStockConsumption(data, lines, IDS.outlet1);
    expect(sim.ok).toBe(true);
    if (sim.ok) {
      expect(getAvailableQty(sim.data, espresso.id, IDS.outlet1)).toBe(10);
    }
  });
});

describe("validateCartStock for retail products", () => {
  it("fails when croissant stock is exhausted", () => {
    const data = createMockSeed();
    const result = validateCartStock(data, [productLine(data, "FD-001", 20)], IDS.outlet1);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/Stok/);
    }
  });

  it("passes when sandwich quantity is within stock", () => {
    const data = createMockSeed();
    expect(validateCartStock(data, [productLine(data, "FD-003", 10)], IDS.outlet1).ok).toBe(true);
  });
});
