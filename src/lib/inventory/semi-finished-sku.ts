const SF_SKU_PREFIX = "SF-";
const SF_SKU_DIGITS = 5;
const SF_SKU_PATTERN = /^SF-(\d+)$/i;

/** Next unique semi-finished SKU (SF-00001, SF-00002, …) from existing inventory SKUs. */
export function nextSemiFinishedSku(items: { sku: string }[]): string {
  let max = 0;
  for (const item of items) {
    const match = item.sku.trim().match(SF_SKU_PATTERN);
    if (!match) continue;
    const n = parseInt(match[1], 10);
    if (!Number.isNaN(n) && n > max) max = n;
  }
  return `${SF_SKU_PREFIX}${String(max + 1).padStart(SF_SKU_DIGITS, "0")}`;
}
