import { describe, expect, it } from "vitest";
import type { CartLine } from "@/types/domain";
import { getCartTotals, getLineTotal } from "@/lib/pos/pricing";
import { completeSale } from "@/lib/pos/complete-sale";
import { createMockSeed } from "@/lib/data/mock-seed";
const latteLargeOat: CartLine = {
  id: "test-line",
  productId: "p2",
  productName: "Latte",
  variantId: "v1",
  variantName: "Large",
  modifierIds: ["m1"],
  modifierNames: ["Oat milk"],
  quantity: 1,
  unitPrice: 37000,
  modifierPriceTotal: 5000,
  discountAmount: 0,
  taxRate: 0.11,
};

describe("pricing", () => {
  it("Latte Large + Oat milk totals Rp 46.620 (42k + 11% tax)", () => {
    const { subtotal, taxTotal, total } = getCartTotals([latteLargeOat]);
    expect(subtotal).toBe(42000);
    expect(taxTotal).toBeCloseTo(4620, 0);
    expect(total).toBeCloseTo(46620, 0);
    expect(getLineTotal(latteLargeOat)).toBeCloseTo(46620, 0);
  });

  it("line without modifier uses base unit price only", () => {
    const line: CartLine = {
      ...latteLargeOat,
      modifierIds: [],
      modifierNames: [],
      modifierPriceTotal: 0,
      unitPrice: 32000,
      variantName: undefined,
    };
    const { total } = getCartTotals([line]);
    expect(total).toBeCloseTo(32000 * 1.11, 0);
  });
});

describe("completeSale", () => {
  it("transaction total equals subtotal + taxTotal", () => {
    const data = createMockSeed();
    const session = data.posSessions.find((s) => s.status === "open")!;
    const { transaction } = completeSale({
      data,
      outletId: session.outletId,
      sessionId: session.id,
      cashierId: "u1",
      lines: [latteLargeOat],
      payments: [{ method: "cash", amount: 46620 }],
    });
    expect(transaction.total).toBe(transaction.subtotal + transaction.taxTotal);
    expect(transaction.payments[0]?.amount).toBe(transaction.total);
  });
});
