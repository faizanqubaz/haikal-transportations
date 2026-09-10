import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";


import AdminInvitation from "@/models/AdminInvitation";
import { connectDB } from "@/libs/mongodb";
import { sendAdminInvitationEmail } from "@/libs/emails/sendAdminInvitationEmail";


export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();

    const email = String(body.email || "")
      .trim()
      .toLowerCase();

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Email is required",
        },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email address",
        },
        { status: 400 }
      );
    }

    // Remove any previous unused invitation
    await AdminInvitation.deleteMany({
      email,
      used: false,
    });

    // Secure random token
    const token = crypto.randomBytes(32).toString("hex");

    // Exactly 24 hours from now
    const expiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );

    await AdminInvitation.create({
      email,
      token,
      expiresAt,
      used: false,
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const inviteUrl =
      `${baseUrl}/admin/invite?token=${token}`;

    await sendAdminInvitationEmail({
      email,
      inviteUrl,
    });

    return NextResponse.json({
      success: true,
      message:
        "Admin invitation sent successfully",
      expiresAt,
    });
  } catch (error) {
    console.error(
      "ADMIN INVITATION ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to send invitation",
      },
      { status: 500 }
    );
  }
}