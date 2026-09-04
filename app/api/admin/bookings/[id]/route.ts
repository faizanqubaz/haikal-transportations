import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/libs/mongodb";
import Booking from "@/models/Booking";
import Bus from "@/models/Bus";
import Notification from "@/models/Notification";
type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  req: NextRequest,
  { params }: Params
) {
  const session = await mongoose.startSession();

  try {
    await connectDB();

    const { id } = await params;

    const body = await req.json();

    const { status } = body;

    // ============================================
    // VALIDATION
    // ============================================

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Status must be either approved or rejected",
        },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid booking ID",
        },
        { status: 400 }
      );
    }

    let updatedBooking: any = null;

    // ============================================
    // TRANSACTION
    // ============================================

    await session.withTransaction(async () => {
      // --------------------------------------------
      // FIND BOOKING
      // --------------------------------------------

      const booking = await Booking.findById(id).session(
        session
      );

      if (!booking) {
        throw new Error("BOOKING_NOT_FOUND");
      }

      // --------------------------------------------
      // PREVENT DOUBLE PROCESSING
      // --------------------------------------------

      if (booking.status !== "pending") {
        throw new Error("BOOKING_ALREADY_PROCESSED");
      }

      // --------------------------------------------
      // FIND BUS
      // --------------------------------------------

      const bus = await Bus.findById(booking.bus).session(
        session
      );

      if (!bus) {
        throw new Error("BUS_NOT_FOUND");
      }

      // ============================================
      // APPROVE BOOKING
      // ============================================

      if (status === "approved") {
        // Check seats are still pending
        for (const seatNumber of booking.seats) {
          const seat = bus.seats.find(
            (s) =>
              String(s.seatNumber).trim() ===
              String(seatNumber).trim()
          );

          if (!seat) {
            throw new Error("SEAT_NOT_FOUND");
          }

          if (seat.status !== "pending") {
            throw new Error("SEAT_NOT_PENDING");
          }
        }

        // Change pending → booked
        bus.seats.forEach((seat) => {
          if (
            booking.seats.includes(
              String(seat.seatNumber)
            )
          ) {
            seat.status = "booked";
          }
        });

        await bus.save({ session });

        booking.status = "approved";

        await booking.save({ session });
      }

      // ============================================
      // REJECT BOOKING
      // ============================================

      if (status === "rejected") {
        // Release seats
        bus.seats.forEach((seat) => {
          if (
            booking.seats.includes(
              String(seat.seatNumber)
            )
          ) {
            seat.status = "available";
          }
        });

        await bus.save({ session });

        booking.status = "rejected";

        await booking.save({ session });
      }

      updatedBooking = booking;

      // ============================================
      // MARK NOTIFICATION AS READ
      // ============================================

      await Notification.findOneAndUpdate(
        {
          bookingId: booking._id,
        },
        {
          read: true,
        },
        {
          session,
        }
      );
    });

    // ============================================
    // SUCCESS
    // ============================================

    return NextResponse.json({
      success: true,

      message:
        status === "approved"
          ? "Booking approved successfully"
          : "Booking rejected successfully",

      booking: {
        _id: updatedBooking._id,
        bookingRef: updatedBooking.bookingRef,
        status: updatedBooking.status,
        seats: updatedBooking.seats,
      },
    });
  } catch (error: any) {
    console.error(
      "ADMIN BOOKING UPDATE ERROR:",
      error
    );

    // ============================================
    // BOOKING NOT FOUND
    // ============================================

    if (error.message === "BOOKING_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,
          error: "Booking not found",
        },
        { status: 404 }
      );
    }

    // ============================================
    // ALREADY PROCESSED
    // ============================================

    if (
      error.message ===
      "BOOKING_ALREADY_PROCESSED"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This booking has already been processed",
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
          success: false,
          error: "Bus not found",
        },
        { status: 404 }
      );
    }

    // ============================================
    // SEAT NOT FOUND
    // ============================================

    if (error.message === "SEAT_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,
          error:
            "One or more booking seats no longer exist",
        },
        { status: 409 }
      );
    }

    // ============================================
    // SEAT NOT PENDING
    // ============================================

    if (error.message === "SEAT_NOT_PENDING") {
      return NextResponse.json(
        {
          success: false,
          error:
            "One or more seats are no longer pending",
        },
        { status: 409 }
      );
    }

    // ============================================
    // GENERAL ERROR
    // ============================================

    return NextResponse.json(
      {
        success: false,
        error:
          "Something went wrong while updating the booking",
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