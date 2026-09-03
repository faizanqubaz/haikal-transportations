import { NextRequest, NextResponse } from "next/server";


import Bus from "@/models/Bus";
import type { BusAvailability } from "@/libs/availability";
import { connectDB } from "@/libs/mongodb";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pickup, dropoff, date } = body as {
      pickup: string;
      dropoff: string;
      date: string;
    };

    if (!pickup || !dropoff || !date) {
      return NextResponse.json(
        { error: "pickup, dropoff and date are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const buses = await Bus.find({
      pickup: { $regex: pickup, $options: "i" },
      dropoff: { $regex: dropoff, $options: "i" },
      date,
    }).lean();

    const results = buses.map((bus: any) => ({
      id: bus._id.toString(),
      busNumber: bus.busNumber,
      company: bus.company,
      driverPhone: bus.driverPhone,
      route: bus.route,
      pickup: bus.pickup,
      dropoff: bus.dropoff,
      departure: bus.departure,
      arrival: bus.arrival,
      duration: bus.duration,
      price: bus.price,
      image: bus.image,
      seats: bus.seats,
      availableSeats: bus.seats.filter(
        (s: any) => s.status === "available"
      ).length,
    }));

    return NextResponse.json({ results });
  } catch (err) {
    console.error("AVAILABILITY_SEARCH_ERROR:", err);
    return NextResponse.json(
      { error: "Something went wrong while searching availability" },
      { status: 500 }
    );
  }
}