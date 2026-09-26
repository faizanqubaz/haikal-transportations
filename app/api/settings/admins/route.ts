
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import Admin from "@/models/Admin";
import { connectDB } from "@/libs/mongodb";


export async function GET() {
  try {


    // ===========================================================    // DATABASE
    // ============================================================

    await connectDB();

    // ============================================================
    // GET ADMINS
    // ============================================================

    const admins = await Admin.find({})
      .select("_id username role createdAt updatedAt")
      .sort({ createdAt: -1 })
      .lean();

    // ============================================================
    // RESPONSE
    // ============================================================

    return NextResponse.json(
      {
        success: true,
        admins,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("GET ADMINS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch administrators.",
      },
      {
        status: 500,
      }
    );
  }
}

