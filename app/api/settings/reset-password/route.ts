
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { cookies } from "next/headers";

import Admin from "@/models/Admin";

import { connectDB } from "@/libs/mongodb";

export async function POST(request: Request) {
  try {
    // ============================================================
    // GET ADMIN TOKEN FROM COOKIE
    // ============================================================


    // ============================================================
    // REQUEST BODY
    // ============================================================

    const body = await request.json();

    const {
      adminId,
      newPassword,
    } = body;

    // ============================================================
    // VALIDATION
    // ============================================================

    if (!adminId) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!newPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "New password is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid admin ID.",
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
          message: "Password must be a string.",
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
          message: "Password must be at least 6 characters.",
        },
        {
          status: 400,
        }
      );
    }

    // ============================================================
    // PREVENT RESETTING OWN PASSWORD
    // ============================================================



    // ============================================================
    // DATABASE
    // ============================================================

    await connectDB();

    // ============================================================
    // FIND ADMIN
    // ============================================================

    const admin = await Admin.findById(adminId);

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: "Administrator not found.",
        },
        {
          status: 404,
        }
      );
    }

    // ============================================================
    // PREVENT RESETTING SUPER ADMIN PASSWORD
    // ============================================================

    if (admin.role === "superadmin") {
      return NextResponse.json(
        {
          success: false,
          message: "A Super Admin password cannot be reset here.",
        },
        {
          status: 403,
        }
      );
    }

    // ============================================================
    // HASH NEW PASSWORD
    // ============================================================

    const passwordHash = await bcrypt.hash(newPassword, 12);

    // ============================================================
    // UPDATE PASSWORD
    // ============================================================

    admin.passwordHash = passwordHash;

    await admin.save();

    // ============================================================
    // SUCCESS
    // ============================================================

    return NextResponse.json(
      {
        success: true,
        message: `Password for ${admin.username} was reset successfully.`,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to reset administrator password.",
      },
      {
        status: 500,
      }
    );
  }
}

