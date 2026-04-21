import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const TOKEN_COOKIE = "nexbase_token";

export function middleware(req: NextRequest) {
  const raw = req.cookies.get(TOKEN_COOKIE)?.value;
  const token = raw ? decodeURIComponent(raw) : "";

  if (req.nextUrl.pathname.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  if (req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/register") {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
