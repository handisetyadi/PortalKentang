import { describe, expect, it } from "vitest";
import { createMockSeed } from "@/lib/data/mock-seed";
import {
  assertNonRecipeProductsHaveRetailInventory,
  resolveProductInventoryItem,
} from "./resolve-product-inventory";

describe("resolveProductInventoryItem", () => {
  const data = createMockSeed();

  it("resolves Croissant via inventory_item_id", () => {
    const product = data.products.find((p) => p.sku === "FD-001")!;
    const inv = resolveProductInventoryItem(data, product.id);
    expect(inv?.sku).toBe("FG-001");
    expect(inv?.type).toBe("retail_good");
  });

  it("resolves Tumbler via inventory_item_id", () => {
    const product = data.products.find((p) => p.sku === "RTL-001")!;
    const inv = resolveProductInventoryItem(data, product.id);
    expect(inv?.sku).toBe("RTL-001");
    expect(inv?.type).toBe("retail_good");
  });

  it("resolves Sandwich Club via inventory_item_id", () => {
    const product = data.products.find((p) => p.sku === "FD-003")!;
    const inv = resolveProductInventoryItem(data, product.id);
    expect(inv?.sku).toBe("FD-003");
    expect(inv?.type).toBe("retail_good");
  });

  it("returns null for recipe-based products", () => {
    const product = data.products.find((p) => p.sku === "BEV-001")!;
    expect(resolveProductInventoryItem(data, product.id)).toBeNull();
  });
});

describe("assertNonRecipeProductsHaveRetailInventory", () => {
  it("passes on mock seed", () => {
    expect(() => assertNonRecipeProductsHaveRetailInventory(createMockSeed())).not.toThrow();
  });

  it("throws when a non-recipe product has no linked inventory", () => {
    const data = createMockSeed();
    const product = data.products.find((p) => p.sku === "FD-001")!;
    product.inventoryItemId = undefined;
    expect(() => assertNonRecipeProductsHaveRetailInventory(data)).toThrow(/Croissant/);
  });
});
