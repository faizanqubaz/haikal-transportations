import { NextResponse } from "next/server";

import Booking from "@/models/Booking";
import Bus from "@/models/Bus";
import { connectDB } from "@/libs/mongodb";

export async function GET() {
  await connectDB();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [totalBookings, todaysBookings, activeBuses, passengerCount] =
    await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ createdAt: { $gte: startOfDay } }),
      Bus.countDocuments({ status: "active" }),
      Booking.distinct("passengerEmail").then((arr) => arr.length),
    ]);

  return NextResponse.json({
    totalBookings,
    todaysBookings,
    activeBuses,
    passengerCount,
  });
}
