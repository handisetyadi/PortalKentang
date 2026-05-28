import type { StoredSession } from "./session";
import { sessionHasPermission, sessionHasRole, sessionHasAnyRole } from "./session";

export { sessionHasPermission as hasPermission, sessionHasRole as hasRole, sessionHasAnyRole as hasAnyRole };

export function canAccessRoute(session: StoredSession | null, _pathname: string): boolean {
  if (!session) return false;
  return true;
}
