import { describe, expect, it } from "vitest";
import { getSubstituteSemiFinishedConsumedIds } from "./substitute-consumption";
import type { RecipeItem } from "@/lib/data/types";

describe("getSubstituteSemiFinishedConsumedIds", () => {
  const line: RecipeItem = {
    id: "ri1",
    recipeId: "r1",
    inventoryItemId: "rm",
    substituteInventoryItemId: "sf",
    substituteQuantity: 1,
    substituteUnit: "ml",
    quantity: 200,
    unit: "ml",
    conversionToBaseFactor: 1,
    isOptional: false,
  };

  const types = {
    rm: "raw_material" as const,
    sf: "semi_finished_good" as const,
  };
  const getItemType = (id: string) => types[id as keyof typeof types];
  const context = { saleQuantity: 1, yieldFactor: 1 };

  it("includes SF when substitute semi-finished is resolved for consumption", () => {
    const ids = getSubstituteSemiFinishedConsumedIds(
      [line],
      "r1",
      [],
      (id) => (id === "sf" ? 10 : 500),
      getItemType,
      context
    );
    expect(ids.has("sf")).toBe(true);
  });

  it("excludes SF when RM fallback is resolved", () => {
    const ids = getSubstituteSemiFinishedConsumedIds(
      [line],
      "r1",
      [],
      (id) => (id === "sf" ? 0 : 500),
      getItemType,
      context
    );
    expect(ids.has("sf")).toBe(false);
  });
});
