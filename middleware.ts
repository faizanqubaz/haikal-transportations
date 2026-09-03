import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET!;

const secret = new TextEncoder().encode(JWT_SECRET);

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin/dashboard")) {
    if (!token) {
      return NextResponse.redirect(
        new URL("/admin", request.url)
      );
    }

    try {
      await jwtVerify(token, secret);

      return NextResponse.next();
    } catch {
      return NextResponse.redirect(
        new URL("/admin", request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/dashboard/:path*"],
};