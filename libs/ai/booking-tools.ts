import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { connectDB } from "../mongodb";
import Bus from "@/models/Bus";
import Booking from "@/models/Booking";

/* ============================================================
   SEARCH AVAILABLE BUSES
   ============================================================ */

interface ISearchAvailableBusses {
  date?: string;
  pickup?: string;
  dropoff?: string;
}

export const searchAvailableBusses = tool(
  async ({ date, pickup, dropoff }: ISearchAvailableBusses) => {
    await connectDB();

    const query: Record<string, unknown> = {};

    if (date) {
      query.date = date;
    }

    if (pickup) {
      query.pickup = {
        $regex: `^${escapeRegex(pickup.trim())}$`,
        $options: "i",
      };
    }

    if (dropoff) {
      query.dropoff = {
        $regex: `^${escapeRegex(dropoff.trim())}$`,
        $options: "i",
      };
    }

    const buses = await Bus.find(query)
      .sort({ departure: 1 })
      .lean();

    return buses.map((bus) => {
      const availableSeats = bus.seats
        .filter((seat) => seat.status === "available")
        .map((seat) => seat.seatNumber);

      return {
        busId: bus._id.toString(),
        busNumber: bus.busNumber,
        company: bus.company,
        route: bus.route,
        pickup: bus.pickup,
        dropoff: bus.dropoff,
        date: bus.date,
        departure: bus.departure,
        arrival: bus.arrival,
        duration: bus.duration,
        price: bus.price,
        totalSeats: bus.seats.length,
        availableSeats,
        availableSeatCount: availableSeats.length,
      };
    });
  },
  {
    name: "search_available_buses",

    description:
      "Search real Haikal Tours buses for a travel date, pickup location, and dropoff location. Use this whenever the passenger asks about available buses, routes, schedules, departure times, arrival times, prices, or available seats. Always use the exact pickup and dropoff direction.",

    schema: z.object({
      date: z
        .string()
        .optional()
        .describe("Travel date in YYYY-MM-DD format"),

      pickup: z
        .string()
        .optional()
        .describe("Exact pickup location"),

      dropoff: z
        .string()
        .optional()
        .describe("Exact dropoff location"),
    }),
  }
);

/* ============================================================
   GET BUS SEATS
   ============================================================ */

export const getBusSeats = tool(
  async ({ busNumber }: { busNumber: string }) => {
    await connectDB();

    const bus = await Bus.findOne({
      busNumber: {
        $regex: `^${escapeRegex(busNumber.trim())}$`,
        $options: "i",
      },
    }).lean();

    if (!bus) {
      return {
        found: false,
        message: `Bus ${busNumber} was not found.`,
      };
    }

    const availableSeats = bus.seats
      .filter((seat) => seat.status === "available")
      .map((seat) => seat.seatNumber);

    const pendingSeats = bus.seats
      .filter((seat) => seat.status === "pending")
      .map((seat) => seat.seatNumber);

    const bookedSeats = bus.seats
      .filter((seat) => seat.status === "booked")
      .map((seat) => seat.seatNumber);

    return {
      found: true,

      busNumber: bus.busNumber,
      company: bus.company,

      pickup: bus.pickup,
      dropoff: bus.dropoff,

      date: bus.date,

      departure: bus.departure,
      arrival: bus.arrival,

      duration: bus.duration,

      price: bus.price,

      totalSeats: bus.seats.length,

      availableSeats,
      availableSeatCount: availableSeats.length,

      pendingSeats,
      pendingSeatCount: pendingSeats.length,

      bookedSeats,
      bookedSeatCount: bookedSeats.length,
    };
  },
  {
    name: "get_bus_seats",

    description:
      "Get the actual seat status for a specific Haikal Tours bus. Returns available, pending, and booked seats. Use this when the passenger needs complete seat information.",

    schema: z.object({
      busNumber: z
        .string()
        .describe("The exact bus number"),
    }),
  }
);

/* ============================================================
   CHECK ONE SEAT
   ============================================================ */

export const checkSeatAvailability = tool(
  async ({
    busNumber,
    seatNumber,
  }: {
    busNumber: string;
    seatNumber: string;
  }) => {
    await connectDB();

    const bus = await Bus.findOne({
      busNumber: {
        $regex: `^${escapeRegex(busNumber.trim())}$`,
        $options: "i",
      },
    }).lean();

    if (!bus) {
      return {
        found: false,
        message: `Bus ${busNumber} was not found.`,
      };
    }

    const seat = bus.seats.find(
      (item) =>
        item.seatNumber.toLowerCase() ===
        seatNumber.trim().toLowerCase()
    );

    if (!seat) {
      return {
        found: false,
        message: `Seat ${seatNumber} does not exist on bus ${busNumber}.`,
      };
    }

    return {
      found: true,

      busNumber: bus.busNumber,

      seatNumber: seat.seatNumber,

      status: seat.status,

      available: seat.status === "available",
    };
  },
  {
    name: "check_seat_availability",

    description:
      "Check whether one specific seat is available, pending, or booked on a specific Haikal Tours bus.",

    schema: z.object({
      busNumber: z
        .string()
        .describe("The exact bus number"),

      seatNumber: z
        .string()
        .describe("The exact seat number"),
    }),
  }
);

/* ============================================================
   GET EXISTING BOOKING
   ============================================================ */

export const getBooking = tool(
  async ({ bookingRef }: { bookingRef: string }) => {
    await connectDB();

    const booking = await Booking.findOne({
      bookingRef: {
        $regex: `^${escapeRegex(bookingRef.trim())}$`,
        $options: "i",
      },
    })
      .populate("bus")
      .lean();

    if (!booking) {
      return {
        found: false,
        message: `Booking ${bookingRef} was not found.`,
      };
    }

    const bus = booking.bus as any;

    return {
      found: true,

      bookingRef: booking.bookingRef,

      passengerName: booking.passengerName,

      passengerEmail: booking.passengerEmail,

      passengerPhone: booking.passengerPhone,

      gender: booking.gender,

      route: booking.route,

      seats: booking.seats,

      travelDate: booking.travelDate,

      travelTime: booking.travelTime,

      status: booking.status,

      bus: bus
        ? {
            busNumber: bus.busNumber,
            company: bus.company,
            pickup: bus.pickup,
            dropoff: bus.dropoff,
            date: bus.date,
            departure: bus.departure,
            arrival: bus.arrival,
            duration: bus.duration,
            price: bus.price,
          }
        : null,
    };
  },
  {
    name: "get_booking",

    description:
      "Get read-only information about an existing Haikal Tours booking using its booking reference.",

    schema: z.object({
      bookingRef: z
        .string()
        .describe("The booking reference"),
    }),
  }
);

/* ============================================================
   CREATE BOOKING
   ============================================================ */

export const createBooking = tool(
  async ({
    busId,
    passengerName,
    passengerEmail,
    passengerPhone,
    gender,
    seats,
  }) => {
    try {
      /*
       * IMPORTANT:
       *
       * This tool calls your existing:
       *
       * POST /api/bookings
       *
       * Your API already handles:
       *
       * - bus validation
       * - seat validation
       * - seat locking
       * - price calculation
       * - discount calculation
       * - booking creation
       * - booking reference
       * - admin notification
       *
       * Therefore we should NOT duplicate that logic here.
       */

      const baseUrl =
        process.env.APP_URL ||
        "http://localhost:3000";

      const response = await fetch(
        `${baseUrl}/api/bookings`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            passenger: {
              name: passengerName.trim(),
              email: passengerEmail.trim().toLowerCase(),
              phone: passengerPhone.trim(),
              gender: gender.trim().toLowerCase(),
            },

            busId,

            seats,
          }),

          cache: "no-store",
        }
      );

      const data = await response.json();

      /*
       * API returned an error.
       */

      if (!response.ok || !data?.success) {
        return {
          success: false,

          error:
            data?.error ||
            "Something went wrong while creating your booking.",

          unavailableSeats:
            data?.unavailableSeats || [],

          statusCode: response.status,
        };
      }

      /*
       * SUCCESS
       */

      const booking = data.booking;

      return {
        success: true,

        message:
          data.message ||
          "Your booking request has been submitted and is pending approval.",

        booking: {
          _id: booking?._id,

          bookingRef: booking?.bookingRef,

          status: booking?.status,

          passengerName: booking?.passengerName,

          passengerEmail: booking?.passengerEmail,

          passengerPhone: booking?.passengerPhone,

          gender: booking?.gender,

          seats: booking?.seats,

          travelDate: booking?.travelDate,

          travelTime: booking?.travelTime,

          pricePerSeat: booking?.pricePerSeat,

          subtotal: booking?.subtotal,

          discount: booking?.discount,

          discountAmount: booking?.discountAmount,

          totalFare: booking?.totalFare,
        },
      };
    } catch (error) {
      console.error(
        "CREATE_BOOKING_TOOL_ERROR:",
        error
      );

      return {
        success: false,

        error:
          "The booking service could not be reached. Please try again.",
      };
    }
  },
  {
    name: "create_booking",

    description: `
Create a Haikal Tours passenger booking.

CRITICAL SAFETY RULE:

ONLY call this tool after the passenger has explicitly
confirmed the complete booking summary.

The passenger must have already confirmed:

- bus
- travel date
- pickup
- dropoff
- seats
- passenger name
- passenger email
- passenger phone
- passenger gender

NEVER call this tool simply because the passenger says
they want to book.

First show the complete booking summary.

Then ask:

"Do you confirm the booking with these details?"

Only call this tool after the passenger explicitly confirms.

The booking API performs a final database check of the
selected seats before creating the booking.

If a seat became unavailable, do not claim the booking
was created.

If the API returns success, use the exact booking reference
and booking information returned by the API.

NEVER invent a booking reference.

NEVER claim the booking was created if success is false.
`,

    schema: z.object({
      busId: z
        .string()
        .describe("The MongoDB ID of the selected bus"),

      passengerName: z
        .string()
        .min(1)
        .describe("Passenger full name"),

      passengerEmail: z
        .string()
        .email()
        .describe("Passenger email address"),

      passengerPhone: z
        .string()
        .min(1)
        .describe("Passenger phone number"),

      gender: z
        .enum(["male", "female"])
        .describe(
          "Passenger gender. Must be either male or female."
        ),

      seats: z
        .array(z.string())
        .min(1)
        .describe(
          "Selected seat numbers"
        ),
    }),
  }
);

/* ============================================================
   ALL BOOKING TOOLS
   ============================================================ */

export const bookingTools = [
  searchAvailableBusses,
  getBusSeats,
  checkSeatAvailability,
  getBooking,
  createBooking,
];

/* ============================================================
   REGEX HELPER
   ============================================================ */

function escapeRegex(value: string): string {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}