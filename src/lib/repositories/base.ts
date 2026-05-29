import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type DbClient = SupabaseClient<Database>;

export type TenantContext = {
  companyId: string;
};

export function throwIfError(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}
