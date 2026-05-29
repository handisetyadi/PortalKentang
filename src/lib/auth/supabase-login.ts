"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { buildUserSession } from "./build-session";
import { setSession } from "./session";

export type LoginResult = { error?: string };

export async function signInWithCompanyCredentials(
  company: string,
  username: string,
  password: string
): Promise<LoginResult> {
  const normalizedCompany = company.trim().toLowerCase();
  const normalizedUsername = username.trim().toLowerCase();

  const service = createServiceClient();
  let companyRow: { id: string } | null = null;
  const { data: bySlug } = await service
    .from("companies")
    .select("id")
    .eq("slug", normalizedCompany)
    .maybeSingle();
  companyRow = bySlug;

  if (!companyRow) {
    const { data: byCode } = await service
      .from("companies")
      .select("id")
      .ilike("code", company.trim())
      .maybeSingle();
    companyRow = byCode;
  }

  if (!companyRow) {
    return { error: "Company not found." };
  }

  const { data: profile } = await service
    .from("user_profiles")
    .select("email")
    .eq("company_id", companyRow.id)
    .ilike("username", normalizedUsername)
    .maybeSingle();

  if (!profile?.email) {
    return { error: "Invalid credentials." };
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password,
  });

  if (authError || !authData.user) {
    return { error: "Invalid credentials." };
  }

  const { data: sessionCheck } = await supabase.auth.getSession();
  if (!sessionCheck.session) {
    return { error: "Could not establish database session. Please try again." };
  }

  const session = await buildUserSession(supabase, authData.user.id);
  if (!session) {
    return { error: "User profile not configured." };
  }

  await setSession(session);
  return {};
}

export async function signOutSupabase(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
