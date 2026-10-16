import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAuthenticated, SESSION_COOKIE, sessionCookieOptions } from "./lib/auth";

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

  // Для авторизованных страниц автоматически продлеваем срок действия cookie (бессрочная скользящая сессия)
  const res = NextResponse.next();
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    const cookieOpts = sessionCookieOptions(token);
    res.cookies.set(cookieOpts);
  }

  return res;
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-touch-icon.png|sitemap.xml|robots.txt).*)",
};