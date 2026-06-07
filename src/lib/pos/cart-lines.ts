import type { CartLine } from "@/types/domain";

type MergeableLine = Omit<CartLine, "id" | "quantity">;

function normalizeNote(notes?: string): string {
  return (notes ?? "").trim();
}

function modifierIdsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((id, i) => id === sortedB[i]);
}

/** True when two lines differ only by quantity and may be merged in the cart. */
export function cartLinesAreMergeable(a: MergeableLine, b: MergeableLine): boolean {
  return (
    a.productId === b.productId &&
    (a.variantId ?? undefined) === (b.variantId ?? undefined) &&
    modifierIdsEqual(a.modifierIds, b.modifierIds) &&
    normalizeNote(a.notes) === normalizeNote(b.notes) &&
    a.unitPrice === b.unitPrice &&
    a.modifierPriceTotal === b.modifierPriceTotal &&
    a.discountAmount === b.discountAmount &&
    a.taxRate === b.taxRate &&
    (a.recipeId ?? undefined) === (b.recipeId ?? undefined) &&
    (a.recipeVersion ?? undefined) === (b.recipeVersion ?? undefined)
  );
}

export function projectCartAfterAdd(
  lines: CartLine[],
  incoming: Omit<CartLine, "id">
): CartLine[] {
  const existing = lines.find((l) => cartLinesAreMergeable(incoming, l));
  if (existing) {
    return lines.map((l) =>
      l.id === existing.id ? { ...l, quantity: l.quantity + incoming.quantity } : l
    );
  }
  return [...lines, { ...incoming, id: "__projected__", quantity: incoming.quantity }];
}
