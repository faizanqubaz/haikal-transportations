
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/libs/mongodb";
import Bus from "@/models/Bus";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    console.log("FETCHING BUS BY ID:", id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid bus ID" },
        { status: 400 }
      );
    }

    const bus = await Bus.findById(id).lean();

    if (!bus) {
      return NextResponse.json(
        { error: "Bus not found" },
        { status: 404 }
      );
    }

    const result = {
      id: bus._id.toString(),
      busNumber: bus.busNumber,
      company: bus.company,
      driverPhone: bus.driverPhone,

      route: bus.route,
      pickup: bus.pickup,
      dropoff: bus.dropoff,

      date: bus.date,

      departure: bus.departure,
      arrival: bus.arrival,
      duration: bus.duration,

      price: bus.price,
      image: bus.image,

      seats: bus.seats,

      availableSeats: bus.seats.filter(
        (seat: any) => seat.status === "available"
      ).length,
    };

    console.log("BUS FOUND:", {
      id: result.id,
      busNumber: result.busNumber,
      seats: result.seats,
    });

    return NextResponse.json({
      bus: result,
    });
  } catch (error) {
    console.error("GET_BUS_BY_ID_ERROR:", error);

    return NextResponse.json(
      { error: "Failed to fetch bus" },
      { status: 500 }
    );
  }
}

