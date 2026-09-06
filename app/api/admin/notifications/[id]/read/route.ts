
import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/libs/mongodb";
import Notification from "@/models/Notification";

type Params = {
  params: Promise<{
    id: string;
  }>;
};


export async function POST(
  req: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params;

    await connectDB();

    const notification = await Notification.findById(id);
console.log('notification',notification)
    if (!notification) {
      return NextResponse.json(
        {
          success: false,
          error: "Notification not found",
        },
        { status: 404 }
      );
    }

    /*
     * Step 1:
     * Mark notification as read.
     */
    notification.read = true;

    await notification.save();

    /*
     * Step 2:
     * Delete it after it has been marked as read.
     */
   
    await Notification.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Notification marked as read and deleted",
    });
  } catch (error) {
    console.error(
      "Failed to mark notification as read:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to process notification",
      },
      { status: 500 }
    );
  }
}

