import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/libs/mongodb";
import Bus from "@/models/Bus";

import {
  createCacheKey,
  getCache,
  setCache,
  deleteCache,
} from "@/libs/cache/api-cache";

const BUS_CACHE_TTL = 30; // seconds

type Params = {
  params: Promise<{
    id: string;
  }>;
};

// ============================================================
// GET BUS BY ID
// ============================================================

export async function GET(
  req: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params;

    console.log("FETCHING BUS BY ID:", id);

    // ========================================================
    // VALIDATE ID BEFORE REDIS
    // ========================================================

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          error: "Invalid bus ID",
        },
        { status: 400 }
      );
    }

    // ========================================================
    // CREATE CACHE KEY
    // ========================================================

    const cacheKey = createCacheKey(
      `/api/busses/${id}`,
      "GET",
      {
        id,
      }
    );

    // ========================================================
    // CHECK REDIS
    // ========================================================

    const cached = await getCache<{
      bus: any;
    }>(cacheKey);

    if (cached) {
      console.log("BUS CACHE HIT:", id);

      return NextResponse.json({
        ...cached,
        cached: true,
      });
    }

    console.log("BUS CACHE MISS:", id);

    // ========================================================
    // DATABASE
    // ========================================================

    await connectDB();

    const bus = await Bus.findById(id).lean();

    if (!bus) {
      return NextResponse.json(
        {
          error: "Bus not found",
        },
        { status: 404 }
      );
    }

    // ========================================================
    // BUILD RESPONSE
    // ========================================================

    const result = {
      id: bus._id.toString(),
      busNumber: bus.busNumber,
      company: bus.company,
      driverPhone: bus.driverPhone,

      route: bus.route,
      pickup: bus.pickup,
      dropoff: bus.dropoff,

      date: bus.date,

      departure: bus.departure,
      arrival: bus.arrival,
      duration: bus.duration,

      price: bus.price,
      image: bus.image,

      seats: bus.seats,

      availableSeats: bus.seats.filter(
        (seat: any) =>
          seat.status === "available"
      ).length,
    };

    console.log("BUS FOUND:", {
      id: result.id,
      busNumber: result.busNumber,
      availableSeats: result.availableSeats,
    });

    const responseData = {
      bus: result,
    };

    // ========================================================
    // SAVE TO REDIS
    // ========================================================

    await setCache(
      cacheKey,
      responseData,
      BUS_CACHE_TTL
    );

    console.log("BUS CACHE SAVED:", {
      id,
      ttl: BUS_CACHE_TTL,
    });

    // ========================================================
    // RESPONSE
    // ========================================================

    return NextResponse.json({
      ...responseData,
      cached: false,
    });
  } catch (error) {
    console.error(
      "GET_BUS_BY_ID_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to fetch bus",
      },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE BUS
// ============================================================

export async function DELETE(
  request: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params;

    console.log("DELETE BUS ID:", id);

    // ========================================================
    // VALIDATE ID
    // ========================================================

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid bus ID",
        },
        { status: 400 }
      );
    }

    // ========================================================
    // DATABASE
    // ========================================================

    await connectDB();

    const deletedBus =
      await Bus.findByIdAndDelete(id);

    if (!deletedBus) {
      return NextResponse.json(
        {
          success: false,
          message: "Bus not found",
        },
        { status: 404 }
      );
    }

    // ========================================================
    // DELETE BUS DETAIL CACHE
    // ========================================================

    const busCacheKey = createCacheKey(
      `/api/busses/${id}`,
      "GET",
      {
        id,
      }
    );

    await deleteCache(busCacheKey);

    console.log(
      "BUS CACHE INVALIDATED:",
      id
    );

    // ========================================================
    // RESPONSE
    // ========================================================

    return NextResponse.json({
      success: true,
      message: "Bus deleted successfully",
      bus: deletedBus,
    });
  } catch (error) {
    console.error(
      "DELETE BUS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete bus",
      },
      { status: 500 }
    );
  }
}