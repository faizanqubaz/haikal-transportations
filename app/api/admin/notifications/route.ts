import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import Notification from "@/models/Notification";

export async function GET() {
  try {
    await connectDB();

    const notifications = await Notification.find({
      read: false,
    })
      .populate({
        path: "bookingId",
        populate: {
          path: "bus",
          select: "busNumber route pickup dropoff date departure",
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error("GET NOTIFICATIONS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to fetch notifications",
      },
      { status: 500 }
    );
  }
}