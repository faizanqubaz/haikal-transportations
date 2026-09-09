import { NextResponse } from "next/server";

import Booking from "@/models/Booking";
import Bus from "@/models/Bus";
import { connectDB } from "@/libs/mongodb";

export async function GET() {
  try {
    await connectDB();

    // ============================================================
    // DATE HELPERS
    // ============================================================

    const now = new Date();

    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayString = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");

    console.log("TRIP DEPARTURES DATE:", todayString);

    // ============================================================
    // GET ALL BUSES
    //
    // We need previous + today + upcoming.
    // ============================================================

    const buses = await Bus.find({})
      .sort({
        date: 1,
        departure: 1,
      })
      .lean();

    console.log("TOTAL BUSES FOUND:", buses.length);

    if (buses.length === 0) {
      return NextResponse.json({
        success: true,
        date: todayString,

        previousTrips: [],
        todayTrips: [],
        upcomingTrips: [],

        counts: {
          previous: 0,
          today: 0,
          upcoming: 0,
          total: 0,
        },
      });
    }

    // ============================================================
    // GET BUS IDS
    // ============================================================

    const busIds = buses.map((bus) => bus._id);

    // ============================================================
    // GET BOOKINGS FOR ALL THESE BUSES
    //
    // We include:
    // pending
    // confirmed
    // approved
    //
    // Change this list if you want only confirmed/approved.
    // ============================================================

    const bookings = await Booking.find({
      bus: {
        $in: busIds,
      },

      status: {
        $in: [
          "pending",
          "confirmed",
          "approved",
        ],
      },
    })
      .select(
        [
          "bus",
          "seats",
          "status",
          "passengerName",
          "passengerEmail",
          "passengerPhone",
          "gender",
          "bookingRef",
          "travelDate",
          "travelTime",
        ].join(" ")
      )
      .lean();

    console.log(
      "TOTAL BOOKINGS FOUND:",
      bookings.length
    );

    // ============================================================
    // GROUP BOOKINGS BY BUS
    // ============================================================

    const bookingMap = new Map<
      string,
      {
        bookings: any[];
        totalPassengers: number;
        bookedSeats: number;
        pendingSeats: number;
        confirmedSeats: number;
      }
    >();

    for (const booking of bookings) {
      if (!booking.bus) continue;

      const busId = booking.bus.toString();

      if (!bookingMap.has(busId)) {
        bookingMap.set(busId, {
          bookings: [],
          totalPassengers: 0,
          bookedSeats: 0,
          pendingSeats: 0,
          confirmedSeats: 0,
        });
      }

      const data = bookingMap.get(busId)!;

      const seats = Array.isArray(booking.seats)
        ? booking.seats
        : [];

      const seatCount = seats.length;

      // ----------------------------------------------------------
      // PASSENGER DETAILS
      // ----------------------------------------------------------

      data.bookings.push({
        id: booking._id.toString(),

        bookingRef:
          booking.bookingRef || null,

        name:
          booking.passengerName || "Unknown",

        email:
          booking.passengerEmail || null,

        phone:
          booking.passengerPhone || null,

        gender:
          booking.gender || null,

        seats,

        seatCount,

        status:
          booking.status || "unknown",

        travelDate:
          booking.travelDate || null,

        travelTime:
          booking.travelTime || null,
      });

      // ----------------------------------------------------------
      // SEAT COUNTS
      // ----------------------------------------------------------

      data.bookedSeats += seatCount;

      data.totalPassengers += seatCount;

      if (booking.status === "pending") {
        data.pendingSeats += seatCount;
      }

      if (
        booking.status === "confirmed" ||
        booking.status === "approved"
      ) {
        data.confirmedSeats += seatCount;
      }
    }

    // ============================================================
    // HELPER: GET BUS DRIVER NAME
    //
    // Supports several possible Bus schema structures.
    // ============================================================

    function getDriverName(bus: any) {
      if (typeof bus.driverName === "string") {
        return bus.driverName;
      }

      if (bus.driver?.name) {
        return bus.driver.name;
      }

      if (bus.driver?.fullName) {
        return bus.driver.fullName;
      }

      if (bus.driver?.firstName) {
        return [
          bus.driver.firstName,
          bus.driver.lastName || "",
        ]
          .join(" ")
          .trim();
      }

      if (bus.driver) {
        return String(bus.driver);
      }

      return "Unassigned";
    }

    // ============================================================
    // HELPER: NORMALIZE BUS DATE
    // ============================================================

    function normalizeDate(date: any): string | null {
      if (!date) return null;

      if (typeof date === "string") {
        // YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          return date;
        }

        const parsed = new Date(date);

        if (Number.isNaN(parsed.getTime())) {
          return null;
        }

        return [
          parsed.getFullYear(),
          String(parsed.getMonth() + 1).padStart(2, "0"),
          String(parsed.getDate()).padStart(2, "0"),
        ].join("-");
      }

      if (date instanceof Date) {
        return [
          date.getFullYear(),
          String(date.getMonth() + 1).padStart(2, "0"),
          String(date.getDate()).padStart(2, "0"),
        ].join("-");
      }

      return null;
    }

    // ============================================================
    // CREATE TRIP OBJECTS
    // ============================================================

    const trips = buses
      .map((bus: any) => {
        const busId = bus._id.toString();

        const date =
          normalizeDate(bus.date) ||
          todayString;

        const bookingData =
          bookingMap.get(busId) || {
            bookings: [],
            totalPassengers: 0,
            bookedSeats: 0,
            pendingSeats: 0,
            confirmedSeats: 0,
          };

        // --------------------------------------------------------
        // SEAT CAPACITY
        // --------------------------------------------------------

        const capacity = Array.isArray(bus.seats)
          ? bus.seats.length
          : 40;

        const availableSeats = Array.isArray(bus.seats)
          ? bus.seats.filter(
              (seat: any) =>
                seat.status === "available"
            ).length
          : Math.max(
              capacity - bookingData.bookedSeats,
              0
            );

        // --------------------------------------------------------
        // ROUTE
        // --------------------------------------------------------

        const pickup =
          bus.pickup ||
          bus.pickupLocation ||
          "-";

        const dropoff =
          bus.dropoff ||
          bus.destination ||
          bus.dropoffLocation ||
          "-";

        const route =
          bus.route ||
          `${pickup} → ${dropoff}`;

        // --------------------------------------------------------
        // DRIVER
        // --------------------------------------------------------

        const driverName =
          getDriverName(bus);

        // --------------------------------------------------------
        // STATUS
        // --------------------------------------------------------

        let tripStatus:
          | "previous"
          | "today"
          | "upcoming";

        if (date < todayString) {
          tripStatus = "previous";
        } else if (date === todayString) {
          tripStatus = "today";
        } else {
          tripStatus = "upcoming";
        }

        // --------------------------------------------------------
        // RETURN TRIP
        // --------------------------------------------------------

        return {
          busId,

          // Status used by frontend
          status: tripStatus,

          // Bus
          busNumber:
            bus.busNumber ||
            bus.name ||
            "Unassigned",

          busName:
            bus.busName ||
            bus.name ||
            bus.busNumber ||
            "Unnamed Bus",

          company:
            bus.company || "-",

          // Route
          route,

          pickup,

          dropoff,

          // Schedule
          date,

          departure:
            bus.departure || "-",

          arrival:
            bus.arrival || "-",

          duration:
            bus.duration || "-",

          // Driver
          driver: {
            name: driverName,
          },

          driverName,

          // Price
          price:
            bus.price || 0,

          // Seats
          capacity,

          availableSeats,

          bookedSeats:
            bookingData.bookedSeats,

          // Passengers
          passengerCount:
            bookingData.totalPassengers,

          bookingCount:
            bookingData.bookings.length,

          pendingSeats:
            bookingData.pendingSeats,

          confirmedSeats:
            bookingData.confirmedSeats,

          hasPassengers:
            bookingData.bookings.length > 0,

          // FULL PASSENGER DETAILS
          passengers:
            bookingData.bookings,
        };
      });

    // ============================================================
    // SPLIT INTO THREE GROUPS
    // ============================================================

    const previousTrips = trips
      .filter(
        (trip) =>
          trip.status === "previous"
      )
      .sort((a, b) => {
        const dateCompare =
          b.date.localeCompare(a.date);

        if (dateCompare !== 0) {
          return dateCompare;
        }

        return b.departure.localeCompare(
          a.departure
        );
      });

    const todayTrips = trips
      .filter(
        (trip) =>
          trip.status === "today"
      )
      .sort((a, b) =>
        a.departure.localeCompare(
          b.departure
        )
      );

    const upcomingTrips = trips
      .filter(
        (trip) =>
          trip.status === "upcoming"
      )
      .sort((a, b) => {
        const dateCompare =
          a.date.localeCompare(b.date);

        if (dateCompare !== 0) {
          return dateCompare;
        }

        return a.departure.localeCompare(
          b.departure
        );
      });

    // ============================================================
    // RESPONSE
    // ============================================================

    return NextResponse.json({
      success: true,

      date: todayString,

      counts: {
        previous: previousTrips.length,
        today: todayTrips.length,
        upcoming: upcomingTrips.length,

        total:
          previousTrips.length +
          todayTrips.length +
          upcomingTrips.length,
      },

      previousTrips,

      todayTrips,

      upcomingTrips,

      // Useful if you want everything together
      trips,
    });
  } catch (error) {
    console.error(
      "TRIP DEPARTURES API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          "Failed to fetch trip departures",

        date: null,

        counts: {
          previous: 0,
          today: 0,
          upcoming: 0,
          total: 0,
        },

        previousTrips: [],
        todayTrips: [],
        upcomingTrips: [],
        trips: [],
      },
      {
        status: 500,
      }
    );
  }
}