import { describe, expect, it } from "vitest";
import { createMockSeed } from "@/lib/data/mock-seed";
import { linkRecipeToPosMenu, nextRecipeProductSku } from "./create-recipe-product";

describe("nextRecipeProductSku", () => {
  it("increments from existing BEV SKUs", () => {
    const data = createMockSeed();
    expect(nextRecipeProductSku(data.products)).toBe("BEV-00005");
  });

  it("starts at BEV-00001 when no BEV SKUs exist", () => {
    expect(nextRecipeProductSku([{ sku: "FD-001" }])).toBe("BEV-00001");
  });
});

describe("linkRecipeToPosMenu", () => {
  it("creates a new recipe-based product for a first-time recipe name", () => {
    const data = createMockSeed();
    const result = linkRecipeToPosMenu(data, {
      menuName: "Mocha",
      categoryId: data.categories[0]!.id,
      price: 35000,
    });

    expect(result.isNewProduct).toBe(true);
    const product = result.products.find((p) => p.id === result.productId);
    expect(product).toMatchObject({
      name: "Mocha",
      price: 35000,
      isRecipeBased: true,
      isActive: true,
      categoryId: data.categories[0]!.id,
    });
    expect(result.updatedRecipes).toEqual(data.recipes);
  });

  it("reuses product and deactivates prior version for same recipe name", () => {
    const data = createMockSeed();
    const latte = data.recipes.find((r) => r.name === "Latte")!;

    const result = linkRecipeToPosMenu(data, {
      menuName: "Latte",
      categoryId: data.categories[0]!.id,
      price: 33000,
    });

    expect(result.isNewProduct).toBe(false);
    expect(result.productId).toBe(latte.productId);
    const product = result.products.find((p) => p.id === result.productId);
    expect(product?.price).toBe(33000);
    expect(result.products).toHaveLength(data.products.length);

    const oldLatte = result.updatedRecipes.find((r) => r.id === latte.id);
    expect(oldLatte?.isActive).toBe(false);
  });
});
