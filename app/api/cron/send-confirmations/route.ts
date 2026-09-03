import { NextRequest, NextResponse } from "next/server";

import Booking from "@/models/Booking";
import { sendBookingConfirmationEmail } from "@/libs/resend";
import { connectDB } from "@/libs/mongodb";


// Serverless functions can't run a 4-minute setTimeout reliably, so instead
// we store *when* the email should go out (emailScheduledAt) and this route
// gets hit on a schedule (see vercel.json) to send anything that's due.
//
// GET /api/cron/send-confirmations
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const due = await Booking.find({
    status: "confirmed",
    emailSent: false,
    emailScheduledAt: { $lte: new Date() },
  });

  const results = [];
  for (const booking of due) {
    try {
      await sendBookingConfirmationEmail(booking);
      booking.emailSent = true;
      await booking.save();
      results.push({ id: booking._id, sent: true });
    } catch (err: any) {
      results.push({ id: booking._id, sent: false, error: err.message });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
