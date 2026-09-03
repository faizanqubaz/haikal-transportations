import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendBookingConfirmationEmail(booking: {
  passengerName: string;
  passengerEmail: string;
  bookingRef: string;
  route: string;
  travelDate: Date;
  travelTime?: string;
  seat?: string;
}) {
  const dateStr = new Date(booking.travelDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "Haikal Tours <bookings@haikaltours.com>",
    to: booking.passengerEmail,
    subject: `Booking Confirmed - ${booking.bookingRef}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color:#063d43;">Your booking is confirmed!</h2>
        <p>Hi ${booking.passengerName},</p>
        <p>Your trip with Haikal Tours has been confirmed. Here are the details:</p>
        <table style="width:100%; border-collapse: collapse;">
          <tr><td style="padding:6px 0; color:#666;">Booking Ref</td><td style="font-weight:bold;">${booking.bookingRef}</td></tr>
          <tr><td style="padding:6px 0; color:#666;">Route</td><td>${booking.route}</td></tr>
          <tr><td style="padding:6px 0; color:#666;">Date</td><td>${dateStr}</td></tr>
          <tr><td style="padding:6px 0; color:#666;">Time</td><td>${booking.travelTime || "-"}</td></tr>
          <tr><td style="padding:6px 0; color:#666;">Seat</td><td>${booking.seat || "-"}</td></tr>
        </table>
        <p style="margin-top:20px;">Thank you for booking with Haikal Tours. See you on board!</p>
      </div>
    `,
  });
}
