import type { CartLine } from "@/types/domain";
import type {
  Customer,
  LoyaltyRedemptionRule,
  LoyaltySettings,
  Product,
  ProductCategory,
  Voucher,
} from "@/lib/data/types";
import { getCartTotals } from "@/lib/pos/pricing";
import {
  findCheapestRedemptionCandidate,
  getLineRemainingBase,
  getLineUnitBase,
} from "./loyalty-eligibility";
import {
  calculateVoucherDiscount,
  findVoucherByCode,
  validateVoucher,
} from "./voucher-validation";

export interface PromotionInput {
  lines: CartLine[];
  customer?: Customer;
  loyaltyRules: LoyaltyRedemptionRule[];
  vouchers: Voucher[];
  categories: ProductCategory[];
  products: Product[];
  loyaltySettings: LoyaltySettings;
  redeemPoints: boolean;
  voucherCode?: string;
  now?: Date;
}

export interface PromotionResult {
  lines: CartLine[];
  loyaltyRuleId?: string;
  redeemedLineId?: string;
  redeemedProductId?: string;
  pointsRedeemed: number;
  redeemedLineDiscount: number;
  voucherId?: string;
  voucherCode?: string;
  voucherDiscount: number;
  cashSubtotalBeforeTax: number;
  pointsEarned: number;
  subtotal: number;
  taxTotal: number;
  total: number;
  voucherError?: string;
}

function cloneLines(lines: CartLine[]): CartLine[] {
  return lines.map((l) => ({ ...l, discountAmount: 0 }));
}

function distributeVoucherDiscount(lines: CartLine[], voucherDiscount: number): CartLine[] {
  if (voucherDiscount <= 0) return lines;

  const remainingBases = lines.map((l) => getLineRemainingBase(l));
  const totalRemaining = remainingBases.reduce((s, b) => s + b, 0);
  if (totalRemaining <= 0) return lines;

  let allocated = 0;
  return lines.map((line, index) => {
    const isLast = index === lines.length - 1;
    const share = isLast
      ? voucherDiscount - allocated
      : Math.round((remainingBases[index] / totalRemaining) * voucherDiscount * 100) / 100;
    allocated += share;
    return { ...line, discountAmount: line.discountAmount + Math.max(0, share) };
  });
}

export function applyPromotions(input: PromotionInput): PromotionResult {
  const {
    lines,
    customer,
    loyaltyRules,
    vouchers,
    categories,
    products,
    loyaltySettings,
    redeemPoints,
    voucherCode,
    now,
  } = input;

  let workingLines = cloneLines(lines);
  let loyaltyRuleId: string | undefined;
  let redeemedLineId: string | undefined;
  let redeemedProductId: string | undefined;
  let pointsRedeemed = 0;
  let redeemedLineDiscount = 0;
  let voucherId: string | undefined;
  let appliedVoucherCode: string | undefined;
  let voucherDiscount = 0;
  let voucherError: string | undefined;

  if (redeemPoints && customer) {
    const candidate = findCheapestRedemptionCandidate({
      lines: workingLines,
      rules: loyaltyRules,
      customer,
      products,
      categories,
    });
    if (candidate) {
      const unitDiscount = getLineUnitBase(candidate.line);
      workingLines = workingLines.map((line) =>
        line.id === candidate.line.id
          ? { ...line, discountAmount: line.discountAmount + unitDiscount }
          : line
      );
      loyaltyRuleId = candidate.rule.id;
      redeemedLineId = candidate.line.id;
      redeemedProductId = candidate.line.productId;
      pointsRedeemed = candidate.rule.pointsRequired;
      redeemedLineDiscount = unitDiscount;
    }
  }

  const remainingSubtotalBeforeTax = workingLines.reduce(
    (sum, line) => sum + getLineRemainingBase(line),
    0
  );

  if (voucherCode?.trim()) {
    const voucher = findVoucherByCode(vouchers, voucherCode);
    if (!voucher) {
      voucherError = "Kode voucher tidak ditemukan.";
    } else {
      const validation = validateVoucher({ voucher, remainingSubtotalBeforeTax, now });
      if (!validation.ok) {
        voucherError = validation.message;
      } else {
        voucherDiscount = calculateVoucherDiscount(validation.voucher, remainingSubtotalBeforeTax);
        voucherId = validation.voucher.id;
        appliedVoucherCode = validation.voucher.code;
        workingLines = distributeVoucherDiscount(workingLines, voucherDiscount);
      }
    }
  }

  const totals = getCartTotals(workingLines);
  const cashSubtotalBeforeTax = totals.subtotal;
  const pointsEarned =
    customer && loyaltySettings.rupiahPerPoint > 0
      ? Math.floor(cashSubtotalBeforeTax / loyaltySettings.rupiahPerPoint)
      : 0;

  return {
    lines: workingLines,
    loyaltyRuleId,
    redeemedLineId,
    redeemedProductId,
    pointsRedeemed,
    redeemedLineDiscount,
    voucherId,
    voucherCode: appliedVoucherCode,
    voucherDiscount,
    cashSubtotalBeforeTax,
    pointsEarned,
    subtotal: totals.subtotal,
    taxTotal: totals.taxTotal,
    total: totals.total,
    voucherError,
  };
}

/** Preview totals without mutating cart lines (for display). */
export function previewPromotions(input: PromotionInput): PromotionResult {
  return applyPromotions(input);
}

export function computeEarnedPoints(
  cashSubtotalBeforeTax: number,
  rupiahPerPoint: number,
  customerId?: string
): number {
  if (!customerId || rupiahPerPoint <= 0) return 0;
  return Math.floor(cashSubtotalBeforeTax / rupiahPerPoint);
}
