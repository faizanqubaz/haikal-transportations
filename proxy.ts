import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

const secret = new TextEncoder().encode(JWT_SECRET);

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public admin pages
  if (
    pathname === "/admin/login" ||
    pathname === "/admin/invite"
  ) {
    return NextResponse.next();
  }

  // Protect all other /admin pages
  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get("admin_token")?.value;

    if (!token) {
      return NextResponse.redirect(
        new URL("/admin/login", request.url)
      );
    }

    try {
      const { payload } = await jwtVerify(token, secret);

      if (
        payload.role !== "admin" &&
        payload.role !== "superadmin"
      ) {
        const response = NextResponse.redirect(
          new URL("/admin/login", request.url)
        );

        response.cookies.delete("admin_token");

        return response;
      }

      return NextResponse.next();
    } catch (error) {
      console.error("Invalid admin token:", error);

      const response = NextResponse.redirect(
        new URL("/admin/login", request.url)
      );

      response.cookies.delete("admin_token");

      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};