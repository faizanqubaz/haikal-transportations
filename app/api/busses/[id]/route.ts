import { NextRequest, NextResponse } from "next/server";

import Booking from "@/models/Booking";
import { connectDB } from "@/libs/mongodb";
import { sendWhatsAppText } from "@/libs/whatsapp";


// PATCH /api/bookings/:id  body: { action: "approve" | "reject" }
// approve -> status=confirmed, schedules the email for 4 min from now,
//            sends an immediate WhatsApp confirmation
// reject  -> status=cancelled, sends an immediate WhatsApp notice
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await connectDB();
  const { action } = await req.json();

  const booking = await Booking.findById(params.id);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (action === "approve") {
    booking.status = "confirmed";
    booking.emailScheduledAt = new Date(Date.now() + 4 * 60 * 1000);
    await booking.save();

    try {
      await sendWhatsAppText(
        booking.passengerPhone,
        `Hi ${booking.passengerName}, your Haikal Tours booking ${booking.bookingRef} for ${booking.route} has been confirmed. A confirmation email is on its way. Safe travels!`
      );
      booking.whatsappSent = true;
      await booking.save();
    } catch (err) {
      console.error("WhatsApp send failed:", err);
      // Booking stays confirmed even if WhatsApp fails - the dashboard shows
      // whatsappSent=false so the admin can see/retry it.
    }
  } else if (action === "reject") {
    booking.status = "cancelled";
    await booking.save();

    try {
      await sendWhatsAppText(
        booking.passengerPhone,
        `Hi ${booking.passengerName}, unfortunately your Haikal Tours booking ${booking.bookingRef} could not be confirmed. Please contact us for more details.`
      );
    } catch (err) {
      console.error("WhatsApp send failed:", err);
    }
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  return NextResponse.json({ booking });
}
