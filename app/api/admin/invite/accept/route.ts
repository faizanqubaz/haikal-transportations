import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

import Admin from "@/models/Admin";
import AdminInvitation from "@/models/AdminInvitation";
import { connectDB } from "@/libs/mongodb";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

const secret = new TextEncoder().encode(JWT_SECRET);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const token = String(body.token || "").trim();

    const username = String(body.username || "")
      .trim()
      .toLowerCase();

    const password = String(body.password || "");
    const confirmPassword = String(body.confirmPassword || "");

    // ---------------------------------------------
    // Validation
    // ---------------------------------------------

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Invitation token is required.",
        },
        { status: 400 }
      );
    }

    if (!username) {
      return NextResponse.json(
        {
          success: false,
          message: "Username is required.",
        },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        {
          success: false,
          message: "Username must be at least 3 characters.",
        },
        { status: 400 }
      );
    }

    if (!/^[a-z0-9._-]+$/.test(username)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Username can only contain letters, numbers, dots, underscores, and hyphens.",
        },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        {
          success: false,
          message: "Password is required.",
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 8 characters.",
        },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Passwords do not match.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------
    // Connect database
    // ---------------------------------------------

    await connectDB();

    // ---------------------------------------------
    // Find valid invitation
    // ---------------------------------------------

    const invitation = await AdminInvitation.findOne({
      token,
      used: false,
      expiresAt: {
        $gt: new Date(),
      },
    });

    if (!invitation) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This invitation has expired, is invalid, or has already been used.",
        },
        { status: 410 }
      );
    }

    // ---------------------------------------------
    // Check username
    // ---------------------------------------------

    const existingAdmin = await Admin.findOne({
      username,
    }).lean();

    if (existingAdmin) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This username is already taken. Please choose another username.",
        },
        { status: 409 }
      );
    }

    // ---------------------------------------------
    // Hash password
    // ---------------------------------------------

    const passwordHash = await bcrypt.hash(password, 12);

    // ---------------------------------------------
    // Create account
    // ---------------------------------------------
    //
    // IMPORTANT:
    // Invited users are ALWAYS normal admins.
    //
    // Never accept role from the frontend.
    //
    // ---------------------------------------------

    const admin = await Admin.create({
      username,
      passwordHash,
      role: "admin",
    });

    // ---------------------------------------------
    // Mark invitation as used
    // ---------------------------------------------

    invitation.used = true;
    await invitation.save();

    // ---------------------------------------------
    // Create JWT
    // ---------------------------------------------

    const jwtToken = await new SignJWT({
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

    // ---------------------------------------------
    // Create response
    // ---------------------------------------------

    const response = NextResponse.json(
      {
        success: true,
        message: "Admin account created successfully.",
        user: {
          id: admin._id.toString(),
          username: admin.username,
          role: admin.role,
        },
      },
      {
        status: 201,
      }
    );

    // ---------------------------------------------
    // Login user automatically
    // ---------------------------------------------

    response.cookies.set({
      name: "admin_token",
      value: jwtToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    console.log("ADMIN ACCOUNT CREATED AND LOGGED IN:", {
      id: admin._id.toString(),
      username: admin.username,
      role: admin.role,
      invitationEmail: invitation.email,
    });

    return response;
  } catch (error) {
    console.error("ADMIN INVITATION ACCEPT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong. Please try again.",
      },
      {
        status: 500,
      }
    );
  }
}