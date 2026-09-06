import { sendBookingConfirmationEmail } from "@/libs/resend";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/libs/mongodb";
import Booking from "@/models/Booking";
import Bus from "@/models/Bus";
import Notification from "@/models/Notification";

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

// ============================================================
// GET /api/bookings/[id]
// ============================================================

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

// ============================================================
// DELETE /api/bookings/[id]
// ============================================================

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

    const booking = await Booking.findById(id);

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    const bus = await Bus.findById(booking.bus);

    if (!bus) {
      return NextResponse.json(
        { error: "Associated bus not found" },
        { status: 404 }
      );
    }

    const bookingSeats = booking.seats.map((seat: any) =>
      String(seat).trim()
    );

    bus.seats.forEach((seat: any) => {
      const seatNumber = String(seat.seatNumber).trim();

      if (bookingSeats.includes(seatNumber)) {
        seat.status = "available";
      }
    });

    await bus.save();
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



// ============================================================
// PATCH /api/bookings/[id]
// ============================================================

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

    // ========================================================
    // VALIDATE STATUS
    // ========================================================

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

    // ========================================================
    // FIND BOOKING
    // ========================================================

    const booking = await Booking.findById(id);

    if (!booking) {
      return NextResponse.json(
        {
          error: "Booking not found",
        },
        { status: 404 }
      );
    }

    // ========================================================
    // PREVENT DOUBLE-PROCESSING
    //
    // Blocks flipping an already-decided booking straight from
    // approved -> rejected (or vice versa) without going through
    // "pending" first, and stops a duplicate approve/reject click
    // from re-marking seats, re-sending the email, or trying to
    // delete a notification that's already gone.
    //
    // Re-submitting the SAME status (idempotent retry) is allowed,
    // and explicitly resetting to "pending" is always allowed.
    // ========================================================

    if (
      body.status &&
      body.status !== "pending" &&
      booking.status !== "pending" &&
      booking.status !== body.status
    ) {
      return NextResponse.json(
        { error: `Booking is already ${booking.status}` },
        { status: 409 }
      );
    }

    // ========================================================
    // FIND BUS
    // ========================================================

    const bus = await Bus.findById(booking.bus);
    console.log('bus', bus)
    if (!bus) {
      return NextResponse.json(
        {
          error: "Associated bus not found",
        },
        { status: 404 }
      );
    }

    // ========================================================
    // STATUS CHANGE
    // ========================================================

    const newStatus = body.status;
    console.log('statuschange', newStatus)

    if (newStatus) {

      const bookingSeats = booking.seats.map((seat: any) =>
        String(seat).trim()
      );

      // ======================================================
      // APPROVED
      // ======================================================

      if (newStatus === "approved") {
        // Make sure all requested seats exist
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

          // Seat must currently belong to this pending booking
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

        // ====================================================
        // Mark seats as booked
        // ====================================================

        bus.seats.forEach((seat: any) => {
          const seatNumber = String(
            seat.seatNumber
          ).trim();

          if (bookingSeats.includes(seatNumber)) {
            seat.status = "booked";
          }
        });

        await bus.save();

        console.log('booking2', booking)
        booking.emailSent = false;
        console.log('booking3', booking)
        booking.emailScheduledAt = new Date()
        console.log('booking4', booking)
        console.log(
          `EMAIL SCHEDULED FOR BOOKING ${booking.bookingRef}`,
          booking.emailScheduledAt
        );
      }

      // ======================================================
      // REJECTED
      // ======================================================

      if (newStatus === "rejected") {
        bus.seats.forEach((seat: any) => {
          const seatNumber = String(
            seat.seatNumber
          ).trim();

          if (bookingSeats.includes(seatNumber)) {
            seat.status = "available";
          }
        });

        await bus.save();

        // No confirmation email should be sent
        booking.emailScheduledAt = undefined;
      }

      // ======================================================
      // PENDING
      // ======================================================

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

        // Cancel any previously scheduled email
        booking.emailScheduledAt = undefined;
        booking.emailSent = false;
      }

      booking.status = newStatus;

      // ======================================================
      // NOTIFICATION CLEANUP
      //
      // Only approve/reject close out the notification — resetting
      // back to "pending" leaves it alone since there's nothing new
      // for the admin to review yet.
      // ======================================================

      if (newStatus === "approved" || newStatus === "rejected") {
        await Notification.updateMany(
          { bookingId: booking._id },
          { read: true }
        );
        await Notification.deleteMany({ bookingId: booking._id });
      }
    }

    // ========================================================
    // OTHER EDITABLE FIELDS
    // ========================================================

    for (const field of EDITABLE_FIELDS) {
      if (
        field !== "status" &&
        body[field] !== undefined
      ) {
        (booking as any)[field] = body[field];
      }
    }

    // ========================================================
    // SAVE BOOKING
    // ========================================================

    await booking.save();

    // ========================================================
    // RETURN UPDATED BOOKING
    // ========================================================

    const updatedBooking = await Booking.findById(id)
      .populate("bus", "busNumber")
      .populate("driver", "name")
      .lean();

    if (!updatedBooking) {
      return NextResponse.json(
        {
          error: "Booking was updated but could not be retrieved",
        },
        { status: 500 }
      );
    }

    // ========================================================
    // SEND CONFIRMATION EMAIL AFTER APPROVAL
    // ========================================================

    console.log('newStatus', newStatus)
    console.log('updatedBooking.passengerEmail', updatedBooking.passengerEmail)

    let emailSent = false;

    if (
      newStatus === "approved" &&
      updatedBooking.passengerEmail
    ) {
      try {
        await sendBookingConfirmationEmail({
          passengerName: updatedBooking.passengerName,
          passengerEmail: updatedBooking.passengerEmail,
          passengerPhone: updatedBooking.passengerPhone,
          bookingRef: updatedBooking.bookingRef,
          route: updatedBooking.route,
          travelDate: updatedBooking.travelDate,
          travelTime: updatedBooking.travelTime,
          seats: updatedBooking.seats || [],
          busNumber:
            typeof updatedBooking.bus === "object" &&
            updatedBooking.bus !== null
              ? (updatedBooking.bus as any).busNumber
              : undefined,
        });

        // Email successfully sent
        await Booking.findByIdAndUpdate(id, {
          emailSent: true,
        });

        emailSent = true;

        console.log(
          `BOOKING CONFIRMATION EMAIL SENT: ${updatedBooking.bookingRef}`
        );
      } catch (emailError) {
        console.error(
          `BOOKING CONFIRMATION EMAIL FAILED: ${updatedBooking.bookingRef}`,
          emailError
        );

        // Don't fail the booking approval just because email failed
        await Booking.findByIdAndUpdate(id, {
          emailSent: false,
        });
      }
    }

    // ========================================================
    // BUILD RESPONSE MESSAGE
    // ========================================================

    const messageByStatus: Record<string, string> = {
      approved: "Booking approved successfully",
      rejected: "Booking rejected successfully",
      pending: "Booking reset to pending",
    };

    return NextResponse.json({
      success: true,
      message: newStatus
        ? messageByStatus[newStatus] || "Booking updated successfully"
        : "Booking updated successfully",
      booking: updatedBooking,
      emailSent,
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