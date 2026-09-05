import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

/*
 * ============================
 * CONFIG — adjust these two to match your setup
 * ============================
 */
const COOKIE_NAME = "admin_token"; // <-- change to whatever cookie your login route sets
const JWT_SECRET = process.env.JWT_SECRET; // <-- must match the secret used to SIGN the token at login

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow the login page itself, or you'd create a redirect loop
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return redirectToLogin(request);
  }

  try {
    if (!JWT_SECRET) {
      throw new Error("JWT_SECRET is not set in environment variables");
    }

    // Verifies signature AND expiry. Throws if invalid/expired.
    await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));

    // Token is valid — let the request through
    return NextResponse.next();
  } catch (err) {
    console.error("Admin auth check failed:", err);
    return redirectToLogin(request);
  }
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/admin/login", request.url);
  // Optional: remember where they were headed, so login can redirect back
  loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

/*
 * ============================
 * MATCHER
 * ============================
 * Runs this middleware only for /admin/* routes,
 * excluding /admin/login (handled above) and static assets.
 */
export const config = {
  matcher: [
    "/admin/:path*",
  ],
};