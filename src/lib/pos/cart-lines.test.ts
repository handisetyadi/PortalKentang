import { describe, expect, it } from "vitest";
import { cartLinesAreMergeable, projectCartAfterAdd } from "./cart-lines";
import type { CartLine } from "@/types/domain";

const base: Omit<CartLine, "id"> = {
  productId: "p1",
  productName: "Croissant",
  modifierIds: [],
  modifierNames: [],
  quantity: 1,
  unitPrice: 22000,
  modifierPriceTotal: 0,
  discountAmount: 0,
  taxRate: 0.11,
};

describe("cartLinesAreMergeable", () => {
  it("merges identical lines", () => {
    expect(cartLinesAreMergeable(base, { ...base, id: "a" })).toBe(true);
  });

  it("does not merge when notes differ", () => {
    expect(
      cartLinesAreMergeable({ ...base, notes: "less ice" }, { ...base, id: "a", notes: "extra hot" })
    ).toBe(false);
  });

  it("does not merge when modifiers differ", () => {
    expect(
      cartLinesAreMergeable({ ...base, modifierIds: ["m1"] }, { ...base, id: "a", modifierIds: [] })
    ).toBe(false);
  });

  it("treats empty and missing notes as equal", () => {
    expect(cartLinesAreMergeable({ ...base, notes: "" }, { ...base, id: "a" })).toBe(true);
  });
});

describe("projectCartAfterAdd", () => {
  it("increments quantity for matching line", () => {
    const lines: CartLine[] = [{ ...base, id: "line-1", quantity: 1 }];
    const projected = projectCartAfterAdd(lines, { ...base, quantity: 1 });
    expect(projected).toHaveLength(1);
    expect(projected[0].quantity).toBe(2);
  });

  it("appends a new row when lines differ", () => {
    const lines: CartLine[] = [{ ...base, id: "line-1", quantity: 1 }];
    const projected = projectCartAfterAdd(lines, { ...base, notes: "warm", quantity: 1 });
    expect(projected).toHaveLength(2);
  });
});
