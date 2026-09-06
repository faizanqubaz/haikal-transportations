import { tool } from "@langchain/core/tools"

import {z} from 'zod'
import { connectDB } from "../mongodb";
import Bus from "@/models/Bus";
import Booking from "@/models/Booking";

interface IsearchAvailableBusses{
    date:string;
    pickup?:string
    dropoff?:string
}


// * Search buses based on date / pickup / dropoff.
 
export const searchAvailableBusses = tool(
    async({date,pickup,dropoff}:IsearchAvailableBusses) => {
        await connectDB();
        const query: Record<string, unknown> = {};

    if (date) {
      query.date = date;
    }

    if (pickup) {
      query.pickup = {
        $regex: pickup,
        $options: "i",
      };
    }

    if (dropoff) {
      query.dropoff = {
        $regex: dropoff,
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
      })

    },
    {
        name:'search_available_buses',
        description:"Search real buses for a travel date, pickup location, and dropoff location. Use this whenever the user asks which buses are available, bus schedules, routes, prices, or available seats.",
        schema:z.object({
            date: z
        .string()
        .optional()
        .describe("Travel date in YYYY-MM-DD format"),
          pickup: z
        .string()
        .optional()
        .describe("Pickup location"),

      dropoff: z
        .string()
        .optional()
        .describe("Dropoff location"),
        })
    }
)


/**
 * Get complete seat information for a bus.
 *
 * READ ONLY.
 */
export const getBusSeats = tool(
  async ({ busNumber }: { busNumber: string }) => {
    await connectDB();

    const bus = await Bus.findOne({
      busNumber: {
        $regex: `^${busNumber}$`,
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
      "Get the actual seat status for a specific bus. Returns available, pending and booked seats.",
    schema: z.object({
      busNumber: z
        .string()
        .describe("The bus number"),
    }),
  }
);

/**
 * Check one specific seat.
 *
 * READ ONLY.
 */
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
        $regex: `^${busNumber}$`,
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
        seatNumber.toLowerCase()
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
      "Check whether one specific seat is available, pending, or booked on a specific bus.",
    schema: z.object({
      busNumber: z.string(),
      seatNumber: z.string(),
    }),
  }
);



/**
 * Get booking information.
 *
 * READ ONLY.
 */
export const getBooking = tool(
  async ({ bookingRef }: { bookingRef: string }) => {
    await connectDB();

    const booking = await Booking.findOne({
      bookingRef: {
        $regex: `^${bookingRef}$`,
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
      "Get read-only information about a booking using its booking reference.",
    schema: z.object({
      bookingRef: z
        .string()
        .describe("Booking reference"),
    }),
  }
);

export const bookingTools = [
  searchAvailableBusses,
   getBusSeats,
  checkSeatAvailability,
  getBooking,
];

