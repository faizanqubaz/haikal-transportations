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

    if (!mongoose.Types.ObjectId.isValid(busId)) {
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

    const { searchParams } = new URL(request.url);

    const page = Math.max(
      1,
      Number(searchParams.get("page")) || 1
    );

    const wantsAll =
      searchParams.get("all") === "true";

    const requestedLimit =
      Number(searchParams.get("limit")) || 10;

    const limit = wantsAll
      ? Math.min(
          2000,
          Math.max(1, requestedLimit)
        )
      : Math.min(
          50,
          Math.max(1, requestedLimit)
        );

    const search =
      searchParams.get("search")?.trim() || "";

    const skip = wantsAll
      ? 0
      : (page - 1) * limit;

    // ============================================================
    // GET BUS
    // ============================================================

    const bus = await Bus.findById(busId).lean();

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
    // BOOKING QUERY
    //
    // IMPORTANT:
    // We ONLY use bus ID here.
    //
    // We DO NOT filter by today's date.
    //
    // This means:
    // - Today's bus works
    // - Tomorrow's bus works
    // - Next week's bus works
    // - Any future trip works
    // ============================================================

    const bookingQuery: any = {
      bus: new mongoose.Types.ObjectId(busId),

      status: {
        $in: [
          "pending",
          "confirmed",
          "approved",
        ],
      },
    };

    // ============================================================
    // SEARCH
    // ============================================================

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
          passengerCnic: {
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

    let bookings;
    let totalBookings;

    if (wantsAll) {
      // Print all passengers for this bus/trip

      [bookings, totalBookings] =
        await Promise.all([
          Booking.find(bookingQuery)
            .sort({
              createdAt: -1,
            })
            .lean(),

          Booking.countDocuments(
            bookingQuery
          ),
        ]);
    } else {
      // Normal pagination

      [bookings, totalBookings] =
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
    }

    // ============================================================
    // BUS SEAT INFORMATION
    // ============================================================

    const capacity = Array.isArray(bus.seats)
      ? bus.seats.length
      : 0;

    const availableSeats = Array.isArray(
      bus.seats
    )
      ? bus.seats.filter(
          (seat: any) =>
            seat.status === "available"
        ).length
      : 0;

    const pendingSeats = Array.isArray(
      bus.seats
    )
      ? bus.seats.filter(
          (seat: any) =>
            seat.status === "pending"
        ).length
      : 0;

    const bookedSeats = Array.isArray(
      bus.seats
    )
      ? bus.seats.filter(
          (seat: any) =>
            seat.status === "booked"
        ).length
      : 0;

    // ============================================================
    // PAGINATION
    // ============================================================

    const totalPages = wantsAll
      ? 1
      : Math.ceil(
          totalBookings / limit
        );

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
          bus.date || "-",

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
        page: wantsAll ? 1 : page,

        limit: wantsAll
          ? totalBookings
          : limit,

        totalBookings,

        totalPages,

        hasNextPage:
          !wantsAll &&
          page < totalPages,

        hasPreviousPage:
          !wantsAll &&
          page > 1,
      },

      search,
    });
  } catch (error) {
    console.error(
      "TRIP DETAILS ERROR:",
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