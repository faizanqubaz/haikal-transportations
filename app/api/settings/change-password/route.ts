import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import Admin from "@/models/Admin";
import { connectDB } from "@/libs/mongodb";

export async function POST(request: Request) {
  try {
    // ============================================================
    // GET ADMIN TOKEN
    // ============================================================

    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Admin token not found.",
        },
        {
          status: 401,
        }
      );
    }

    // ============================================================
    // VERIFY TOKEN
    // ============================================================

    let decoded: any;

    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      );
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Invalid or expired admin token.",
        },
        {
          status: 401,
        }
      );
    }

    // ============================================================
    // GET ADMIN ID FROM TOKEN
    // ============================================================

    const adminId =
      decoded?.adminId ||
      decoded?.id ||
      decoded?._id ||
      decoded?.userId;

    if (!adminId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Admin information not found in token.",
        },
        {
          status: 401,
        }
      );
    }

    // ============================================================
    // REQUEST BODY
    // ============================================================

    const body = await request.json();

    const { currentPassword, newPassword } = body;

    // ============================================================
    // VALIDATION
    // ============================================================

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Current password and new password are required.",
        },
        {
          status: 400,
        }
      );
    }

    if (typeof currentPassword !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Current password must be a string.",
        },
        {
          status: 400,
        }
      );
    }

    if (typeof newPassword !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "New password must be a string.",
        },
        {
          status: 400,
        }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "New password must be at least 6 characters.",
        },
        {
          status: 400,
        }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        {
          success: false,
          message:
            "New password must be different from your current password.",
        },
        {
          status: 400,
        }
      );
    }

    // ============================================================
    // DATABASE
    // ============================================================

    await connectDB();

    // ============================================================
    // GET CURRENT ADMIN
    // ============================================================

    const admin = await Admin.findById(adminId);

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin account not found.",
        },
        {
          status: 404,
        }
      );
    }

    // ============================================================
    // VERIFY CURRENT PASSWORD
    // ============================================================

    const passwordMatches = await bcrypt.compare(
      currentPassword,
      admin.passwordHash
    );

    if (!passwordMatches) {
      return NextResponse.json(
        {
          success: false,
          message: "Current password is incorrect.",
        },
        {
          status: 401,
        }
      );
    }

    // ============================================================
    // HASH NEW PASSWORD
    // ============================================================

    const passwordHash = await bcrypt.hash(newPassword, 12);

    // ============================================================
    // SAVE NEW PASSWORD
    // ============================================================

    admin.passwordHash = passwordHash;

    await admin.save();

    // ============================================================
    // SUCCESS
    // ============================================================

    return NextResponse.json(
      {
        success: true,
        message: "Your password has been changed successfully.",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to change password.",
      },
      {
        status: 500,
      }
    );
  }
}