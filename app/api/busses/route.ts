import { NextRequest, NextResponse } from "next/server";
import Bus from "@/models/Bus";
import { connectDB } from "@/libs/mongodb";

export async function GET() {
  try {
    await connectDB();

    const buses = await Bus.find({})
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ buses });
  } catch (error) {
    console.error("GET_BUSES_ERROR:", error);

    return NextResponse.json(
      { error: "Failed to fetch buses" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log("ADMIN BUS BODY:", body);

    const {
      busNumber,
      company,
      driverPhone,
      route,
      pickup,
      dropoff,
      date,
      departure,
      arrival,
      duration,
      price,
      capacity,
    } = body;

    // Validate required fields
    if (!busNumber) {
      return NextResponse.json(
        { error: "Bus number is required" },
        { status: 400 }
      );
    }

    if (!company) {
      return NextResponse.json(
        { error: "Company is required" },
        { status: 400 }
      );
    }

    if (!pickup) {
      return NextResponse.json(
        { error: "Pickup is required" },
        { status: 400 }
      );
    }

    if (!dropoff) {
      return NextResponse.json(
        { error: "Dropoff is required" },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { error: "Date is required" },
        { status: 400 }
      );
    }

    if (!departure) {
      return NextResponse.json(
        { error: "Departure time is required" },
        { status: 400 }
      );
    }

    if (!arrival) {
      return NextResponse.json(
        { error: "Arrival time is required" },
        { status: 400 }
      );
    }

    if (!duration) {
      return NextResponse.json(
        { error: "Duration is required" },
        { status: 400 }
      );
    }

    if (price === undefined || price === "") {
      return NextResponse.json(
        { error: "Price is required" },
        { status: 400 }
      );
    }

    if (!capacity || Number(capacity) < 1) {
      return NextResponse.json(
        { error: "Seat capacity is required" },
        { status: 400 }
      );
    }

    await connectDB();

    /*
     * Generate seats automatically.
     *
     * Example:
     * capacity = 40
     *
     * Creates:
     * 1 available
     * 2 available
     * ...
     * 40 available
     */
    const seats = Array.from(
      { length: Number(capacity) },
      (_, index) => ({
        seatNumber: String(index + 1),
        status: "available" as const,
      })
    );

    /*
     * Create the complete Bus document.
     */
    const bus = await Bus.create({
      busNumber: busNumber.trim(),

      company: company.trim(),

      driverPhone:
        driverPhone?.trim() || undefined,

      route:
        route?.trim() ||
        `${pickup.trim()} → ${dropoff.trim()}`,

      pickup: pickup.trim(),

      dropoff: dropoff.trim(),

      date,

      departure,

      arrival,

      duration: duration.trim(),

      price: Number(price),

      seats,
    });

    console.log("BUS CREATED:", bus);

    return NextResponse.json(
      {
        success: true,
        message: "Bus added successfully",
        bus,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST_BUS_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Failed to add bus",
      },
      { status: 500 }
    );
  }
}