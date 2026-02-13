import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Routes yang memerlukan authentication
const protectedRoutes = [
  "/dashboard",
  "/settings",
  "/transaction",
  "/production",
  "/inventory",
  "/master",
  "/reports",
  "/rbac",
];

// Routes yang hanya untuk guest (belum login)
const guestRoutes = ["/auth/login", "/auth/register"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip proxy for API routes and static files
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check if session cookie exists (optimistic check)
  const sessionCookie = getSessionCookie(request);

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );

  // Check if route is guest-only
  const isGuestRoute = guestRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );

  // If accessing protected route without session cookie, redirect to login with message
  if (isProtectedRoute && !sessionCookie) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("unauthorized", "true");
    return NextResponse.redirect(loginUrl);
  }

  // If accessing guest route with session cookie, redirect to dashboard
  if (isGuestRoute && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap, robots
     * - public files with extensions
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)",
  ],
};
