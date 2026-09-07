import { NextResponse } from "next/server";

import Booking from "@/models/Booking";
import Bus from "@/models/Bus";
import { connectDB } from "@/libs/mongodb";

export async function GET() {
  try {
    await connectDB();

    // ============================================================
    // TODAY
    // ============================================================

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    console.log("TODAY RANGE:", {
      startOfDay,
      endOfDay,
    });

    // ============================================================
    // FIND ALL BUSES FOR TODAY
    // ============================================================

    const today = new Date();

    const todayString = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");

    console.log("TODAY BUS DATE:", todayString);

    const buses = await Bus.find({
      date: todayString,
    })
      .lean();

    console.log(
      "TODAY BUSES FOUND:",
      buses.length
    );

    // If there are no buses today
    if (buses.length === 0) {
      return NextResponse.json({
        success: true,
        trips: [],
        message: "No buses are scheduled for today",
      });
    }

    // ============================================================
    // GET BUS IDS
    // ============================================================

    const busIds = buses.map((bus) => bus._id);

    // ============================================================
    // FIND TODAY'S BOOKINGS FOR THESE BUSES
    //
    // IMPORTANT:
    // We include BOTH pending and confirmed bookings.
    //
    // If you only want confirmed bookings, change this to:
    //
    // status: "confirmed"
    // ============================================================

    const bookings = await Booking.find({
      bus: { $in: busIds },

      travelDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },

      status: {
        $in: ["pending", "confirmed"],
      },
    })
      .select(
        "bus seats status passengerName passengerEmail passengerPhone"
      )
      .lean();

    console.log(
      "TODAY BOOKINGS FOUND:",
      bookings.length
    );

    // ============================================================
    // GROUP BOOKINGS BY BUS
    // ============================================================

    const bookingMap = new Map<
      string,
      {
        totalBookings: number;
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
          totalBookings: 0,
          bookedSeats: 0,
          pendingSeats: 0,
          confirmedSeats: 0,
        });
      }

      const data = bookingMap.get(busId)!;

      data.totalBookings += 1;

      const seatCount = Array.isArray(booking.seats)
        ? booking.seats.length
        : 0;

      data.bookedSeats += seatCount;

      if (booking.status === "pending") {
        data.pendingSeats += seatCount;
      }

      if (booking.status === "confirmed") {
        data.confirmedSeats += seatCount;
      }
    }

    // ============================================================
    // CREATE TRIPS
    // ============================================================

    const trips = buses
      .map((bus) => {
        const busId = bus._id.toString();

        const bookingData =
          bookingMap.get(busId) || {
            totalBookings: 0,
            bookedSeats: 0,
            pendingSeats: 0,
            confirmedSeats: 0,
          };

        const capacity = Array.isArray(bus.seats)
          ? bus.seats.length
          : 40;

        const availableSeats = Array.isArray(
          bus.seats
        )
          ? bus.seats.filter(
              (seat: any) =>
                seat.status === "available"
            ).length
          : 0;

        return {
          // ======================================================
          // BUS INFORMATION
          // ======================================================

          busId: busId,

          busNumber:
            bus.busNumber || "Unassigned",

          company:
            bus.company || "-",

          route:
            bus.route ||
            `${bus.pickup || "-"} → ${
              bus.dropoff || "-"
            }`,

          pickup:
            bus.pickup || "-",

          dropoff:
            bus.dropoff || "-",

          date:
            bus.date || todayString,

          departure:
            bus.departure || "-",

          arrival:
            bus.arrival || "-",

          duration:
            bus.duration || "-",

          price:
            bus.price || 0,

          // ======================================================
          // SEAT INFORMATION
          // ======================================================

          capacity,

          availableSeats,

          bookedSeats:
            bookingData.bookedSeats,

          // ======================================================
          // BOOKING INFORMATION
          // ======================================================

          totalBookings:
            bookingData.totalBookings,

          pendingSeats:
            bookingData.pendingSeats,

          confirmedSeats:
            bookingData.confirmedSeats,

          hasBookings:
            bookingData.totalBookings > 0,
        };
      })
      // Sort by departure time
      .sort((a, b) =>
        a.departure.localeCompare(
          b.departure
        )
      );

    // ============================================================
    // RESPONSE
    // ============================================================

    console.log(
      "TODAY'S TRIPS:",
      trips
    );

    return NextResponse.json({
      success: true,

      date: todayString,

      totalBuses: trips.length,

      totalBusesWithBookings:
        trips.filter(
          (trip) => trip.hasBookings
        ).length,

      trips,
    });
  } catch (error) {
    console.error(
      "TODAY TRIPS API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to fetch today's trips",
        trips: [],
      },
      {
        status: 500,
      }
    );
  }
}