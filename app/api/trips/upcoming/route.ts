import { NextResponse } from "next/server";

import Booking from "@/models/Booking";
import Bus from "@/models/Bus";
import { connectDB } from "@/libs/mongodb";

// Groups today's confirmed bookings by bus so the dashboard can show
// "Upcoming Trips" with a live seats-filled count.
export async function GET() {
  await connectDB();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const grouped = await Booking.aggregate([
    {
      $match: {
        status: "confirmed",
        travelDate: { $gte: startOfDay, $lte: endOfDay },
      },
    },
    {
      $group: {
        _id: "$bus",
        route: { $first: "$route" },
        travelTime: { $first: "$travelTime" },
        bookedSeats: { $sum: 1 },
      },
    },
    { $sort: { travelTime: 1 } },
    { $limit: 5 },
  ]);

  const busIds = grouped.map((g) => g._id).filter(Boolean);
  const buses = await Bus.find({ _id: { $in: busIds } });
  const busMap = new Map(buses.map((b) => [b._id.toString(), b]));

  const trips = grouped.map((g) => {
    const bus = g._id ? busMap.get(g._id.toString()) : null;
    return {
      busNumber: bus?.busNumber || "Unassigned",
      route: g.route,
      departure: g.travelTime || "-",
      bookedSeats: g.bookedSeats,
      capacity: bus?.capacity || 40,
    };
  });

  return NextResponse.json({ trips });
}
