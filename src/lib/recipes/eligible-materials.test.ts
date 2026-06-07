import { describe, expect, it } from "vitest";
import {
  getRecipeByproductOptions,
  getRecipeEligibleMaterials,
  isKnownInventoryItem,
  isRecipeMaterialType,
} from "./eligible-materials";
import type { InventoryItem } from "@/lib/data/types";

const items: InventoryItem[] = [
  {
    id: "a",
    type: "raw_material",
    sku: "RM-1",
    name: "Beans",
    baseUnit: "g",
    trackStock: true,
    trackExpiry: false,
    fifoCosting: true,
    isActive: true,
  },
  {
    id: "b",
    type: "finished_good",
    sku: "FG-1",
    name: "Latte",
    baseUnit: "cup",
    trackStock: false,
    trackExpiry: false,
    fifoCosting: false,
    isActive: true,
  },
  {
    id: "c",
    type: "semi_finished_good",
    sku: "SF-1",
    name: "Dough",
    baseUnit: "pcs",
    trackStock: true,
    trackExpiry: true,
    fifoCosting: true,
    isActive: false,
  },
];

describe("eligible-materials", () => {
  it("filters raw and semi-finished active items", () => {
    const eligible = getRecipeEligibleMaterials(items);
    expect(eligible.map((i) => i.id)).toEqual(["a"]);
  });

  it("recognizes inventory ids regardless of stock", () => {
    expect(isKnownInventoryItem(items, "a")).toBe(true);
    expect(isKnownInventoryItem(items, "missing")).toBe(false);
  });

  it("classifies recipe material types", () => {
    expect(isRecipeMaterialType("raw_material")).toBe(true);
    expect(isRecipeMaterialType("finished_good")).toBe(false);
  });

  it("lists active semi-finished goods as byproduct options", () => {
    const activeSemi: InventoryItem = { ...items[2], isActive: true };
    const byproducts = getRecipeByproductOptions([...items, activeSemi]);
    expect(byproducts.map((i) => i.id)).toEqual(["c"]);
  });
});
