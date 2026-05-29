import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { updateSession } from "@/lib/supabase/middleware";
import { isSupabaseEnvConfigured } from "@/lib/supabase/env";

const AUTH_ROUTES = ["/login", "/forgot-password", "/invite"];
const PUBLIC_PREFIXES = ["/_next", "/favicon.ico", "/api/health"];

function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

function isPublicPath(pathname: string) {
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

function hasValidSessionCookie(request: NextRequest): boolean {
  const raw = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw) as { userId?: string; companyId?: string };
    return Boolean(parsed.userId && parsed.companyId);
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { response: supabaseResponse, user: supabaseUser } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return supabaseResponse;
  }

  const authenticated = hasValidSessionCookie(request);
  const supabaseReady = isSupabaseEnvConfigured();

  if (isAuthRoute(pathname)) {
    if (authenticated && (!supabaseReady || supabaseUser)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return supabaseResponse;
  }

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(authenticated ? "/dashboard" : "/login", request.url)
    );
  }

  if (!authenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (supabaseReady && !supabaseUser) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("reason", "db-session");
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete(SESSION_COOKIE_NAME);
    return res;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|woff|ttf)$).*)",
  ],
};
