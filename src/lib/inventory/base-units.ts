/** Distinct base units already used on inventory items, sorted for display. */
export function collectInventoryBaseUnits(items: { baseUnit: string }[]): string[] {
  const units = new Set<string>();
  for (const item of items) {
    const unit = item.baseUnit?.trim();
    if (unit) units.add(unit);
  }
  if (units.size === 0) units.add("pcs");
  return [...units].sort((a, b) => a.localeCompare(b));
}
