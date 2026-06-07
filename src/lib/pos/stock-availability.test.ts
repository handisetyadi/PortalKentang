import { describe, expect, it } from "vitest";
import { validateCartStock, getLineInventoryDemand } from "./stock-availability";
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
