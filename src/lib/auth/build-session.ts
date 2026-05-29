import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppRole, UserSession } from "@/types/domain";
import { PERMISSION_KEYS } from "@/types/domain";

export async function buildUserSession(
  supabase: SupabaseClient,
  userId: string
): Promise<UserSession | null> {
  const { data: profile, error: profileErr } = await supabase
    .from("user_profiles")
    .select(
      `
      id,
      username,
      full_name,
      email,
      default_outlet_id,
      company_id,
      companies (
        id,
        name,
        slug,
        accent_color
      )
    `
    )
    .eq("id", userId)
    .maybeSingle();

  if (profileErr || !profile?.companies) return null;

  const companyRaw = profile.companies as
    | { id: string; name: string; slug: string; accent_color: string | null }
    | { id: string; name: string; slug: string; accent_color: string | null }[];
  const company = Array.isArray(companyRaw) ? companyRaw[0] : companyRaw;
  if (!company) return null;

  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("company_id", profile.company_id);

  const roles = [...new Set((roleRows ?? []).map((r) => r.role as AppRole))];

  const { data: permRows } = await supabase
    .from("role_permissions")
    .select("permission_key")
    .in("role", roles.length ? roles : ["company_admin"]);

  const permissions = [...new Set((permRows ?? []).map((p) => p.permission_key))];
  if (roles.includes("company_admin")) {
    for (const key of PERMISSION_KEYS) {
      if (!permissions.includes(key)) permissions.push(key);
    }
  }

  const { data: outlet } = profile.default_outlet_id
    ? await supabase
        .from("outlets")
        .select("id, brand_id")
        .eq("id", profile.default_outlet_id)
        .maybeSingle()
    : { data: null };

  return {
    userId: profile.id,
    companyId: company.id,
    companyName: company.name,
    companySlug: company.slug,
    accentColor: (company.accent_color ?? "teal") as UserSession["accentColor"],
    fullName: profile.full_name,
    username: profile.username,
    email: profile.email,
    activeOutletId: profile.default_outlet_id,
    activeBrandId: outlet?.brand_id ?? null,
    roles,
    permissions,
  };
}
