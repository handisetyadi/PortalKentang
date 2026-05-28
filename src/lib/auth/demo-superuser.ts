/**
 * TEMPORARY demo superuser — remove this module when Supabase auth is live.
 * Set DEMO_SUPERUSER_ENABLED=false or delete src/lib/auth/demo-superuser.ts to disable.
 */
import type { AppRole, UserSession } from "@/types/domain";
import { PERMISSION_KEYS } from "@/types/domain";

export const DEMO_SUPERUSER_COOKIE_FLAG = "isDemoSuperuser" as const;

/** Credentials for local/demo login only */
export const DEMO_SUPERUSER_CREDENTIALS = {
  company: "Kentang",
  username: "Kentang",
  password: "Kentang",
} as const;

const ALL_ROLES: AppRole[] = [
  "cashier",
  "barista",
  "store_manager",
  "inventory_staff",
  "finance",
  "operations_manager",
  "commercial_analyst",
  "company_admin",
];

export function isDemoSuperuserEnabled(): boolean {
  const flag =
    process.env.NEXT_PUBLIC_DEMO_SUPERUSER_ENABLED ?? process.env.DEMO_SUPERUSER_ENABLED;
  if (flag === undefined) return true;
  return flag !== "false";
}

export function matchesDemoSuperuserCredentials(
  company: string,
  username: string,
  password: string
): boolean {
  if (!isDemoSuperuserEnabled()) return false;

  const normalize = (s: string) => s.trim().toLowerCase();

  return (
    normalize(company) === normalize(DEMO_SUPERUSER_CREDENTIALS.company) &&
    normalize(username) === normalize(DEMO_SUPERUSER_CREDENTIALS.username) &&
    password === DEMO_SUPERUSER_CREDENTIALS.password
  );
}

export function buildDemoSuperuserSession(): UserSession & { isDemoSuperuser: true } {
  return {
    isDemoSuperuser: true,
    userId: "00000000-0000-4000-8000-000000000001",
    companyId: "00000000-0000-4000-8000-000000000010",
    companyName: "Kentang",
    companySlug: "kentang",
    accentColor: "teal",
    fullName: "Kentang Superuser",
    username: "Kentang",
    email: "kentang@demo.portalkentang.local",
    activeOutletId: "00000000-0000-4000-8000-000000000020",
    activeBrandId: "00000000-0000-4000-8000-000000000030",
    roles: ALL_ROLES,
    permissions: [...PERMISSION_KEYS],
  };
}

export type DemoSuperuserSession = ReturnType<typeof buildDemoSuperuserSession>;

export function isDemoSuperuserSession(
  session: UserSession | null | undefined
): session is DemoSuperuserSession {
  return (
    session != null &&
    "isDemoSuperuser" in session &&
    (session as DemoSuperuserSession).isDemoSuperuser === true
  );
}

/** Superuser bypasses every permission and role check */
export function hasPermissionOverride(
  session: UserSession | null | undefined,
  _permission?: string
): boolean {
  return isDemoSuperuserSession(session);
}

export function hasRoleOverride(
  session: UserSession | null | undefined,
  _role?: AppRole
): boolean {
  return isDemoSuperuserSession(session);
}
