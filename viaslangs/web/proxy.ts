import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAuthenticated } from "./lib/auth";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const authed = isAuthenticated(req);

  if (pathname.startsWith("/api/")) {
    if (pathname.startsWith("/api/auth/login")) {
      return NextResponse.next();
    }
    if (!authed) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  if (!authed) {
    if (pathname === "/login") {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
};