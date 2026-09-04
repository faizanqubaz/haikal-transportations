import { NextRequest, NextResponse } from "next/server";
import Bus from "@/models/Bus";
import { connectDB } from "@/libs/mongodb";

// export async function GET() {
//   try {
//     await connectDB();

//     const buses = await Bus.find({})
//       .sort({ createdAt: -1 })
//       .lean();

//     return NextResponse.json({ buses });
//   } catch (error) {
//     console.error("GET_BUSES_ERROR:", error);

//     return NextResponse.json(
//       { error: "Failed to fetch buses" },
//       { status: 500 }
//     );
//   }
// }

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





export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const pickup = searchParams.get("pickup")?.trim();
    const dropoff = searchParams.get("dropoff")?.trim();
    const date = searchParams.get("date")?.trim();
console
    console.log("========================================");
    console.log("BUS SEARCH REQUEST");
    console.log("Pickup:", pickup);
    console.log("Dropoff:", dropoff);
    console.log("Date:", date);
    console.log("========================================");

    /*
     * Build the MongoDB filter dynamically.
     *
     * IMPORTANT:
     * pickup and dropoff are separate fields.
     *
     * Hunza -> Karachi:
     * pickup  = Hunza
     * dropoff = Karachi
     *
     * Karachi -> Hunza:
     * pickup  = Karachi
     * dropoff = Hunza
     *
     * These are NOT interchangeable.
     */

    const filter: Record<string, unknown> = {};

    if (pickup) {
      filter.pickup = {
        $regex: `^${escapeRegex(pickup)}$`,
        $options: "i",
      };
    }

    if (dropoff) {
      filter.dropoff = {
        $regex: `^${escapeRegex(dropoff)}$`,
        $options: "i",
      };
    }

    if (date) {
      filter.date = date;
    }

    console.log("MONGO FILTER:", JSON.stringify(filter, null, 2));

    const buses = await Bus.find(filter)
      .sort({ departure: 1 })
      .lean();

    console.log("BUSES FOUND:", buses.length);

    buses.forEach((bus) => {
      console.log({
        id: bus._id.toString(),
        busNumber: bus.busNumber,
        pickup: bus.pickup,
        dropoff: bus.dropoff,
        date: bus.date,
        departure: bus.departure,
      });
    });

    /*
     * Convert MongoDB documents into client-safe objects.
     */

    const results = buses.map((bus) => ({
      _id: bus._id.toString(),

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

      seats: bus.seats ?? [],
    }));

    return NextResponse.json({
      buses: results,
      count: results.length,
    });
  } catch (error) {
    console.error("BUS_SEARCH_ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to search buses",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * Prevent regex special characters from
 * affecting the MongoDB search.
 */
function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}