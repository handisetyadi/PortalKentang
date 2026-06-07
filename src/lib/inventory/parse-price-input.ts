/** Parse price from form input; empty/invalid → undefined (never coerce "" to 0). */
export function parsePriceInput(val: unknown): number | undefined {
  if (val === undefined || val === null || val === "") return undefined;
  if (typeof val === "number") {
    return Number.isFinite(val) && val > 0 ? val : undefined;
  }
  const trimmed = String(val).trim();
  if (!trimmed) return undefined;
  // Indonesian thousands: 25.000 → 25000
  const normalized = trimmed.replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return n;
}
