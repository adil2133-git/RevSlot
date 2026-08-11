import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Backend uses Bearer-token auth, not cookies (see auth.middleware.ts) — so
// this cookie is NOT the real session token. It's a presence flag written
// by authStore.ts purely so this Edge middleware has something to check,
// since it can't read localStorage. The actual Authorization header is
// attached client-side via lib/axios.ts's setAuthToken(). If someone
// forges this cookie, every real API call still 401s server-side.
const AUTH_COOKIE_NAME = "revslot_access_token";

const AUTH_ROUTES = ["/login/reviewer", "/login/admin", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(AUTH_COOKIE_NAME);

  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (isDashboardRoute && !hasSession) {
    const loginUrl = new URL("/login/reviewer", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login/:path*", "/register"],
};