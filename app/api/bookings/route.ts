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

    const {
      passenger,
      busId,
      seats,

      // Optional percentage discount
      // Example: 10 = 10%
      discount,
    } = body;

    console.log("BOOKING REQUEST:", body);

    // ============================================
    // VALIDATION
    // ============================================

    if (
      !passenger?.name ||
      !passenger?.email ||
      !passenger?.phone ||
      !passenger?.gender
    ) {
      return NextResponse.json(
        {
          error:
            "Passenger name, email, gender and phone are required",
        },
        { status: 400 }
      );
    }

    // ============================================
    // VALIDATE GENDER
    // ============================================

    const gender = String(passenger.gender)
      .trim()
      .toLowerCase();

    console.log("gender", gender);

    if (!["male", "female"].includes(gender)) {
      return NextResponse.json(
        {
          error: "Gender must be either male or female",
        },
        { status: 400 }
      );
    }

    // ============================================
    // VALIDATE BUS ID
    // ============================================

    if (!busId) {
      return NextResponse.json(
        {
          error: "Bus ID is required",
        },
        { status: 400 }
      );
    }

    // ============================================
    // VALIDATE SEATS
    // ============================================

    if (!Array.isArray(seats) || seats.length === 0) {
      return NextResponse.json(
        {
          error: "Please select at least one seat",
        },
        { status: 400 }
      );
    }

    // ============================================
    // NORMALIZE SEATS
    // ============================================

    const selectedSeats = [
      ...new Set(
        seats.map((seat) =>
          String(seat).trim()
        )
      ),
    ];

    // ============================================
    // VALIDATE EMPTY SEATS
    // ============================================

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

    // ============================================
    // VALIDATE DISCOUNT
    // ============================================
    //
    // Discount is OPTIONAL.
    //
    // Examples:
    // undefined -> 0%
    // 0         -> 0%
    // 10        -> 10%
    // 20        -> 20%
    // 100       -> 100%
    //
    // ============================================

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
            error:
              "Discount must be a valid percentage",
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
              "Discount percentage must be between 0 and 100",
          },
          { status: 400 }
        );
      }

      discountPercentage = parsedDiscount;
    }

    console.log(
      "DISCOUNT PERCENTAGE:",
      discountPercentage
    );

    // ============================================
    // CREATED BOOKING
    // ============================================

    let createdBooking: any = null;

    // ============================================
    // TRANSACTION
    // ============================================

    await session.withTransaction(async () => {
      // --------------------------------------------
      // FIND BUS
      // --------------------------------------------

      const bus = await Bus.findById(busId).session(
        session
      );

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
            String(s.seatNumber).trim() ===
            seatNumber
        );

        console.log("CHECKING SEAT:", {
          requested: seatNumber,
          found: seat?.seatNumber,
          status: seat?.status,
        });

        if (
          !seat ||
          seat.status !== "available"
        ) {
          unavailableSeats.push(seatNumber);
        }
      }

      // --------------------------------------------
      // SEATS NOT AVAILABLE
      // --------------------------------------------

      if (unavailableSeats.length > 0) {
        const error: any = new Error(
          "SEATS_UNAVAILABLE"
        );

        error.unavailableSeats =
          unavailableSeats;

        throw error;
      }

      // --------------------------------------------
      // CALCULATE PRICE
      // --------------------------------------------

      const pricePerSeat = Number(bus.price);

      if (
        !Number.isFinite(pricePerSeat) ||
        pricePerSeat < 0
      ) {
        throw new Error("INVALID_BUS_PRICE");
      }

      // Example:
      //
      // pricePerSeat = 1000
      // seats = 2
      //
      // subtotal = 2000
      //
      const subtotal =
        pricePerSeat * selectedSeats.length;

      // --------------------------------------------
      // DISCOUNT CALCULATION
      // --------------------------------------------
      //
      // Example:
      //
      // subtotal = 1000
      // discountPercentage = 10
      //
      // discountAmount =
      // 1000 * (10 / 100)
      //
      // discountAmount = 100
      //
      // totalFare =
      // 1000 - 100
      //
      // totalFare = 900
      //
      // --------------------------------------------

      const discountAmount =
        subtotal *
        (discountPercentage / 100);

      const totalFare =
        subtotal - discountAmount;

      console.log("PRICE CALCULATION:", {
        pricePerSeat,
        selectedSeats: selectedSeats.length,
        subtotal,
        discountPercentage,
        discountAmount,
        totalFare,
      });

      // --------------------------------------------
      // MARK SEATS AS PENDING
      // --------------------------------------------

      bus.seats.forEach((seat) => {
        if (
          selectedSeats.includes(
            String(seat.seatNumber).trim()
          )
        ) {
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

      if (
        Number.isNaN(
          travelDate.getTime()
        )
      ) {
        throw new Error(
          "INVALID_TRAVEL_DATE"
        );
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

      const bookings =
        await Booking.create(
          [
            {
              bookingRef,

              passengerName:
                passenger.name.trim(),

              passengerEmail:
                passenger.email
                  .trim()
                  .toLowerCase(),

              passengerPhone:
                passenger.phone.trim(),

              gender,

              route:
                bus.route ||
                `${bus.pickup} → ${bus.dropoff}`,

              bus: bus._id,

              seats: selectedSeats,

              travelDate,

              travelTime:
                bus.departure,

              status: "pending",

              emailSent: false,

              whatsappSent: false,

              // ==================================
              // PRICE INFORMATION
              // ==================================

              pricePerSeat,

              subtotal,

              // Discount percentage
              // Example: 10 means 10%
              discount:
                discountPercentage,

              // Actual money discounted
              discountAmount,

              // Final amount customer needs to pay
              totalFare,
            },
          ],
          { session }
        );

      createdBooking =
        bookings[0];

      console.log(
        "BOOKING CREATED INSIDE TRANSACTION:",
        createdBooking._id
      );

      // --------------------------------------------
      // CREATE ADMIN NOTIFICATION
      // --------------------------------------------

      await Notification.create(
        [
          {
            type: "booking",

            title:
              "New Booking Request",

            message: `${passenger.name} requested ${
              selectedSeats.length
            } seat${
              selectedSeats.length > 1
                ? "s"
                : ""
            } on ${
              bus.busNumber
            }`,

            bookingId:
              createdBooking._id,

            read: false,
          },
        ],
        { session }
      );

      console.log(
        "ADMIN NOTIFICATION CREATED:",
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
          _id:
            createdBooking._id,

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

          gender:
            createdBooking.gender,

          seats:
            createdBooking.seats,

          travelDate:
            createdBooking.travelDate,

          travelTime:
            createdBooking.travelTime,

          // ======================================
          // PRICE RESPONSE
          // ======================================

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

    // ============================================
    // SEATS UNAVAILABLE
    // ============================================

    if (
      error.message ===
      "SEATS_UNAVAILABLE"
    ) {
      return NextResponse.json(
        {
          error:
            "Some selected seats are no longer available",

          unavailableSeats:
            error.unavailableSeats ||
            [],
        },
        { status: 409 }
      );
    }

    // ============================================
    // BUS NOT FOUND
    // ============================================

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

    // ============================================
    // INVALID DATE
    // ============================================

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

    // ============================================
    // INVALID BUS PRICE
    // ============================================

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

    // ============================================
    // GENERAL ERROR
    // ============================================

    return NextResponse.json(
      {
        error:
          "Something went wrong while creating your booking",

        details:
          process.env.NODE_ENV ===
          "development"
            ? error.message
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