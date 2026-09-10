import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

const secret = new TextEncoder().encode(JWT_SECRET);

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("admin_token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authenticated.",
        },
        {
          status: 401,
        }
      );
    }

    const { payload } = await jwtVerify(token, secret);

    if (
      typeof payload.userId !== "string" ||
      typeof payload.username !== "string" ||
      (payload.role !== "admin" && payload.role !== "superadmin")
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid authentication token.",
        },
        {
          status: 401,
        }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: payload.userId,
        username: payload.username,
        role: payload.role,
      },
    });
  } catch (error) {
    console.error("GET ADMIN ME ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Authentication failed.",
      },
      {
        status: 401,
      }
    );
  }
}