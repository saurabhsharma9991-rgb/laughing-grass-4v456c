import { NextResponse } from "next/server";

/**
 * Lightweight gate for admin API routes — full JWT verification happens in route handlers.
 */
export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/admin")) {
    const auth = request.headers.get("Authorization");
    const sessionCookie = request.cookies.get("immflow_session")?.value;
    if (!auth?.startsWith("Bearer ") && !sessionCookie) {
      return NextResponse.json(
        { error: { message: "Missing authorization token.", code: "MISSING_TOKEN" } },
        { status: 401 }
      );
    }
  }

  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}

export const config = {
  matcher: ["/api/admin/:path*", "/admin"],
};
