import { NextRequest, NextResponse } from "next/server";


import AdminInvitation from "@/models/AdminInvitation";
import { connectDB } from "@/libs/mongodb";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const token =
      req.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        {
          valid: false,
          message: "Invitation token is missing",
        },
        { status: 400 }
      );
    }

    const invitation =
      await AdminInvitation.findOne({
        token,
        used: false,
        expiresAt: {
          $gt: new Date(),
        },
      }).lean();

    if (!invitation) {
      return NextResponse.json(
        {
          valid: false,
          message:
            "This invitation has expired or has already been used.",
        },
        { status: 410 }
      );
    }

    return NextResponse.json({
      valid: true,
      email: invitation.email,
      expiresAt: invitation.expiresAt,
    });
  } catch (error) {
    console.error(
      "VERIFY INVITATION ERROR:",
      error
    );

    return NextResponse.json(
      {
        valid: false,
        message: "Failed to verify invitation",
      },
      { status: 500 }
    );
  }
}