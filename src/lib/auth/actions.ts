"use server";

import { redirect } from "next/navigation";
import { clearSession } from "./session";
import { signInWithCompanyCredentials, signOutSupabase } from "./supabase-login";

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const company = String(formData.get("company") ?? "");
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!company || !username || !password) {
    return { error: "Company, username, and password are required." };
  }

  const result = await signInWithCompanyCredentials(company, username, password);
  if (result.error) {
    return { error: result.error };
  }

  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await signOutSupabase();
  await clearSession();
  redirect("/login");
}

export async function getSessionAction() {
  const { getSession } = await import("./session");
  return getSession();
}
