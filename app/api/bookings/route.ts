import mongoose from "mongoose";
import { connectDB } from "@/libs/mongodb";
import Booking from "@/models/Booking";
import Bus from "@/models/Bus";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await mongoose.startSession();

  try {
    await connectDB();

    const body = await req.json();

    const {
      passenger,
      busId,
      seats,
    } = body;

    console.log("BOOKING REQUEST:", body);

    // ============================================
    // VALIDATION
    // ============================================

    if (
      !passenger?.name ||
      !passenger?.email ||
      !passenger?.phone
    ) {
      return NextResponse.json(
        {
          error:
            "Passenger name, email and phone are required",
        },
        { status: 400 }
      );
    }

    if (!busId) {
      return NextResponse.json(
        {
          error: "Bus ID is required",
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(seats) || seats.length === 0) {
      return NextResponse.json(
        {
          error: "Please select at least one seat",
        },
        { status: 400 }
      );
    }

    const selectedSeats = [
      ...new Set(seats.map((seat) => String(seat).trim())),
    ];

    let createdBooking: any = null;

    // ============================================
    // TRANSACTION
    // ============================================

    await session.withTransaction(async () => {
      // --------------------------------------------
      // FIND BUS
      // --------------------------------------------

      const bus = await Bus.findById(busId).session(session);

      if (!bus) {
        throw new Error("BUS_NOT_FOUND");
      }

      console.log(
        "BUS SEATS:",
        bus.seats.map((seat) => ({
          seatNumber: seat.seatNumber,
          status: seat.status,
        }))
      );

      // --------------------------------------------
      // CHECK SEATS
      // --------------------------------------------

      const unavailableSeats: string[] = [];

      for (const seatNumber of selectedSeats) {
        const seat = bus.seats.find(
          (s) =>
            String(s.seatNumber).trim() === seatNumber
        );

        console.log("CHECKING SEAT:", {
          requested: seatNumber,
          found: seat?.seatNumber,
          status: seat?.status,
        });

        if (!seat || seat.status !== "available") {
          unavailableSeats.push(seatNumber);
        }
      }

      if (unavailableSeats.length > 0) {
        const error: any = new Error(
          "SEATS_UNAVAILABLE"
        );

        error.unavailableSeats = unavailableSeats;

        throw error;
      }

      // --------------------------------------------
      // MARK SEATS AS PENDING
      // --------------------------------------------

      bus.seats.forEach((seat) => {
        if (selectedSeats.includes(seat.seatNumber)) {
          seat.status = "pending";
        }
      });

      await bus.save({ session });

      // --------------------------------------------
      // TRAVEL DATE
      // --------------------------------------------

      const travelDate = new Date(
        `${bus.date}T00:00:00`
      );

      if (Number.isNaN(travelDate.getTime())) {
        throw new Error("INVALID_TRAVEL_DATE");
      }

      // --------------------------------------------
      // BOOKING REFERENCE
      // --------------------------------------------

      const bookingRef = `BK-${Date.now()
        .toString()
        .slice(-8)}`;

      // --------------------------------------------
      // CREATE BOOKING
      // --------------------------------------------

      const bookings = await Booking.create(
        [
          {
            bookingRef,

            passengerName: passenger.name,
            passengerEmail: passenger.email,
            passengerPhone: passenger.phone,

            route:
              bus.route ||
              `${bus.pickup} → ${bus.dropoff}`,

            bus: bus._id,

            seats: selectedSeats,

            travelDate,

            travelTime: bus.departure,

            status: "pending",

            emailSent: false,
            whatsappSent: false,
          },
        ],
        { session }
      );

      createdBooking = bookings[0];

      console.log(
        "BOOKING CREATED INSIDE TRANSACTION:",
        createdBooking._id
      );
    });

    // ============================================
    // SUCCESS
    // ============================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Your booking request has been submitted and is pending approval.",

        booking: {
          _id: createdBooking._id,
          bookingRef: createdBooking.bookingRef,
          status: createdBooking.status,
          seats: createdBooking.seats,
          travelDate: createdBooking.travelDate,
          travelTime: createdBooking.travelTime,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error(
      "BOOKING_CREATE_ERROR:",
      error
    );

    // ============================================
    // SEATS UNAVAILABLE
    // ============================================

    if (error.message === "SEATS_UNAVAILABLE") {
      return NextResponse.json(
        {
          error:
            "Some selected seats are no longer available",
          unavailableSeats:
            error.unavailableSeats || [],
        },
        { status: 409 }
      );
    }

    // ============================================
    // BUS NOT FOUND
    // ============================================

    if (error.message === "BUS_NOT_FOUND") {
      return NextResponse.json(
        {
          error: "Bus not found",
        },
        { status: 404 }
      );
    }

    // ============================================
    // INVALID DATE
    // ============================================

    if (error.message === "INVALID_TRAVEL_DATE") {
      return NextResponse.json(
        {
          error: "Invalid bus travel date",
        },
        { status: 400 }
      );
    }

    // ============================================
    // GENERAL ERROR
    // ============================================

    return NextResponse.json(
      {
        error:
          "Something went wrong while creating your booking",
        details:
          process.env.NODE_ENV === "development"
            ? error.message
            : undefined,
      },
      { status: 500 }
    );
  } finally {
    await session.endSession();
  }
}