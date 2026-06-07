/** Whether an inventory item already uses this name (case-insensitive, trimmed). */
export function hasInventoryItemName(items: { name: string }[], name: string): boolean {
  const normalized = name.trim().toLowerCase();
  if (!normalized) return false;
  return items.some((i) => i.name.trim().toLowerCase() === normalized);
}
