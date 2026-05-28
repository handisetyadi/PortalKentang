import type { CartLine } from "@/types/domain";

/** unitPrice = product base + variant delta; modifierPriceTotal = sum of modifier deltas */
export function getLineBase(line: CartLine): number {
  const unit = line.unitPrice + (line.modifierPriceTotal ?? 0);
  return unit * line.quantity - line.discountAmount;
}

export function getLineTax(line: CartLine): number {
  return getLineBase(line) * line.taxRate;
}

export function getLineTotal(line: CartLine): number {
  return getLineBase(line) + getLineTax(line);
}

export function getCartTotals(lines: CartLine[]): {
  subtotal: number;
  taxTotal: number;
  total: number;
} {
  const subtotal = lines.reduce((sum, line) => sum + getLineBase(line), 0);
  const taxTotal = lines.reduce((sum, line) => sum + getLineTax(line), 0);
  return { subtotal, taxTotal, total: subtotal + taxTotal };
}
