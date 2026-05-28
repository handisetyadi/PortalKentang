"use server";

import { redirect } from "next/navigation";
import {
  buildDemoSuperuserSession,
  isDemoSuperuserEnabled,
  matchesDemoSuperuserCredentials,
} from "./demo-superuser";
import { clearSession, getSession, setSession } from "./session";

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

  if (matchesDemoSuperuserCredentials(company, username, password)) {
    await setSession(buildDemoSuperuserSession());
    redirect("/dashboard");
  }

  if (!isDemoSuperuserEnabled()) {
    return { error: "Demo login is disabled. Connect Supabase to sign in." };
  }

  return {
    error:
      "Invalid credentials. For demo access use Company Kentang, Username Kentang, Password Kentang.",
  };
}

export async function logoutAction(): Promise<void> {
  await clearSession();
  redirect("/login");
}

export async function getSessionAction() {
  return getSession();
}
