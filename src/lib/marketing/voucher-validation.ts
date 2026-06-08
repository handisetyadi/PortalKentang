import type { Voucher } from "@/lib/data/types";

export function normalizeVoucherCode(code: string): string {
  return code.trim().toUpperCase();
}

export function isVoucherCodeTaken(
  vouchers: Voucher[],
  code: string,
  excludeId?: string
): boolean {
  const normalized = normalizeVoucherCode(code);
  if (!normalized) return false;
  return vouchers.some(
    (v) => v.id !== excludeId && normalizeVoucherCode(v.code) === normalized
  );
}

export type VoucherValidationResult =
  | { ok: true; voucher: Voucher }
  | { ok: false; message: string };

export function findVoucherByCode(vouchers: Voucher[], code: string): Voucher | undefined {
  const normalized = normalizeVoucherCode(code);
  if (!normalized) return undefined;
  return vouchers.find((v) => normalizeVoucherCode(v.code) === normalized);
}

export function validateVoucher(params: {
  voucher: Voucher;
  remainingSubtotalBeforeTax: number;
  now?: Date;
}): VoucherValidationResult {
  const { voucher, remainingSubtotalBeforeTax, now = new Date() } = params;

  if (!voucher.isActive) {
    return { ok: false, message: "Voucher tidak aktif." };
  }

  const from = new Date(voucher.validFrom);
  const until = new Date(voucher.validUntil);
  if (now < from) {
    return { ok: false, message: "Voucher belum berlaku." };
  }
  if (now > until) {
    return { ok: false, message: "Voucher sudah kedaluwarsa." };
  }

  if (voucher.maxRedemptions != null && voucher.redemptionCount >= voucher.maxRedemptions) {
    return { ok: false, message: "Kuota voucher sudah habis." };
  }

  if (remainingSubtotalBeforeTax < voucher.minSpend) {
    return {
      ok: false,
      message: `Minimum belanja Rp ${voucher.minSpend.toLocaleString("id-ID")} (sebelum pajak).`,
    };
  }

  return { ok: true, voucher };
}

/** Percentage discounts: floor to nearest Rp 100 below (e.g. 10% of 22.500 → Rp 2.200). */
export function roundPercentageDiscountDown(amount: number): number {
  if (amount <= 0) return 0;
  return Math.floor(amount / 100) * 100;
}

export function calculateVoucherDiscount(
  voucher: Voucher,
  remainingSubtotalBeforeTax: number
): number {
  if (remainingSubtotalBeforeTax <= 0) return 0;

  const rawDiscount =
    voucher.discountType === "percentage"
      ? (remainingSubtotalBeforeTax * voucher.discountValue) / 100
      : voucher.discountValue;

  const discount =
    voucher.discountType === "percentage"
      ? roundPercentageDiscountDown(rawDiscount)
      : rawDiscount;

  return Math.min(discount, remainingSubtotalBeforeTax);
}
