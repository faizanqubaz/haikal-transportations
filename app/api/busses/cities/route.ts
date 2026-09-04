import { connectDB } from "@/libs/mongodb";
import Bus from "@/models/Bus";
import { NextResponse } from "next/server";


// GET /api/buses/cities
// Returns the deduplicated, sorted list of every pickup + dropoff city
// currently in the collection, for populating the search dropdowns.
export async function GET() {
  try {
    await connectDB();

    const [pickups, dropoffs] = await Promise.all([
      Bus.distinct("pickup"),
      Bus.distinct("dropoff"),
    ]);

    const cities = Array.from(new Set([...pickups, ...dropoffs])).sort();

    return NextResponse.json({ cities });
  } catch (err) {
    console.error("GET /api/buses/cities failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch cities" },
      { status: 500 }
    );
  }
}