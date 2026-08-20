import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Only `refreshToken` is ever set as a cookie now — `accessToken` lives
// in memory on the client and only ever appears in the JSON response
// body, never a cookie. So refreshToken's presence is the only signal
// available here. Same caveat as before: httpOnly only blocks browser
// JS, not server-side middleware, but this is presence-only, not
// signature verification — the Edge runtime has no access to the JWT
// secret. Real verification happens via requireAuth on every protected
// API call.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has("refreshToken");

  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register");

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
  matcher: ["/dashboard/:path*", "/login/:path*", "/login", "/register"],
};