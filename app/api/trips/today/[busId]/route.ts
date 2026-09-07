import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/libs/mongodb";
import Bus from "@/models/Bus";
import Booking from "@/models/Booking";

type Params = {
  params: Promise<{
    busId: string;
  }>;
};

export async function GET(
  request: NextRequest,
  { params }: Params
) {
  try {
    await connectDB();

    const { busId } = await params;

    // ============================================================
    // VALIDATE BUS ID
    // ============================================================

    if (
      !mongoose.Types.ObjectId.isValid(busId)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid bus ID",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // QUERY PARAMETERS
    // ============================================================

    const { searchParams } =
      new URL(request.url);

    const page = Math.max(
      1,
      Number(searchParams.get("page")) || 1
    );

    const limit = Math.min(
      50,
      Math.max(
        1,
        Number(searchParams.get("limit")) || 10
      )
    );

    const search =
      searchParams.get("search")?.trim() || "";

    const skip = (page - 1) * limit;

    // ============================================================
    // TODAY
    // ============================================================

    const today = new Date();

    const todayString = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // ============================================================
    // GET BUS
    // ============================================================

    const bus = await Bus.findById(busId)
      .lean();

    if (!bus) {
      return NextResponse.json(
        {
          success: false,
          message: "Bus not found",
        },
        { status: 404 }
      );
    }

    // ============================================================
    // SEARCH
    // ============================================================

    const bookingQuery: any = {
      bus: new mongoose.Types.ObjectId(busId),

      travelDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },

      status: {
        $in: [
          "pending",
          "confirmed",
          "approved",
        ],
      },
    };

    if (search) {
      bookingQuery.$or = [
        {
          passengerName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          passengerEmail: {
            $regex: search,
            $options: "i",
          },
        },
        {
          passengerPhone: {
            $regex: search,
            $options: "i",
          },
        },
        {
          bookingRef: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // ============================================================
    // GET BOOKINGS + COUNT
    // ============================================================

    const [bookings, totalBookings] =
      await Promise.all([
        Booking.find(bookingQuery)
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit)
          .lean(),

        Booking.countDocuments(
          bookingQuery
        ),
      ]);

    // ============================================================
    // BUS SEAT INFORMATION
    // ============================================================

    const capacity = Array.isArray(
      bus.seats
    )
      ? bus.seats.length
      : 0;

    const availableSeats =
      Array.isArray(bus.seats)
        ? bus.seats.filter(
            (seat: any) =>
              seat.status ===
              "available"
          ).length
        : 0;

    const pendingSeats =
      Array.isArray(bus.seats)
        ? bus.seats.filter(
            (seat: any) =>
              seat.status ===
              "pending"
          ).length
        : 0;

    const bookedSeats =
      Array.isArray(bus.seats)
        ? bus.seats.filter(
            (seat: any) =>
              seat.status ===
              "booked"
          ).length
        : 0;

    // ============================================================
    // RESPONSE
    // ============================================================

    return NextResponse.json({
      success: true,

      bus: {
        id: bus._id.toString(),

        busNumber:
          bus.busNumber || "-",

        company:
          bus.company || "-",

        pickup:
          bus.pickup || "-",

        dropoff:
          bus.dropoff || "-",

        route:
          bus.route ||
          `${bus.pickup || "-"} → ${
            bus.dropoff || "-"
          }`,

        date:
          bus.date || todayString,

        departure:
          bus.departure || "-",

        arrival:
          bus.arrival || "-",

        duration:
          bus.duration || "-",

        price:
          bus.price || 0,

        capacity,

        availableSeats,

        pendingSeats,

        bookedSeats,
      },

      bookings,

      pagination: {
        page,
        limit,

        totalBookings,

        totalPages: Math.ceil(
          totalBookings / limit
        ),

        hasNextPage:
          page <
          Math.ceil(
            totalBookings / limit
          ),

        hasPreviousPage:
          page > 1,
      },

      search,
    });
  } catch (error) {
    console.error(
      "TODAY TRIP DETAILS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch trip details",
      },
      { status: 500 }
    );
  }
}