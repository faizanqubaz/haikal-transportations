import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import Notification from "@/models/Notification";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  req: NextRequest,
  { params }: Params
) {
  try {
    await connectDB();

    const { id } = await params;

    const notification =
      await Notification.findByIdAndUpdate(
        id,
        {
          read: true,
        },
        {
          new: true,
        }
      );

    if (!notification) {
      return NextResponse.json(
        {
          success: false,
          error: "Notification not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error(
      "MARK NOTIFICATION READ ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to update notification",
      },
      { status: 500 }
    );
  }
}