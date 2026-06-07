import { describe, expect, it } from "vitest";
import {
  canFulfillRecipeItemStock,
  hasConsumptionChoice,
  resolveConsumptionInventoryItem,
  resolveRecipeItemConsumptionId,
  resolveRecipeItemLineQuantity,
} from "./resolve-consumption-item";

describe("resolveConsumptionInventoryItem", () => {
  it("prefers byproduct when both are defined and byproduct has stock", () => {
    const id = resolveConsumptionInventoryItem(
      { semiFinishedInventoryItemId: "sf", rawMaterialInventoryItemId: "rm" },
      (itemId) => (itemId === "sf" ? 5 : 0)
    );
    expect(id).toBe("sf");
  });

  it("falls back to raw material when byproduct has no stock", () => {
    const id = resolveConsumptionInventoryItem(
      { semiFinishedInventoryItemId: "sf", rawMaterialInventoryItemId: "rm" },
      () => 0
    );
    expect(id).toBe("rm");
  });

  it("uses the only option when no dual choice exists", () => {
    expect(
      resolveConsumptionInventoryItem({ semiFinishedInventoryItemId: "sf" }, () => 0)
    ).toBe("sf");
    expect(
      resolveConsumptionInventoryItem({ rawMaterialInventoryItemId: "rm" }, () => 0)
    ).toBe("rm");
  });
});

describe("resolveRecipeItemConsumptionId", () => {
  const types = {
    rm: "raw_material" as const,
    rm2: "raw_material" as const,
    sf: "semi_finished_good" as const,
  };
  const getItemType = (id: string) => types[id as keyof typeof types];

  it("uses substitute SF when primary is RM and SF has enough stock", () => {
    const id = resolveRecipeItemConsumptionId(
      {
        inventoryItemId: "rm",
        substituteInventoryItemId: "sf",
        quantity: 100,
        substituteQuantity: 20,
      },
      (itemId) => (itemId === "sf" ? 20 : 0),
      getItemType,
      { saleQuantity: 1, yieldFactor: 1 }
    );
    expect(id).toBe("sf");
  });

  it("falls back to RM when SF has stock but not enough for the line", () => {
    const id = resolveRecipeItemConsumptionId(
      {
        inventoryItemId: "rm",
        substituteInventoryItemId: "sf",
        quantity: 100,
        substituteQuantity: 20,
      },
      (itemId) => (itemId === "sf" ? 10 : 500),
      getItemType,
      { saleQuantity: 1, yieldFactor: 1 }
    );
    expect(id).toBe("rm");
  });

  it("falls back to RM primary when SF substitute has no stock", () => {
    const id = resolveRecipeItemConsumptionId(
      { inventoryItemId: "rm", substituteInventoryItemId: "sf" },
      () => 0,
      getItemType
    );
    expect(id).toBe("rm");
  });

  it("always uses primary when both are raw material", () => {
    const id = resolveRecipeItemConsumptionId(
      { inventoryItemId: "rm", substituteInventoryItemId: "rm2" },
      (itemId) => (itemId === "rm2" ? 10 : 0),
      getItemType
    );
    expect(id).toBe("rm");
  });

  it("prefers SF primary when substitute is RM and SF has stock", () => {
    const id = resolveRecipeItemConsumptionId(
      { inventoryItemId: "sf", substituteInventoryItemId: "rm" },
      (itemId) => (itemId === "sf" ? 3 : 0),
      getItemType
    );
    expect(id).toBe("sf");
  });

  it("falls back to RM substitute when SF primary has no stock", () => {
    const id = resolveRecipeItemConsumptionId(
      { inventoryItemId: "sf", substituteInventoryItemId: "rm" },
      () => 0,
      getItemType
    );
    expect(id).toBe("rm");
  });

  it("returns primary item when no substitute", () => {
    expect(resolveRecipeItemConsumptionId({ inventoryItemId: "rm" }, () => 0)).toBe("rm");
  });

  it("falls back to legacy behavior when item types are unknown", () => {
    const id = resolveRecipeItemConsumptionId(
      { inventoryItemId: "rm", substituteInventoryItemId: "sf" },
      (itemId) => (itemId === "sf" ? 2 : 0)
    );
    expect(id).toBe("sf");
  });
});

describe("resolveRecipeItemLineQuantity", () => {
  it("uses substitute quantity when substitute item is consumed", () => {
    expect(
      resolveRecipeItemLineQuantity(
        {
          inventoryItemId: "rm",
          substituteInventoryItemId: "sf",
          quantity: 100,
          substituteQuantity: 50,
        },
        "sf"
      )
    ).toBe(50);
  });

  it("uses primary quantity for raw material", () => {
    expect(
      resolveRecipeItemLineQuantity(
        {
          inventoryItemId: "rm",
          substituteInventoryItemId: "sf",
          quantity: 100,
          substituteQuantity: 50,
        },
        "rm"
      )
    ).toBe(100);
  });
});

describe("canFulfillRecipeItemStock", () => {
  const types = {
    rm: "raw_material" as const,
    sf: "semi_finished_good" as const,
  };
  const getItemType = (id: string) => types[id as keyof typeof types];
  const line = {
    inventoryItemId: "rm",
    substituteInventoryItemId: "sf",
    quantity: 100,
    substituteQuantity: 20,
  };
  const context = { saleQuantity: 1, yieldFactor: 1 };

  it("allows sale when SF is insufficient but RM can cover", () => {
    expect(
      canFulfillRecipeItemStock(
        line,
        (id) => (id === "sf" ? 10 : 500),
        context,
        getItemType
      )
    ).toBe(true);
  });

  it("blocks sale when both SF and RM are empty", () => {
    expect(canFulfillRecipeItemStock(line, () => 0, context, getItemType)).toBe(false);
  });

  it("blocks sale when both have stock but neither can cover the line", () => {
    expect(
      canFulfillRecipeItemStock(
        line,
        (id) => (id === "sf" ? 10 : 50),
        context,
        getItemType
      )
    ).toBe(false);
  });
});

describe("hasConsumptionChoice", () => {
  it("is true only when both byproduct and raw material are set", () => {
    expect(
      hasConsumptionChoice({
        semiFinishedInventoryItemId: "sf",
        rawMaterialInventoryItemId: "rm",
      })
    ).toBe(true);
    expect(hasConsumptionChoice({ semiFinishedInventoryItemId: "sf" })).toBe(false);
  });
});
