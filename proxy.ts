import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

const secret = new TextEncoder().encode(JWT_SECRET);

// NOTE: this exported name is required by Next.js — it must be exactly
// `middleware` (or a default export) or the file is not picked up at all.
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow the login page itself.
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Protect every other /admin page.
  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get("admin_token")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    try {
      const { payload } = await jwtVerify(token, secret);

      // Both admin and superadmin may reach /admin pages.
      // Page-level / API-level checks handle superadmin-only actions.
      if (payload.role !== "admin" && payload.role !== "superadmin") {
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