import { describe, expect, it } from "vitest";
import {
  calculateVoucherDiscount,
  isVoucherCodeTaken,
  normalizeVoucherCode,
  roundPercentageDiscountDown,
} from "./voucher-validation";
import type { Voucher } from "@/lib/data/types";

const pctVoucher = (discountValue: number): Voucher => ({
  id: "v1",
  code: "PCT",
  discountType: "percentage",
  discountValue,
  minSpend: 0,
  validFrom: new Date(Date.now() - 86400000).toISOString(),
  validUntil: new Date(Date.now() + 86400000).toISOString(),
  redemptionCount: 0,
  isActive: true,
});

const fixedVoucher = (discountValue: number): Voucher => ({
  ...pctVoucher(discountValue),
  discountType: "fixed_amount",
});

describe("roundPercentageDiscountDown", () => {
  it("floors to multiple of 100", () => {
    expect(roundPercentageDiscountDown(3250)).toBe(3200);
    expect(roundPercentageDiscountDown(2200)).toBe(2200);
    expect(roundPercentageDiscountDown(150)).toBe(100);
    expect(roundPercentageDiscountDown(99)).toBe(0);
  });
});

describe("isVoucherCodeTaken", () => {
  it("detects duplicate case-insensitively", () => {
    const existing = [{ ...pctVoucher(10), code: "KENTANG10" }];
    expect(isVoucherCodeTaken(existing, "kentang10")).toBe(true);
    expect(isVoucherCodeTaken(existing, "KENTANG11")).toBe(false);
  });

  it("normalizes codes to uppercase", () => {
    expect(normalizeVoucherCode("  kentang10 ")).toBe("KENTANG10");
  });
});

describe("calculateVoucherDiscount", () => {
  it("percentage: 10% of 30.000 → Rp 3.000", () => {
    expect(calculateVoucherDiscount(pctVoucher(10), 30000)).toBe(3000);
  });

  it("percentage: 10% of 22.500 → Rp 2.200 (floored)", () => {
    expect(calculateVoucherDiscount(pctVoucher(10), 22500)).toBe(2200);
  });

  it("percentage: 10% of 22.000 → Rp 2.200", () => {
    expect(calculateVoucherDiscount(pctVoucher(10), 22000)).toBe(2200);
  });

  it("fixed amount is not rounded to hundreds", () => {
    expect(calculateVoucherDiscount(fixedVoucher(3500), 50000)).toBe(3500);
  });
});
