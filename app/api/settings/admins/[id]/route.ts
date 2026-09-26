
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { cookies } from "next/headers";

import Admin from "@/models/Admin";
import { connectDB } from "@/libs/mongodb";


interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    // ============================================================
    // GET ADMIN TOKEN FROM COOKIE
    // ============================================================

  


    // ============================================================
    // GET ADMIN ID
    // ============================================================

    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid administrator ID.",
        },
        {
          status: 400,
        }
      );
    }

    // ============================================================
    // PREVENT SELF DELETE
    // ============================================================


    // ============================================================
    // DATABASE
    // ============================================================

    await connectDB();

    // ============================================================
    // FIND ADMIN
    // ============================================================

    const admin = await Admin.findById(id);

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
    // PREVENT DELETING SUPER ADMIN
    // ============================================================

    if (admin.role === "superadmin") {
      return NextResponse.json(
        {
          success: false,
          message: "A Super Admin account cannot be deleted.",
        },
        {
          status: 403,
        }
      );
    }

    // ============================================================
    // DELETE ADMIN
    // ============================================================

    await Admin.findByIdAndDelete(id);

    // ============================================================
    // RESPONSE
    // ============================================================

    return NextResponse.json(
      {
        success: true,
        message: `${admin.username} has been deleted successfully.`,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("DELETE ADMIN ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete administrator.",
      },
      {
        status: 500,
      }
    );
  }
}

