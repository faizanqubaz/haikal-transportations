import { NextResponse } from "next/server";
import mongoose from "mongoose";


import Bus from "@/models/Bus";
import Booking from "@/models/Booking";
import { connectDB } from "@/libs/mongodb";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid bus/trip id",
        },
        { status: 400 }
      );
    }

    const bus = await Bus.findById(id).lean();

    if (!bus) {
      return NextResponse.json(
        {
          success: false,
          error: "Trip/bus not found",
        },
        { status: 404 }
      );
    }

    // Delete passenger bookings belonging to this bus.
    const bookingsResult = await Booking.deleteMany({
      bus: id,
    });

    // Delete the trip/bus.
    await Bus.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message:
        "Trip, bus and associated passenger bookings deleted successfully",
      deletedTripId: id,
      deletedBookings: bookingsResult.deletedCount ?? 0,
    });
  } catch (error) {
    console.error("DELETE /api/busses/[id] failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete trip and associated passengers",
      },
      { status: 500 }
    );
  }
}