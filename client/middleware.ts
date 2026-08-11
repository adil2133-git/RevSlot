import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// TODO: confirm exact cookie name + shape with Shibin once backend auth is wired.
// Middleware only checks for presence — it can't verify the JWT signature here
// (Edge runtime, no access to the signing secret without adding `jose`). Actual
// verification happens on the API side; this is just a fast redirect for UX.
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