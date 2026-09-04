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
const EDITABLE_FIELDS = [
  "passengerName",
  "passengerEmail",
  "passengerPhone",
  "route",
  "seats",
  "travelDate",
  "travelTime",
  "status",
] as const;




export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
 
    const { id } = await params;
 
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid booking id" },
        { status: 400 }
      );
    }
 
    const booking = await Booking.findById(id)
      .populate("bus", "busNumber")
      .populate("driver", "name")
      .lean();
 
    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }
 
    return NextResponse.json({ booking });
  } catch (err) {
    console.error("GET /api/bookings/[id] failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 }
    );
  }
}
 

// DELETE /api/bookings/[id] — permanently remove a booking
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid booking id" },
        { status: 400 }
      );
    }

    // First find the booking
    const booking = await Booking.findById(id);

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Get the bus associated with this booking
    const bus = await Bus.findById(booking.bus);

    if (!bus) {
      return NextResponse.json(
        { error: "Associated bus not found" },
        { status: 404 }
      );
    }

    // Release the seats
    const bookingSeats = booking.seats.map((seat: any) =>
      String(seat).trim()
    );

    bus.seats.forEach((seat: any) => {
      const seatNumber = String(seat.seatNumber).trim();

      if (bookingSeats.includes(seatNumber)) {
        seat.status = "available";
      }
    });

    // Save updated bus
    await bus.save();

    // Now delete booking
    await Booking.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Booking deleted and seats released successfully",
      releasedSeats: bookingSeats,
    });
  } catch (err) {
    console.error("DELETE /api/bookings/[id] failed:", err);

    return NextResponse.json(
      {
        error: "Failed to delete booking",
      },
      { status: 500 }
    );
  }
}
 
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid booking id" },
        { status: 400 }
      );
    }

    const body = await req.json();

    // -----------------------------------------
    // VALIDATE STATUS
    // -----------------------------------------

    if (
      body.status &&
      !["pending", "approved", "rejected"].includes(body.status)
    ) {
      return NextResponse.json(
        {
          error: "Invalid status value",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // FIND BOOKING
    // -----------------------------------------

    const booking = await Booking.findById(id);

    if (!booking) {
      return NextResponse.json(
        {
          error: "Booking not found",
        },
        { status: 404 }
      );
    }

    // -----------------------------------------
    // FIND BUS
    // -----------------------------------------

    const bus = await Bus.findById(booking.bus);

    if (!bus) {
      return NextResponse.json(
        {
          error: "Associated bus not found",
        },
        { status: 404 }
      );
    }

    // -----------------------------------------
    // STATUS CHANGE
    // -----------------------------------------

    if (body.status) {
      const newStatus = body.status;

      const bookingSeats = booking.seats.map((seat: any) =>
        String(seat).trim()
      );

      // ================================
      // APPROVED
      // ================================

      if (newStatus === "approved") {
        // Make sure seats exist
        for (const seatNumber of bookingSeats) {
          const seat = bus.seats.find(
            (s: any) =>
              String(s.seatNumber).trim() === seatNumber
          );

          if (!seat) {
            return NextResponse.json(
              {
                error: `Seat ${seatNumber} not found on bus`,
              },
              { status: 409 }
            );
          }

          // Don't allow another booking to take it
          if (
            seat.status !== "pending" &&
            seat.status !== "booked"
          ) {
            return NextResponse.json(
              {
                error: `Seat ${seatNumber} is not available`,
              },
              { status: 409 }
            );
          }
        }

        // pending → booked
        bus.seats.forEach((seat: any) => {
          const seatNumber = String(
            seat.seatNumber
          ).trim();

          if (bookingSeats.includes(seatNumber)) {
            seat.status = "booked";
          }
        });

        await bus.save();
      }

      // ================================
      // REJECTED
      // ================================

      if (newStatus === "rejected") {
        // Release seats
        bus.seats.forEach((seat: any) => {
          const seatNumber = String(
            seat.seatNumber
          ).trim();

          if (bookingSeats.includes(seatNumber)) {
            seat.status = "available";
          }
        });

        await bus.save();
      }

      // ================================
      // PENDING
      // ================================

      if (newStatus === "pending") {
        bus.seats.forEach((seat: any) => {
          const seatNumber = String(
            seat.seatNumber
          ).trim();

          if (bookingSeats.includes(seatNumber)) {
            seat.status = "pending";
          }
        });

        await bus.save();
      }

      booking.status = newStatus;
    }

    // -----------------------------------------
    // OTHER EDITABLE FIELDS
    // -----------------------------------------

    for (const field of EDITABLE_FIELDS) {
      if (
        field !== "status" &&
        body[field] !== undefined
      ) {
        (booking as any)[field] = body[field];
      }
    }

    await booking.save();

    // -----------------------------------------
    // RETURN UPDATED BOOKING
    // -----------------------------------------

    const updatedBooking = await Booking.findById(id)
      .populate("bus", "busNumber")
      .populate("driver", "name")
      .lean();

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
    });
  } catch (err) {
    console.error(
      "PATCH /api/bookings/[id] failed:",
      err
    );

    return NextResponse.json(
      {
        error: "Failed to update booking",
        details:
          process.env.NODE_ENV === "development"
            ? err instanceof Error
              ? err.message
              : String(err)
            : undefined,
      },
      { status: 500 }
    );
  }
}