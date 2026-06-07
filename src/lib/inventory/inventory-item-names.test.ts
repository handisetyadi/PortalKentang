import { describe, expect, it } from "vitest";
import { hasInventoryItemName } from "./inventory-item-names";

describe("hasInventoryItemName", () => {
  it("matches case-insensitively", () => {
    expect(hasInventoryItemName([{ name: "Fresh milk" }], "fresh milk")).toBe(true);
  });

  it("ignores surrounding whitespace", () => {
    expect(hasInventoryItemName([{ name: "Fresh milk" }], "  Fresh milk  ")).toBe(true);
  });

  it("returns false when name is unused", () => {
    expect(hasInventoryItemName([{ name: "Fresh milk" }], "Oat milk")).toBe(false);
  });
});
