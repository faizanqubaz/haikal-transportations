import mongoose from "mongoose";
import { connectDB } from "@/libs/mongodb";
import Booking from "@/models/Booking";
import Bus from "@/models/Bus";
import { NextRequest, NextResponse } from "next/server";
import Notification from "@/models/Notification";



export async function POST(req: NextRequest) {
  const session = await mongoose.startSession();

  try {
    await connectDB();

    const body = await req.json();
console.log('body for form',body)
    const {
      passenger,
      busId,
      seats,
      discount,
    } = body;

    console.log("BOOKING REQUEST:", body);

    // ============================================================
    // PASSENGER VALIDATION
    // ============================================================

    if (
      !passenger?.name ||
      !passenger?.email ||
      !passenger?.phone ||
      !passenger?.cnic ||
      !passenger?.gender
    ) {
      return NextResponse.json(
        {
          error:
            "Passenger name, email, CNIC, gender and phone are required",
        },
        { status: 400 }
      );
    }

    const name = String(passenger.name).trim();
    const email = String(passenger.email).trim().toLowerCase();
    const phone = String(passenger.phone).trim();

    // ============================================================
    // CNIC
    // Format: 42000-6210664-1
    // ============================================================

    const passengerCnic = String(passenger.cnic).trim();
console.log(
  "ACTIVE BOOKING SCHEMA:",
  Object.keys(Booking.schema.paths)
);

console.log(
  "CNIC PATH:",
  Booking.schema.path("passengerCnic")
);
    const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;

    if (!cnicRegex.test(passengerCnic)) {
      return NextResponse.json(
        {
          error:
            "CNIC must be in this format: 42000-92****1-1",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // GENDER
    // ============================================================

    const gender = String(passenger.gender)
      .trim()
      .toLowerCase();

    if (!["male", "female"].includes(gender)) {
      return NextResponse.json(
        {
          error: "Gender must be either male or female",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // BUS VALIDATION
    // ============================================================

    if (!busId) {
      return NextResponse.json(
        {
          error: "Bus ID is required",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // SEAT VALIDATION
    // ============================================================

    if (!Array.isArray(seats) || seats.length === 0) {
      return NextResponse.json(
        {
          error: "Please select at least one seat",
        },
        { status: 400 }
      );
    }

    const selectedSeats = [
      ...new Set(
        seats.map((seat) =>
          String(seat).trim()
        )
      ),
    ];

    if (
      selectedSeats.length === 0 ||
      selectedSeats.some((seat) => !seat)
    ) {
      return NextResponse.json(
        {
          error: "Invalid seat selection",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // DISCOUNT
    // ============================================================

    let discountPercentage = 0;

    if (
      discount !== undefined &&
      discount !== null &&
      discount !== ""
    ) {
      const parsedDiscount = Number(discount);

      if (!Number.isFinite(parsedDiscount)) {
        return NextResponse.json(
          {
            error: "Discount must be a valid number",
          },
          { status: 400 }
        );
      }

      if (
        parsedDiscount < 0 ||
        parsedDiscount > 100
      ) {
        return NextResponse.json(
          {
            error:
              "Discount must be between 0 and 100",
          },
          { status: 400 }
        );
      }

      discountPercentage = parsedDiscount;
    }

    // ============================================================
    // CREATE BOOKING TRANSACTION
    // ============================================================

    let createdBooking: any = null;

    await session.withTransaction(async () => {
      // ----------------------------------------------------------
      // FIND BUS
      // ----------------------------------------------------------

      const bus = await Bus.findById(busId).session(
        session
      );

      if (!bus) {
        throw new Error("BUS_NOT_FOUND");
      }

      // ----------------------------------------------------------
      // CHECK SEAT AVAILABILITY
      // ----------------------------------------------------------

      const unavailableSeats: string[] = [];

      for (const seatNumber of selectedSeats) {
        const seat = bus.seats.find(
          (s: any) =>
            String(s.seatNumber).trim() ===
            seatNumber
        );

        if (
          !seat ||
          seat.status !== "available"
        ) {
          unavailableSeats.push(seatNumber);
        }
      }

      if (unavailableSeats.length > 0) {
        const error: any = new Error(
          "SEATS_UNAVAILABLE"
        );

        error.unavailableSeats =
          unavailableSeats;

        throw error;
      }

      // ----------------------------------------------------------
      // PRICE
      // ----------------------------------------------------------

      const pricePerSeat = Number(bus.price);

      if (
        !Number.isFinite(pricePerSeat) ||
        pricePerSeat < 0
      ) {
        throw new Error(
          "INVALID_BUS_PRICE"
        );
      }

      const subtotal =
        pricePerSeat *
        selectedSeats.length;

      const discountAmount =
        subtotal *
        (discountPercentage / 100);

      const totalFare =
        subtotal - discountAmount;

      // ----------------------------------------------------------
      // CHANGE SELECTED SEATS TO PENDING
      // ----------------------------------------------------------

      bus.seats.forEach((seat: any) => {
        if (
          selectedSeats.includes(
            String(seat.seatNumber).trim()
          )
        ) {
          seat.status = "pending";
        }
      });

      await bus.save({ session });

      // ----------------------------------------------------------
      // TRAVEL DATE
      // ----------------------------------------------------------

      const travelDate = new Date(
        `${bus.date}T00:00:00`
      );

      if (
        Number.isNaN(
          travelDate.getTime()
        )
      ) {
        throw new Error(
          "INVALID_TRAVEL_DATE"
        );
      }

      // ----------------------------------------------------------
      // BOOKING REFERENCE
      // ----------------------------------------------------------

      const bookingRef = `BK-${Date.now()
        .toString()
        .slice(-8)}`;

      // ----------------------------------------------------------
      // CREATE BOOKING
      // ----------------------------------------------------------

      const bookings =
        await Booking.create(
          [
            {
              bookingRef,

              passengerName: name,

              passengerEmail: email,

              passengerPhone: phone,

              // IMPORTANT:
              // Save frontend passenger.cnic
              // into MongoDB passengerCnic
              passengerCnic:passengerCnic,

              gender,

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

              pricePerSeat,

              subtotal,

              discount:
                discountPercentage,

              discountAmount,

              totalFare,
            },
          ],
          { session }
        );
console.log('bookingsc',bookings)
      createdBooking = bookings[0];

      // ----------------------------------------------------------
      // NOTIFICATION
      // ----------------------------------------------------------

      await Notification.create(
        [
          {
            type: "booking",

            title:
              "New Booking Request",

            message: `${name} requested ${
              selectedSeats.length
            } seat${
              selectedSeats.length > 1
                ? "s"
                : ""
            } on ${bus.busNumber}`,

            bookingId:
              createdBooking._id,

            read: false,
          },
        ],
        { session }
      );
    });

    // ============================================================
    // RESPONSE
    // ============================================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Your booking request has been submitted and is pending approval.",

        booking: {
          _id: createdBooking._id,

          bookingRef:
            createdBooking.bookingRef,

          status:
            createdBooking.status,

          passengerName:
            createdBooking.passengerName,

          passengerEmail:
            createdBooking.passengerEmail,

          passengerPhone:
            createdBooking.passengerPhone,

          passengerCnic:
            createdBooking.passengerCnic,

          gender:
            createdBooking.gender,

          seats:
            createdBooking.seats,

          travelDate:
            createdBooking.travelDate,

          travelTime:
            createdBooking.travelTime,

          pricePerSeat:
            createdBooking.pricePerSeat,

          subtotal:
            createdBooking.subtotal,

          discount:
            createdBooking.discount,

          discountAmount:
            createdBooking.discountAmount,

          totalFare:
            createdBooking.totalFare,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error(
      "BOOKING_CREATE_ERROR:",
      error
    );

    // ============================================================
    // SEAT ERROR
    // ============================================================

    if (
      error.message ===
      "SEATS_UNAVAILABLE"
    ) {
      return NextResponse.json(
        {
          error:
            "One or more selected seats are no longer available.",
          unavailableSeats:
            error.unavailableSeats || [],
        },
        { status: 409 }
      );
    }

    // ============================================================
    // BUS NOT FOUND
    // ============================================================

    if (
      error.message ===
      "BUS_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          error: "Bus not found",
        },
        { status: 404 }
      );
    }

    // ============================================================
    // INVALID DATE
    // ============================================================

    if (
      error.message ===
      "INVALID_TRAVEL_DATE"
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid bus travel date",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // INVALID PRICE
    // ============================================================

    if (
      error.message ===
      "INVALID_BUS_PRICE"
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid bus price",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // MONGOOSE VALIDATION ERROR
    // ============================================================

    if (
      error?.name ===
      "ValidationError"
    ) {
      return NextResponse.json(
        {
          error:
            "Booking validation failed",
          details: error.message,
        },
        { status: 400 }
      );
    }

    // ============================================================
    // GENERAL ERROR
    // ============================================================

    return NextResponse.json(
      {
        error:
          "Unable to create booking",
        details:
          process.env.NODE_ENV ===
          "development"
            ? error?.message
            : undefined,
      },
      { status: 500 }
    );
  } finally {
    await session.endSession();
  }
}

// ============================================================
// GET BOOKINGS
// ============================================================

export async function GET() {
  try {
    await connectDB();

    const bookings =
      await Booking.find({})
        .populate(
          "bus",
          "busNumber route"
        )
        .sort({
          createdAt: -1,
        })
        .lean();
console.log('bookings',bookings)
    return NextResponse.json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error(
      "GET BOOKINGS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to fetch bookings",
        bookings: [],
      },
      {
        status: 500,
      }
    );
  }
}