
import { NextResponse } from "next/server";

import Booking from "@/models/Booking";
import Bus from "@/models/Bus";
import { connectDB } from "@/libs/mongodb";

export async function GET() {
  try {
    await connectDB();

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const [
      totalBookings,
      todaysBookings,
      totalBuses,
      passengerEmails,
      busSeatStats,
      todaysBookedSeatsResult,
    ] = await Promise.all([
      // Total bookings
      Booking.countDocuments(),

      // Bookings created today
      Booking.countDocuments({
        createdAt: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      }),

      // Total buses
      Bus.countDocuments(),

      // Unique passengers
      Booking.distinct("passengerEmail"),

      // Seat statistics from all buses
      Bus.aggregate([
        {
          $unwind: {
            path: "$seats",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $group: {
            _id: null,

            totalSeats: {
              $sum: 1,
            },

            availableSeats: {
              $sum: {
                $cond: [
                  { $eq: ["$seats.status", "available"] },
                  1,
                  0,
                ],
              },
            },

            pendingSeats: {
              $sum: {
                $cond: [
                  { $eq: ["$seats.status", "pending"] },
                  1,
                  0,
                ],
              },
            },

            bookedSeats: {
              $sum: {
                $cond: [
                  { $eq: ["$seats.status", "booked"] },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),

      // Number of seats booked in today's bookings
      Booking.aggregate([
        {
          $match: {
            createdAt: {
              $gte: startOfDay,
              $lte: endOfDay,
            },
          },
        },
        {
          $project: {
            seatCount: {
              $size: {
                $ifNull: ["$seats", []],
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$seatCount",
            },
          },
        },
      ]),
    ]);

    const seatStats = busSeatStats[0] || {};

    const totalSeats = seatStats.totalSeats ?? 0;
    const availableSeats = seatStats.availableSeats ?? 0;
    const pendingSeats = seatStats.pendingSeats ?? 0;
    const bookedSeats = seatStats.bookedSeats ?? 0;

    const todaysBookedSeats =
      todaysBookedSeatsResult[0]?.total ?? 0;

    return NextResponse.json({
      totalBookings,
      todaysBookings,

      totalBuses,

      totalSeats,
      availableSeats,
      pendingSeats,
      bookedSeats,

      todaysBookedSeats,

      passengerCount: passengerEmails.length,
    });
  } catch (error) {
    console.error("Dashboard statistics error:", error);

    return NextResponse.json(
      {
        message: "Failed to fetch dashboard statistics",
      },
      {
        status: 500,
      }
    );
  }
}

