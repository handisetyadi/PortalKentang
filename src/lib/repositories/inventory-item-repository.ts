import type { SupabaseClient } from "@supabase/supabase-js";

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

async function nameExistsInTable(
  supabase: SupabaseClient,
  table: "inventory_items" | "products",
  companyId: string,
  name: string
): Promise<boolean> {
  const normalized = normalizeName(name);
  if (!normalized) return false;

  const { data, error } = await supabase
    .from(table)
    .select("name")
    .eq("company_id", companyId);

  if (error) throw new Error(error.message);

  return (data ?? []).some((row) => normalizeName(row.name ?? "") === normalized);
}

export async function isInventoryItemNameTaken(
  supabase: SupabaseClient,
  companyId: string,
  name: string
): Promise<boolean> {
  return nameExistsInTable(supabase, "inventory_items", companyId, name);
}

export async function isProductNameTaken(
  supabase: SupabaseClient,
  companyId: string,
  name: string
): Promise<boolean> {
  return nameExistsInTable(supabase, "products", companyId, name);
}

export async function assertInventoryItemNameAvailable(
  supabase: SupabaseClient,
  companyId: string,
  name: string
): Promise<void> {
  if (await isInventoryItemNameTaken(supabase, companyId, name)) {
    throw new Error("An inventory item with this name already exists");
  }
}

export async function assertProductNameAvailable(
  supabase: SupabaseClient,
  companyId: string,
  name: string
): Promise<void> {
  if (await isProductNameTaken(supabase, companyId, name)) {
    throw new Error("A menu product with this name already exists");
  }
}
