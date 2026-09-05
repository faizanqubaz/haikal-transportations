import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type BookingEmailData = {
  passengerName: string;
  passengerEmail: string;
  passengerPhone?: string;
  bookingRef: string;
  route: string;
  travelDate: Date | string;
  travelTime?: string;
  seats?: string[];
  busNumber?: string;
};

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendBookingConfirmationEmail(
  booking: BookingEmailData
) {
  console.log('running the email')
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  if (!booking.passengerEmail) {
    throw new Error("Passenger email is missing");
  }

  const dateStr = new Date(
    booking.travelDate
  ).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const seats =
    booking.seats && booking.seats.length > 0
      ? booking.seats
      : [];

  const seatDisplay =
    seats.length > 0
      ? seats.join(", ")
      : "-";

  const name = escapeHtml(
    booking.passengerName
  );

  const bookingRef = escapeHtml(
    booking.bookingRef
  );

  const route = escapeHtml(
    booking.route
  );

  const travelTime = escapeHtml(
    booking.travelTime || "-"
  );

  const busNumber = escapeHtml(
    booking.busNumber || "-"
  );

  const passengerPhone = escapeHtml(
    booking.passengerPhone || "-"
  );

  const subject = `Booking Confirmed • ${booking.bookingRef} • Haikal Tours`;
console.log('subject',subject)
  const result = await resend.emails.send({
    from:
      process.env.RESEND_FROM_EMAIL ||
      "Haikal Tours <updates@updates.inselvolt.de>",

    to: booking.passengerEmail,

    subject,

    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <title>Booking Confirmation</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f3f6f6;
    font-family:Arial,Helvetica,sans-serif;
    color:#172b2d;
  "
>

<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  border="0"
  style="background:#f3f6f6;padding:30px 10px;"
>
<tr>
<td align="center">

<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  border="0"
  style="
    max-width:620px;
    background:#ffffff;
    border-radius:18px;
    overflow:hidden;
    box-shadow:0 8px 30px rgba(0,0,0,0.08);
  "
>

<!-- HEADER -->

<tr>
<td
  style="
    background:#063d43;
    padding:30px 35px;
    text-align:center;
  "
>

  <div
    style="
      display:inline-block;
      width:48px;
      height:48px;
      line-height:48px;
      border-radius:50%;
      background:#ffffff;
      color:#063d43;
      font-size:24px;
      font-weight:900;
    "
  >
    H
  </div>

  <div
    style="
      margin-top:10px;
      color:#ffffff;
      font-size:22px;
      font-weight:900;
      letter-spacing:2px;
    "
  >
    HAIKAL
  </div>

  <div
    style="
      margin-top:3px;
      color:#b8dddd;
      font-size:10px;
      font-weight:bold;
      letter-spacing:4px;
    "
  >
    TOURS
  </div>

</td>
</tr>

<!-- SUCCESS -->

<tr>
<td style="padding:35px 35px 20px;text-align:center;">

  <div
    style="
      display:inline-block;
      width:52px;
      height:52px;
      line-height:52px;
      border-radius:50%;
      background:#e8f7ef;
      color:#16834b;
      font-size:27px;
      font-weight:bold;
    "
  >
    ✓
  </div>

  <h1
    style="
      margin:18px 0 8px;
      color:#172b2d;
      font-size:25px;
    "
  >
    Booking Confirmed
  </h1>

  <p
    style="
      margin:0;
      color:#718082;
      font-size:14px;
      line-height:22px;
    "
  >
    Hi ${name}, your seat has been successfully booked.
  </p>

</td>
</tr>

<!-- BOOKING REFERENCE -->

<tr>
<td style="padding:15px 35px;">

<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  border="0"
  style="
    background:#eff8f8;
    border:1px solid #d7eeee;
    border-radius:12px;
  "
>
<tr>

<td
  style="
    padding:18px;
    text-align:center;
  "
>

  <div
    style="
      color:#718082;
      font-size:10px;
      font-weight:bold;
      text-transform:uppercase;
      letter-spacing:2px;
    "
  >
    Booking Reference
  </div>

  <div
    style="
      margin-top:7px;
      color:#063d43;
      font-size:23px;
      font-weight:900;
      letter-spacing:1px;
    "
  >
    ${bookingRef}
  </div>

</td>

</tr>
</table>

</td>
</tr>

<!-- TRIP CARD -->

<tr>
<td style="padding:15px 35px;">

<h2
  style="
    margin:0 0 14px;
    font-size:15px;
    color:#172b2d;
  "
>
  Trip Details
</h2>

<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  border="0"
  style="
    border:1px solid #e7eeee;
    border-radius:12px;
    overflow:hidden;
  "
>

<tr>
<td
  style="
    padding:14px;
    border-bottom:1px solid #edf1f1;
    color:#7b898a;
    font-size:12px;
    width:38%;
  "
>
  Route
</td>

<td
  style="
    padding:14px;
    border-bottom:1px solid #edf1f1;
    color:#172b2d;
    font-size:13px;
    font-weight:bold;
  "
>
  ${route}
</td>
</tr>

<tr>
<td
  style="
    padding:14px;
    border-bottom:1px solid #edf1f1;
    color:#7b898a;
    font-size:12px;
  "
>
  Travel Date
</td>

<td
  style="
    padding:14px;
    border-bottom:1px solid #edf1f1;
    color:#172b2d;
    font-size:13px;
    font-weight:bold;
  "
>
  ${escapeHtml(dateStr)}
</td>
</tr>

<tr>
<td
  style="
    padding:14px;
    border-bottom:1px solid #edf1f1;
    color:#7b898a;
    font-size:12px;
  "
>
  Departure
</td>

<td
  style="
    padding:14px;
    border-bottom:1px solid #edf1f1;
    color:#172b2d;
    font-size:13px;
    font-weight:bold;
  "
>
  ${travelTime}
</td>
</tr>

<tr>
<td
  style="
    padding:14px;
    border-bottom:1px solid #edf1f1;
    color:#7b898a;
    font-size:12px;
  "
>
  Bus
</td>

<td
  style="
    padding:14px;
    border-bottom:1px solid #edf1f1;
    color:#172b2d;
    font-size:13px;
    font-weight:bold;
  "
>
  ${busNumber}
</td>
</tr>

<tr>
<td
  style="
    padding:14px;
    color:#7b898a;
    font-size:12px;
  "
>
  Seat(s)
</td>

<td
  style="
    padding:14px;
    color:#063d43;
    font-size:14px;
    font-weight:900;
  "
>
  ${escapeHtml(seatDisplay)}
</td>
</tr>

</table>

</td>
</tr>

<!-- PASSENGER -->

<tr>
<td style="padding:15px 35px;">

<h2
  style="
    margin:0 0 14px;
    font-size:15px;
    color:#172b2d;
  "
>
  Passenger Details
</h2>

<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  border="0"
>

<tr>
<td
  style="
    padding:7px 0;
    color:#7b898a;
    font-size:12px;
  "
>
  Name
</td>

<td
  align="right"
  style="
    padding:7px 0;
    color:#172b2d;
    font-size:13px;
    font-weight:bold;
  "
>
  ${name}
</td>
</tr>

<tr>
<td
  style="
    padding:7px 0;
    color:#7b898a;
    font-size:12px;
  "
>
  Phone
</td>

<td
  align="right"
  style="
    padding:7px 0;
    color:#172b2d;
    font-size:13px;
    font-weight:bold;
  "
>
  ${passengerPhone}
</td>
</tr>

<tr>
<td
  style="
    padding:7px 0;
    color:#7b898a;
    font-size:12px;
  "
>
  Email
</td>

<td
  align="right"
  style="
    padding:7px 0;
    color:#172b2d;
    font-size:13px;
    font-weight:bold;
    word-break:break-word;
  "
>
  ${escapeHtml(booking.passengerEmail)}
</td>
</tr>

</table>

</td>
</tr>

<!-- IMPORTANT -->

<tr>
<td style="padding:15px 35px 25px;">

<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  border="0"
  style="
    background:#fff8e8;
    border:1px solid #f4e4b9;
    border-radius:12px;
  "
>
<tr>
<td style="padding:16px;">

  <div
    style="
      color:#8a6418;
      font-size:12px;
      font-weight:bold;
      margin-bottom:6px;
    "
  >
    Travel Reminder
  </div>

  <div
    style="
      color:#796d52;
      font-size:12px;
      line-height:20px;
    "
  >
    Please arrive at the boarding point at least
    15 minutes before departure and keep this
    confirmation available when boarding.
  </div>

</td>
</tr>
</table>

</td>
</tr>

<!-- FOOTER -->

<tr>
<td
  style="
    background:#f7f9f9;
    padding:25px 35px;
    text-align:center;
    border-top:1px solid #edf1f1;
  "
>

  <div
    style="
      color:#063d43;
      font-size:14px;
      font-weight:900;
    "
  >
    Thank you for choosing Haikal Tours
  </div>

  <div
    style="
      margin-top:7px;
      color:#8a9697;
      font-size:11px;
      line-height:18px;
    "
  >
    We look forward to having you on board.
  </div>

  <div
    style="
      margin-top:15px;
      color:#a0aaab;
      font-size:10px;
    "
  >
    This is an automated booking confirmation.
    Please do not reply to this email.
  </div>

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
    `,
  });

  if (result.error) {
    throw new Error(
      result.error.message || "Failed to send email"
    );
  }
console.log('result',result)
  return result;
}