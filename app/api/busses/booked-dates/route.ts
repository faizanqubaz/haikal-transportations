import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/libs/mongodb";
import Bus from "@/models/Bus";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const pickup = searchParams.get("pickup")?.trim();
    const dropoff = searchParams.get("dropoff")?.trim();

    if (!pickup || !dropoff) {
      return NextResponse.json(
        {
          success: false,
          message: "Pickup and dropoff are required",
          bookedDates: [],
        },
        { status: 400 }
      );
    }

    // Escape special regex characters
    const escapeRegex = (value: string) =>
      value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Case-insensitive exact matching
    const pickupRegex = new RegExp(
      `^${escapeRegex(pickup)}$`,
      "i"
    );

    const dropoffRegex = new RegExp(
      `^${escapeRegex(dropoff)}$`,
      "i"
    );

    console.log("BOOKED DATES REQUEST:", {
      pickup,
      dropoff,
    });

    const buses = await Bus.find({
      pickup: pickupRegex,
      dropoff: dropoffRegex,
    })
      .select("date seats")
      .lean();

    console.log("BUSES FOUND:", buses.length);

    // Group buses by date
    const busesByDate = new Map<
      string,
      typeof buses
    >();

    for (const bus of buses) {
      if (!bus.date) continue;

      if (!busesByDate.has(bus.date)) {
        busesByDate.set(bus.date, []);
      }

      busesByDate.get(bus.date)!.push(bus);
    }

    const bookedDates: string[] = [];

    for (const [date, dateBuses] of busesByDate.entries()) {
      /*
       * A date is FULLY BOOKED only when
       * every bus on that route has zero available seats.
       *
       * pending = unavailable
       * booked  = unavailable
       * available = available
       */

      const hasAvailableSeat = dateBuses.some((bus) =>
        bus.seats?.some(
          (seat) => seat.status === "available"
        )
      );

      if (!hasAvailableSeat) {
        bookedDates.push(date);
      }
    }

    console.log("FULLY BOOKED DATES:", bookedDates);

    return NextResponse.json({
      success: true,
      pickup,
      dropoff,
      bookedDates,
    });
  } catch (error) {
    console.error("BOOKED DATES API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to get booked dates",
        bookedDates: [],
      },
      { status: 500 }
    );
  }
}