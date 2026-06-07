import { describe, expect, it } from "vitest";
import { recipeInternalName, recipeTitle } from "./recipe-display";
import type { Product, Recipe } from "@/lib/data/types";

const baseRecipe: Recipe = {
  id: "r1",
  name: "Latte (summer)",
  version: 1,
  outputQuantity: 1,
  outputUnit: "cup",
  yieldFactor: 1,
  isActive: true,
};

const latteProduct: Product = {
  id: "p2",
  categoryId: "c1",
  name: "Latte",
  sku: "BEV-002",
  price: 32000,
  taxRate: 0.11,
  isRecipeBased: true,
  isActive: true,
};

describe("recipeTitle", () => {
  it("uses product name when linked", () => {
    expect(recipeTitle({ ...baseRecipe, productId: "p2" }, latteProduct)).toBe("Latte");
  });

  it("falls back to recipe name when unlinked", () => {
    expect(recipeTitle(baseRecipe)).toBe("Latte (summer)");
  });
});

describe("recipeInternalName", () => {
  it("returns null when names match", () => {
    expect(
      recipeInternalName(
        { ...baseRecipe, name: "Kentang Goreng", productId: "p5" },
        { ...latteProduct, id: "p5", name: "Kentang Goreng" }
      )
    ).toBeNull();
  });

  it("returns recipe name when it differs from product", () => {
    expect(recipeInternalName({ ...baseRecipe, productId: "p2" }, latteProduct)).toBe(
      "Latte (summer)"
    );
  });
});
