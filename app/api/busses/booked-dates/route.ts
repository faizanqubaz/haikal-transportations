import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/libs/mongodb";
import Bus from "@/models/Bus";

import {
  createCacheKey,
  getCache,
  setCache,
} from "@/libs/cache/api-cache";

const CACHE_TTL = 30; // seconds

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const pickup = searchParams.get("pickup")?.trim();
    const dropoff = searchParams.get("dropoff")?.trim();

    // ============================================
    // VALIDATION
    // ============================================

    if (!pickup || !dropoff) {
      return NextResponse.json(
        {
          success: false,
          message: "Pickup and dropoff are required",
          bookedDates: [],
        },
        { status: 400 }
      );
    }

    // ============================================
    // CREATE CACHE KEY
    // ============================================

    const cacheKey = createCacheKey(
      "/api/booked-dates",
      "GET",
      {
        pickup: pickup.toLowerCase(),
        dropoff: dropoff.toLowerCase(),
      }
    );

    // ============================================
    // CHECK REDIS
    // ============================================

    const cached = await getCache<{
      success: boolean;
      pickup: string;
      dropoff: string;
      bookedDates: string[];
    }>(cacheKey);

    if (cached) {
      console.log("BOOKED DATES CACHE HIT:", {
        pickup,
        dropoff,
      });

      return NextResponse.json({
        ...cached,
        cached: true,
      });
    }

    console.log("BOOKED DATES CACHE MISS:", {
      pickup,
      dropoff,
    });

    // ============================================
    // DATABASE
    // ============================================

    await connectDB();

    // ============================================
    // ESCAPE REGEX
    // ============================================

    const escapeRegex = (value: string) =>
      value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // ============================================
    // CASE-INSENSITIVE EXACT MATCHING
    // ============================================

    const pickupRegex = new RegExp(
      `^${escapeRegex(pickup)}$`,
      "i"
    );

    const dropoffRegex = new RegExp(
      `^${escapeRegex(dropoff)}$`,
      "i"
    );

    console.log("BOOKED DATES REQUEST:", {
      pickup,
      dropoff,
    });

    // ============================================
    // FIND BUSES
    // ============================================

    const buses = await Bus.find({
      pickup: pickupRegex,
      dropoff: dropoffRegex,
    })
      .select("date seats")
      .lean();

    console.log("BUSES FOUND:", buses.length);

    // ============================================
    // GROUP BUSES BY DATE
    // ============================================

    const busesByDate = new Map<
      string,
      typeof buses
    >();

    for (const bus of buses) {
      if (!bus.date) continue;

      if (!busesByDate.has(bus.date)) {
        busesByDate.set(bus.date, []);
      }

      busesByDate.get(bus.date)!.push(bus);
    }

    // ============================================
    // FIND FULLY BOOKED DATES
    // ============================================

    const bookedDates: string[] = [];

    for (const [date, dateBuses] of busesByDate.entries()) {
      /*
       * A date is FULLY BOOKED only when
       * every bus on that route has zero available seats.
       *
       * pending = unavailable
       * booked  = unavailable
       * available = available
       */

      const hasAvailableSeat = dateBuses.some((bus) =>
        bus.seats?.some(
          (seat) => seat.status === "available"
        )
      );

      if (!hasAvailableSeat) {
        bookedDates.push(date);
      }
    }

    console.log(
      "FULLY BOOKED DATES:",
      bookedDates
    );

    // ============================================
    // RESPONSE DATA
    // ============================================

    const responseData = {
      success: true,
      pickup,
      dropoff,
      bookedDates,
    };

    // ============================================
    // SAVE TO REDIS
    // ============================================

    await setCache(
      cacheKey,
      responseData,
      CACHE_TTL
    );

    console.log("BOOKED DATES CACHE SAVED:", {
      pickup,
      dropoff,
      ttl: CACHE_TTL,
    });

    // ============================================
    // RESPONSE
    // ============================================

    return NextResponse.json({
      ...responseData,
      cached: false,
    });
  } catch (error) {
    console.error(
      "BOOKED DATES API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to get booked dates",
        bookedDates: [],
      },
      { status: 500 }
    );
  }
}