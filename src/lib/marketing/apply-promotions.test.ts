import { describe, expect, it } from "vitest";
import { applyPromotions } from "./apply-promotions";
import type { CartLine } from "@/types/domain";
import type { AppData, Customer, LoyaltyRedemptionRule, Voucher } from "@/lib/data/types";

const customer: Customer = {
  id: "cu1",
  name: "Budi",
  tags: [],
  whatsappOptIn: true,
  emailOptIn: true,
  memberPointsBalance: 100,
  totalSpend: 0,
};

const lines: CartLine[] = [
  {
    id: "l1",
    productId: "p-espresso",
    productName: "Espresso",
    modifierIds: [],
    modifierNames: [],
    quantity: 1,
    unitPrice: 18000,
    modifierPriceTotal: 0,
    discountAmount: 0,
    taxRate: 0.11,
  },
  {
    id: "l2",
    productId: "p-croissant",
    productName: "Croissant",
    modifierIds: [],
    modifierNames: [],
    quantity: 1,
    unitPrice: 22000,
    modifierPriceTotal: 0,
    discountAmount: 0,
    taxRate: 0.11,
  },
];

const loyaltyRules: LoyaltyRedemptionRule[] = [
  { id: "lr1", pointsRequired: 50, redeemType: "beverage", isActive: true },
  { id: "lr2", pointsRequired: 50, redeemType: "food", isActive: true },
];

const categories = [
  { id: "cat-coffee", name: "Coffee", sortOrder: 1 },
  { id: "cat-food", name: "Food", sortOrder: 2 },
];

const products = [
  {
    id: "p-espresso",
    categoryId: "cat-coffee",
    name: "Espresso",
    sku: "BEV-001",
    price: 18000,
    taxRate: 0.11,
    isRecipeBased: true,
    isActive: true,
  },
  {
    id: "p-croissant",
    categoryId: "cat-food",
    name: "Croissant",
    sku: "FD-001",
    price: 22000,
    taxRate: 0.11,
    isRecipeBased: false,
    isActive: true,
  },
];

const vouchers: Voucher[] = [
  {
    id: "v1",
    code: "TEST10",
    discountType: "percentage",
    discountValue: 10,
    minSpend: 10000,
    validFrom: new Date(Date.now() - 86400000).toISOString(),
    validUntil: new Date(Date.now() + 86400000).toISOString(),
    redemptionCount: 0,
    isActive: true,
  },
];

describe("applyPromotions", () => {
  it("redeems cheapest eligible beverage line", () => {
    const result = applyPromotions({
      lines,
      customer,
      loyaltyRules,
      vouchers: [],
      categories,
      products,
      loyaltySettings: { rupiahPerPoint: 1000 },
      redeemPoints: true,
    });

    expect(result.redeemedProductId).toBe("p-espresso");
    expect(result.pointsRedeemed).toBe(50);
    expect(result.redeemedLineDiscount).toBe(18000);
  });

  it("applies voucher after point redemption on remaining subtotal", () => {
    const result = applyPromotions({
      lines,
      customer,
      loyaltyRules,
      vouchers,
      categories,
      products,
      loyaltySettings: { rupiahPerPoint: 1000 },
      redeemPoints: true,
      voucherCode: "TEST10",
    });

    // 10% of 22.000 remaining after espresso redeem → Rp 2.200
    expect(result.voucherDiscount).toBe(2200);
    expect(result.pointsEarned).toBe(Math.floor(result.cashSubtotalBeforeTax / 1000));
  });
});
