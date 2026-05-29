import { cookies } from "next/headers";
import type { UserSession } from "@/types/domain";

export const SESSION_COOKIE_NAME = "pk_session";

export type StoredSession = UserSession;

export async function getSession(): Promise<StoredSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed.userId || !parsed.companyId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function setSession(session: StoredSession): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function requireSession(): Promise<StoredSession> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export function sessionHasPermission(session: StoredSession | null, permission: string): boolean {
  if (!session) return false;
  return session.permissions.includes(permission);
}

export function sessionHasRole(session: StoredSession | null, role: string): boolean {
  if (!session) return false;
  return session.roles.includes(role as StoredSession["roles"][number]);
}

export function sessionHasAnyRole(session: StoredSession | null, roles: string[]): boolean {
  if (!session) return false;
  return roles.some((r) => session.roles.includes(r as StoredSession["roles"][number]));
}
