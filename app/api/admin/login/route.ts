import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";


import Admin from "@/models/Admin";
import { connectDB } from "@/libs/mongodb";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

const secret = new TextEncoder().encode(JWT_SECRET);

export async function POST(request: Request) {
  try {
    const body = await request.json();
  console.log('body',body)
    const username = body.username?.trim().toLowerCase();
    const password = body.password;

    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Username and password are required.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const admin = await Admin.findOne({ username }).lean();
    console.log('admin',admin)
    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid username or password.",
        },
        { status: 401 }
      );
    }

    const passwordMatches = await bcrypt.compare(
      password,
      admin.passwordHash
    );

    if (!passwordMatches) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid username or password.",
        },
        { status: 401 }
      );
    }

    const token = await new SignJWT({
      userId: admin._id.toString(),
      username: admin.username,
      role: admin.role,
    })
      .setProtectedHeader({
        alg: "HS256",
      })
      .setIssuedAt()
      .setExpirationTime("1d")
      .sign(secret);

    const response = NextResponse.json({
      success: true,
      message: "Authentication successful.",
    });

    response.cookies.set({
      name: "admin_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    console.error("Admin login error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}