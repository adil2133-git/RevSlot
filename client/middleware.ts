import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// The backend sets `accessToken` as an httpOnly cookie (auth.controller.ts
// setAuthCookies). httpOnly only blocks *browser JS* (document.cookie) —
// Next.js middleware runs server-side and can read it fine via
// request.cookies. This is a presence/expiry check only, not signature
// verification (Edge runtime, no access to the JWT secret) — real
// verification happens via requireAuth on every protected API call.
const AUTH_COOKIE_NAME = "accessToken";

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