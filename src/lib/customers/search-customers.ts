import type { Customer } from "@/lib/data/types";

export function normalizePhoneDigits(phone: string | undefined): string {
  return (phone ?? "").replace(/\D/g, "");
}

/** Local `0…` vs international `62…` variants for Indonesian-style numbers. */
export function phoneSearchDigitVariants(query: string): string[] {
  const digits = normalizePhoneDigits(query);
  if (!digits) return [];

  const variants = new Set<string>([digits]);
  if (digits.startsWith("0") && digits.length > 1) {
    variants.add(`62${digits.slice(1)}`);
  }
  if (digits.startsWith("62") && digits.length > 2) {
    variants.add(`0${digits.slice(2)}`);
  }
  return [...variants];
}

/** Match customer by display name or mobile number (partial, digit-normalized for phones). */
export function matchesCustomerSearch(
  customer: Pick<Customer, "name" | "phone" | "tags">,
  query: string
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  if (customer.name.toLowerCase().includes(q)) return true;

  const phoneDigits = normalizePhoneDigits(customer.phone);
  const variants = phoneSearchDigitVariants(query);
  if (variants.length > 0 && phoneDigits) {
    if (variants.some((v) => phoneDigits.includes(v))) return true;
  } else if (customer.phone?.toLowerCase().includes(q)) {
    return true;
  }

  return customer.tags.some((t) => t.toLowerCase().includes(q));
}

export function filterCustomers<T extends Pick<Customer, "name" | "phone" | "tags">>(
  customers: T[],
  query: string
): T[] {
  const trimmed = query.trim();
  if (!trimmed) return customers;
  return customers.filter((c) => matchesCustomerSearch(c, trimmed));
}
