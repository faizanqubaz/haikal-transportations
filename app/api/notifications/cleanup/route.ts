
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import Notification from "@/models/Notification";

export async function GET(request: NextRequest) {
  try {
    // Protect this endpoint
    const authHeader = request.headers.get("authorization");

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    await connectDB();

    // Delete only notifications that have been read
    const result = await Notification.deleteMany({
      read: true,
    });

    console.log(
      `Notification cleanup: ${result.deletedCount} notifications deleted`
    );

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("NOTIFICATION CLEANUP ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to clean up notifications",
      },
      { status: 500 }
    );
  }
}

