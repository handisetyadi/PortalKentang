import type { CartLine } from "@/types/domain";
import type {
  LoyaltyRedemptionRule,
  Product,
  ProductCategory,
  Customer,
} from "@/lib/data/types";
import { productMatchesLoyaltyRule } from "./category-type";

export function getLineUnitBase(line: CartLine): number {
  return line.unitPrice + (line.modifierPriceTotal ?? 0);
}

export function getLineRemainingBase(line: CartLine): number {
  return getLineUnitBase(line) * line.quantity - line.discountAmount;
}

export interface RedemptionCandidate {
  line: CartLine;
  rule: LoyaltyRedemptionRule;
  unitBase: number;
}

export function findCheapestRedemptionCandidate(params: {
  lines: CartLine[];
  rules: LoyaltyRedemptionRule[];
  customer?: Customer;
  products: Product[];
  categories: ProductCategory[];
}): RedemptionCandidate | null {
  const { lines, rules, customer, products, categories } = params;
  if (!customer) return null;

  const activeRules = rules.filter((r) => r.isActive);
  const candidates: RedemptionCandidate[] = [];

  for (const line of lines) {
    const product = products.find((p) => p.id === line.productId);
    if (!product) continue;

    for (const rule of activeRules) {
      if (customer.memberPointsBalance < rule.pointsRequired) continue;
      if (!productMatchesLoyaltyRule(product, rule.redeemType, rule.productId, categories)) {
        continue;
      }
      candidates.push({ line, rule, unitBase: getLineUnitBase(line) });
    }
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a.unitBase - b.unitBase);
  return candidates[0];
}

export function canRedeemPoints(params: {
  lines: CartLine[];
  rules: LoyaltyRedemptionRule[];
  customer?: Customer;
  products: Product[];
  categories: ProductCategory[];
}): boolean {
  return findCheapestRedemptionCandidate(params) != null;
}
