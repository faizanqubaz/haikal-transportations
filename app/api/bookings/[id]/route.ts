
import { sendBookingConfirmationEmail } from "@/libs/resend";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/libs/mongodb";
import Booking from "@/models/Booking";
import Bus from "@/models/Bus";
import Notification from "@/models/Notification";

import {
  createCacheKey,
  getCache,
  setCache,
  deleteCache,
} from "@/libs/cache/api-cache";

const EDITABLE_FIELDS = [
  "passengerName",
  "passengerEmail",
  "passengerPhone",
  "route",
  "seats",
  "travelDate",
  "travelTime",
  "status",
  'gender'
] as const;


// ============================================================
// CACHE CONFIGURATION
// ============================================================

// Booking information can change frequently,
// so we use a short cache.
const BOOKING_CACHE_TTL = 60;


// ============================================================
// CACHE HELPERS
// ============================================================

function getBookingCacheKey(id: string) {
  return createCacheKey(
    `/api/bookings/${id}`,
    "GET",
    { id }
  );
}


// ============================================================
// GET /api/bookings/[id]
// ============================================================

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ----------------------------------------------------------
    // Validate ID BEFORE hitting Redis / database
    // ----------------------------------------------------------

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          error: "Invalid booking id",
        },
        {
          status: 400,
        }
      );
    }


    // ----------------------------------------------------------
    // CHECK REDIS CACHE FIRST
    // ----------------------------------------------------------

    const cacheKey = getBookingCacheKey(id);

    const cached = await getCache<{
      booking: any;
    }>(cacheKey);


    if (cached) {
      console.log(
        `BOOKING CACHE HIT: ${id}`
      );

      return NextResponse.json({
        ...cached,
        cached: true,
      });
    }


    console.log(
      `BOOKING CACHE MISS: ${id}`
    );


    // ----------------------------------------------------------
    // DATABASE
    // ----------------------------------------------------------

    await connectDB();


    const booking = await Booking.findById(id)
      .populate("bus", "busNumber")
      .populate("driver", "name")
      .lean();


    if (!booking) {
      return NextResponse.json(
        {
          error: "Booking not found",
        },
        {
          status: 404,
        }
      );
    }


    // ----------------------------------------------------------
    // SAVE RESULT TO REDIS
    // ----------------------------------------------------------

    const responseData = {
      booking,
    };


    await setCache(
      cacheKey,
      responseData,
      BOOKING_CACHE_TTL
    );


    // ----------------------------------------------------------
    // RESPONSE
    // ----------------------------------------------------------

    return NextResponse.json({
      ...responseData,
      cached: false,
    });


  } catch (err) {

    console.error(
      "GET /api/bookings/[id] failed:",
      err
    );


    return NextResponse.json(
      {
        error: "Failed to fetch booking",
      },
      {
        status: 500,
      }
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


    // ----------------------------------------------------------
    // VALIDATE ID
    // ----------------------------------------------------------

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          error: "Invalid booking id",
        },
        {
          status: 400,
        }
      );
    }


    // ----------------------------------------------------------
    // FIND BOOKING
    // ----------------------------------------------------------

    const booking =
      await Booking.findById(id);


    if (!booking) {
      return NextResponse.json(
        {
          error: "Booking not found",
        },
        {
          status: 404,
        }
      );
    }


    // ----------------------------------------------------------
    // FIND BUS
    // ----------------------------------------------------------

    const bus =
      await Bus.findById(booking.bus);


    if (!bus) {
      return NextResponse.json(
        {
          error: "Associated bus not found",
        },
        {
          status: 404,
        }
      );
    }


    // ----------------------------------------------------------
    // RELEASE BOOKING SEATS
    // ----------------------------------------------------------

    const bookingSeats =
      booking.seats.map((seat: any) =>
        String(seat).trim()
      );


    bus.seats.forEach((seat: any) => {

      const seatNumber =
        String(seat.seatNumber).trim();


      if (
        bookingSeats.includes(seatNumber)
      ) {
        seat.status = "available";
      }
    });


    await bus.save();


    // ----------------------------------------------------------
    // DELETE BOOKING
    // ----------------------------------------------------------

    await Booking.findByIdAndDelete(id);


    // ----------------------------------------------------------
    // DELETE RELATED NOTIFICATIONS
    // ----------------------------------------------------------

    await Notification.deleteMany({
      bookingId: booking._id,
    });


    // ----------------------------------------------------------
    // INVALIDATE BOOKING CACHE
    // ----------------------------------------------------------

    const bookingCacheKey =
      getBookingCacheKey(id);


    await deleteCache(
      bookingCacheKey
    );


    // ----------------------------------------------------------
    // INVALIDATE BUS CACHE
    //
    // The bus availability changed because seats were released.
    // ----------------------------------------------------------

    await deleteCache(
      createCacheKey(
        `/api/busses/${booking.bus}`,
        "GET",
        {
          id: String(booking.bus),
        }
      )
    );


    // ----------------------------------------------------------
    // RESPONSE
    // ----------------------------------------------------------

    return NextResponse.json({
      success: true,

      message:
        "Booking deleted and seats released successfully",

      releasedSeats: bookingSeats,

      cached: false,
    });


  } catch (err) {

    console.error(
      "DELETE /api/bookings/[id] failed:",
      err
    );


    return NextResponse.json(
      {
        error: "Failed to delete booking",
      },
      {
        status: 500,
      }
    );
  }
}

const HAIKAL_WHATSAPP_NUMBER = "03554329249"; // Haikal company sender number (registered in Meta Business Manager)
 
/**
 * Converts a local Pakistani number (03XXXXXXXXX) into
 * WhatsApp's required international format (92XXXXXXXXXX, no +, no leading 0)
 */
function formatPakPhoneForWhatsApp(rawNumber: string): string {
  const digits = rawNumber.replace(/\D/g, ""); // strip spaces, dashes, +
  if (digits.startsWith("92")) return digits;
  if (digits.startsWith("0")) return "92" + digits.slice(1);
  return "92" + digits; // fallback: assume local number missing leading 0
}
 
interface WhatsAppBookingParams {
  passengerName: string;
  passengerPhone: string; // customer's number, e.g. "03001234567"
  bookingRef: string;
  route: string;
  travelDate: string;
  travelTime: string;
  seats: string[];
  busNumber?: string;
  driverName?: string;
  driverPhone?: string;
}
 
/**
 * Sends a booking confirmation via WhatsApp Cloud API using a
 * pre-approved UTILITY template named "booking_confirmation".
 * You must create + get this template approved in Meta Business
 * Manager before this will work. Body placeholders {{1}}..{{7}}
 * map to the parameters array below, in order.
 */
async function sendBookingConfirmationWhatsApp(
  params: WhatsAppBookingParams
): Promise<boolean> {
  const {
    passengerName,
    passengerPhone,
    bookingRef,
    route,
    travelDate,
    travelTime,
    seats,
    busNumber,
    driverPhone,
  } = params;
 
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID; // Meta's ID for HAIKAL_WHATSAPP_NUMBER
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
 
  if (!phoneNumberId || !accessToken) {
    console.error(
      "WhatsApp credentials missing (WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN) — skipping WhatsApp send"
    );
    return false;
  }
 
  if (!passengerPhone) {
    console.error(
      `WHATSAPP SEND SKIPPED for ${bookingRef}: no passenger phone on booking`
    );
    return false;
  }
 
  const toNumber = formatPakPhoneForWhatsApp(passengerPhone);
 
  const payload = {
    messaging_product: "whatsapp",
    to: toNumber,
    type: "template",
    template: {
      name: "booking_confirmation",
      language: { code: "en" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: passengerName || "Passenger" },
            { type: "text", text: bookingRef },
            { type: "text", text: busNumber || "N/A" },
            { type: "text", text: seats.length ? seats.join(", ") : "N/A" },
            { type: "text", text: route || "N/A" },
            { type: "text", text: `${travelDate || ""} ${travelTime || ""}`.trim() || "N/A" },
            { type: "text", text: driverPhone || "N/A" },
          ],
        },
      ],
    },
  };
 
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
 
    const data = await res.json();
 
    if (!res.ok) {
      console.error(
        `WHATSAPP SEND FAILED for ${bookingRef}:`,
        JSON.stringify(data)
      );
      return false;
    }
 
    console.log(`WHATSAPP CONFIRMATION SENT: ${bookingRef}`, data);
    return true;
  } catch (err) {
    console.error(`WHATSAPP SEND ERROR for ${bookingRef}:`, err);
    return false;
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
 
 
    // ----------------------------------------------------------
    // VALIDATE ID
    // ----------------------------------------------------------
 
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          error: "Invalid booking id",
        },
        {
          status: 400,
        }
      );
    }
 
 
    const body = await req.json();
console.log('editbody',body)
 
    // ----------------------------------------------------------
    // VALIDATE STATUS
    // ----------------------------------------------------------
 
    if (
      body.status &&
      ![
        "pending",
        "approved",
        "rejected",
      ].includes(body.status)
    ) {
      return NextResponse.json(
        {
          error: "Invalid status value",
        },
        {
          status: 400,
        }
      );
    }
 
 
    // ----------------------------------------------------------
    // FIND BOOKING
    // ----------------------------------------------------------
 
    const booking =
      await Booking.findById(id);
 
 
    if (!booking) {
      return NextResponse.json(
        {
          error: "Booking not found",
        },
        {
          status: 404,
        }
      );
    }
 
 
    // ----------------------------------------------------------
    // PREVENT DOUBLE PROCESSING
    // ----------------------------------------------------------
 
    if (
      body.status &&
      body.status !== "pending" &&
      booking.status !== "pending" &&
      booking.status !== body.status
    ) {
      return NextResponse.json(
        {
          error:
            `Booking is already ${booking.status}`,
        },
        {
          status: 409,
        }
      );
    }
 
 
    // ----------------------------------------------------------
    // FIND BUS
    // ----------------------------------------------------------
 
    const bus =
      await Bus.findById(booking.bus);
 
 
    if (!bus) {
      return NextResponse.json(
        {
          error: "Associated bus not found",
        },
        {
          status: 404,
        }
      );
    }
 
 
    // ----------------------------------------------------------
    // STATUS CHANGE
    // ----------------------------------------------------------
 
    const newStatus =
      body.status;
 
 
    if (newStatus) {
 
      const bookingSeats =
        booking.seats.map(
          (seat: any) =>
            String(seat).trim()
        );
 
 
      // ========================================================
      // APPROVED
      // ========================================================
 
      if (newStatus === "approved") {
 
        // ------------------------------------------------------
        // Check all requested seats
        // ------------------------------------------------------
 
        for (
          const seatNumber
          of bookingSeats
        ) {
 
          const seat =
            bus.seats.find(
              (s: any) =>
                String(
                  s.seatNumber
                ).trim() ===
                seatNumber
            );
 
 
          if (!seat) {
            return NextResponse.json(
              {
                error:
                  `Seat ${seatNumber} not found on bus`,
              },
              {
                status: 409,
              }
            );
          }
 
 
          if (
            seat.status !== "pending" &&
            seat.status !== "booked"
          ) {
            return NextResponse.json(
              {
                error:
                  `Seat ${seatNumber} is not available`,
              },
              {
                status: 409,
              }
            );
          }
        }
 
 
        // ------------------------------------------------------
        // Mark seats as booked
        // ------------------------------------------------------
 
        bus.seats.forEach(
          (seat: any) => {
 
            const seatNumber =
              String(
                seat.seatNumber
              ).trim();
 
 
            if (
              bookingSeats.includes(
                seatNumber
              )
            ) {
              seat.status = "booked";
            }
          }
        );
 
 
        await bus.save();
 
 
        // ------------------------------------------------------
        // Schedule email
        // ------------------------------------------------------
 
        booking.emailSent = false;
 
        booking.emailScheduledAt =
          new Date();
 
 
        console.log(
          `EMAIL SCHEDULED FOR BOOKING ${booking.bookingRef}`,
          booking.emailScheduledAt
        );
      }
 
 
      // ========================================================
      // REJECTED
      // ========================================================
 
      if (newStatus === "rejected") {
 
        bus.seats.forEach(
          (seat: any) => {
 
            const seatNumber =
              String(
                seat.seatNumber
              ).trim();
 
 
            if (
              bookingSeats.includes(
                seatNumber
              )
            ) {
              seat.status =
                "available";
            }
          }
        );
 
 
        await bus.save();
 
 
        booking.emailScheduledAt =
          undefined;
      }
 
 
      // ========================================================
      // PENDING
      // ========================================================
 
      if (newStatus === "pending") {
 
        bus.seats.forEach(
          (seat: any) => {
 
            const seatNumber =
              String(
                seat.seatNumber
              ).trim();
 
 
            if (
              bookingSeats.includes(
                seatNumber
              )
            ) {
              seat.status =
                "pending";
            }
          }
        );
 
 
        await bus.save();
 
 
        booking.emailScheduledAt =
          undefined;
 
        booking.emailSent = false;
      }
 
 
      booking.status =
        newStatus;
 
 
      // --------------------------------------------------------
      // NOTIFICATION CLEANUP
      // --------------------------------------------------------
 
      if (
        newStatus === "approved" ||
        newStatus === "rejected"
      ) {
 
        await Notification.updateMany(
          {
            bookingId:
              booking._id,
          },
          {
            read: true,
          }
        );
 
 
        await Notification.deleteMany({
          bookingId:
            booking._id,
        });
      }
    }
 
 
    // ==========================================================
    // OTHER EDITABLE FIELDS
    // ==========================================================
 
    for (
      const field
      of EDITABLE_FIELDS
    ) {
 
      if (
        field !== "status" &&
        body[field] !== undefined
      ) {
 
        (booking as any)[field] =
          body[field];
      }
    }
 
 
    // ==========================================================
    // SAVE BOOKING
    // ==========================================================
 
    await booking.save();
 
 
    // ==========================================================
    // GET UPDATED BOOKING
    // ==========================================================
 
    const updatedBooking =
      await Booking.findById(id)
        .populate(
          "bus",
          "busNumber"
        )
        .populate(
          "driver",
          "name phone"
        )
        .lean();
 
 
    if (!updatedBooking) {
      return NextResponse.json(
        {
          error:
            "Booking was updated but could not be retrieved",
        },
        {
          status: 500,
        }
      );
    }
 
 
    // ==========================================================
    // INVALIDATE BOOKING CACHE
    //
    // IMPORTANT:
    // PATCH changed the database, therefore the old GET cache
    // must be removed.
    // ==========================================================
 
    await deleteCache(
      getBookingCacheKey(id)
    );
 
 
    // ==========================================================
    // INVALIDATE BUS CACHE
    //
    // Status changes can change seat availability.
    // ==========================================================
 
    await deleteCache(
      createCacheKey(
        `/api/busses/${booking.bus}`,
        "GET",
        {
          id: String(booking.bus),
        }
      )
    );
 
 
    // ==========================================================
    // SEND CONFIRMATION EMAIL + WHATSAPP
    // ==========================================================
 
    let emailSent = false;
    let whatsappSent = false;
 
 
    if (
      newStatus === "approved" &&
      updatedBooking.passengerEmail
    ) {
 
      try {
 
        await sendBookingConfirmationEmail({
 
          passengerName:
            updatedBooking.passengerName,
 
          passengerEmail:
            updatedBooking.passengerEmail,
 
          passengerPhone:
            updatedBooking.passengerPhone,
 
          bookingRef:
            updatedBooking.bookingRef,
 
          route:
            updatedBooking.route,
 
          travelDate:
            updatedBooking.travelDate,
 
          travelTime:
            updatedBooking.travelTime,
 
          seats:
            updatedBooking.seats || [],
 
          busNumber:
            typeof updatedBooking.bus ===
              "object" &&
            updatedBooking.bus !== null
              ? (updatedBooking.bus as any)
                  .busNumber
              : undefined,
        });
 
 
        await Booking.findByIdAndUpdate(
          id,
          {
            emailSent: true,
          }
        );
 
 
        emailSent = true;
 
 
        console.log(
          `BOOKING CONFIRMATION EMAIL SENT: ${updatedBooking.bookingRef}`
        );
 
 
      } catch (emailError) {
 
        console.error(
          `BOOKING CONFIRMATION EMAIL FAILED: ${updatedBooking.bookingRef}`,
          emailError
        );
 
 
        await Booking.findByIdAndUpdate(
          id,
          {
            emailSent: false,
          }
        );
      }
 
 
      // ----------------------------------------------------------
      // WhatsApp confirmation — sent independently of email result,
      // so an email failure doesn't block the WhatsApp message.
      // ----------------------------------------------------------
 
      if (updatedBooking.passengerPhone) {
 
        whatsappSent =
          await sendBookingConfirmationWhatsApp({
 
            passengerName:
              updatedBooking.passengerName,
 
            passengerPhone:
              updatedBooking.passengerPhone,
 
            bookingRef:
              updatedBooking.bookingRef,
 
            route:
              updatedBooking.route,
 
            travelDate:
              updatedBooking.travelDate,
 
            travelTime:
              updatedBooking.travelTime,
 
            seats:
              updatedBooking.seats || [],
 
            busNumber:
              typeof updatedBooking.bus ===
                "object" &&
              updatedBooking.bus !== null
                ? (updatedBooking.bus as any)
                    .busNumber
                : undefined,
 
            driverName:
              typeof updatedBooking.driver ===
                "object" &&
              updatedBooking.driver !== null
                ? (updatedBooking.driver as any)
                    .name
                : undefined,
 
            driverPhone:
              typeof updatedBooking.driver ===
                "object" &&
              updatedBooking.driver !== null
                ? (updatedBooking.driver as any)
                    .phone
                : undefined,
          });
 
      } else {
 
        console.log(
          `WHATSAPP SEND SKIPPED for ${updatedBooking.bookingRef}: no passengerPhone on booking`
        );
      }
    }
 
 
    // ==========================================================
    // BUILD RESPONSE MESSAGE
    // ==========================================================
 
    const messageByStatus: Record<
      string,
      string
    > = {
 
      approved:
        "Booking approved successfully",
 
      rejected:
        "Booking rejected successfully",
 
      pending:
        "Booking reset to pending",
    };
 
 
    // ==========================================================
    // RESPONSE
    // ==========================================================
 
    return NextResponse.json({
 
      success: true,
 
      message:
        newStatus
          ? messageByStatus[
              newStatus
            ] ||
            "Booking updated successfully"
          : "Booking updated successfully",
 
      booking:
        updatedBooking,
 
      emailSent,
 
      whatsappSent,
 
      cached: false,
    });
 
 
  } catch (err) {
 
    console.error(
      "PATCH /api/bookings/[id] failed:",
      err
    );
 
 
    return NextResponse.json(
      {
        error:
          "Failed to update booking",
 
        details:
          process.env.NODE_ENV ===
          "development"
            ? err instanceof Error
              ? err.message
              : String(err)
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}

