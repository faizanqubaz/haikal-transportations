import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

const secret = new TextEncoder().encode(JWT_SECRET);

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  console.log("=================================");
  console.log("🔥 PROXY RUNNING");
  console.log("PATH:", pathname);

  // Allow login page
  if (pathname === "/admin/login") {
    console.log("➡️ Login page - allowed");
    return NextResponse.next();
  }

  // Protect every other /admin page
  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get("admin_token")?.value;

    console.log("TOKEN:", token ? "FOUND" : "NOT FOUND");

    if (!token) {
      console.log("❌ NO TOKEN - REDIRECTING");

      return NextResponse.redirect(
        new URL("/admin/login", request.url)
      );
    }

    try {
      const { payload } = await jwtVerify(token, secret);

      console.log("JWT:", payload);

      if (payload.role !== "admin") {
        console.log("❌ NOT ADMIN");

        const response = NextResponse.redirect(
          new URL("/admin/login", request.url)
        );

        response.cookies.delete("admin_token");

        return response;
      }

      console.log("✅ ADMIN AUTHORIZED");

      return NextResponse.next();
    } catch (error) {
      console.error("❌ INVALID TOKEN:", error);

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