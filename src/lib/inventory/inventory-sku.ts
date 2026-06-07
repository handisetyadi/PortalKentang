import type { InventoryItemType } from "@/types/domain";
import { nextSemiFinishedSku } from "./semi-finished-sku";

const SKU_CONFIG: Partial<
  Record<InventoryItemType, { prefix: string; digits: number }>
> = {
  raw_material: { prefix: "RM-", digits: 5 },
  semi_finished_good: { prefix: "SF-", digits: 5 },
  retail_good: { prefix: "FD-", digits: 5 },
  supply: { prefix: "SUP-", digits: 5 },
};

function nextPrefixedSku(
  items: { sku: string }[],
  prefix: string,
  digits: number
): string {
  const pattern = new RegExp(`^${prefix.replace("-", "\\-")}(\\d+)$`, "i");
  let max = 0;
  for (const item of items) {
    const match = item.sku.trim().match(pattern);
    if (!match) continue;
    const n = parseInt(match[1], 10);
    if (!Number.isNaN(n) && n > max) max = n;
  }
  return `${prefix}${String(max + 1).padStart(digits, "0")}`;
}

/** Next unique inventory SKU for the given item type. */
export function nextInventorySku(
  type: InventoryItemType,
  items: { sku: string }[]
): string {
  if (type === "semi_finished_good") {
    return nextSemiFinishedSku(items);
  }
  const config = SKU_CONFIG[type];
  if (!config) {
    throw new Error(`Unsupported inventory type for SKU generation: ${type}`);
  }
  return nextPrefixedSku(items, config.prefix, config.digits);
}

export const INVENTORY_BASE_UNITS = ["pcs", "g", "ml", "order"] as const;

export type InventoryBaseUnit = (typeof INVENTORY_BASE_UNITS)[number];

export const ADDABLE_INVENTORY_TYPES = [
  "retail_good",
  "raw_material",
  "semi_finished_good",
  "supply",
] as const satisfies readonly InventoryItemType[];

export type AddableInventoryType = (typeof ADDABLE_INVENTORY_TYPES)[number];
