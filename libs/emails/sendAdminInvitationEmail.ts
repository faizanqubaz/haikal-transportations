import { resend } from "@/libs/resend";

type AdminInvitationEmailData = {
  email: string;
  inviteUrl: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendAdminInvitationEmail(
  data: AdminInvitationEmailData
) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const email = escapeHtml(data.email);
  const inviteUrl = data.inviteUrl;

  const result = await resend.emails.send({
    from:
      process.env.RESEND_FROM_EMAIL ||
      "Haikal Tours <updates@updates.inselvolt.de>",

    to: data.email,

    subject: "You're invited to Haikal Tours Admin",

    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />
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

<!-- CONTENT -->

<tr>
<td style="padding:40px 35px;">

  <h1
    style="
      margin:0 0 12px;
      color:#172b2d;
      font-size:26px;
      text-align:center;
    "
  >
    Admin Invitation
  </h1>

  <p
    style="
      margin:0;
      color:#718082;
      font-size:14px;
      line-height:23px;
      text-align:center;
    "
  >
    You have been invited to become an administrator
    of Haikal Tours.
  </p>

  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
      margin-top:25px;
      background:#eff8f8;
      border:1px solid #d7eeee;
      border-radius:12px;
    "
  >
    <tr>
      <td style="padding:18px;text-align:center;">

        <div
          style="
            color:#718082;
            font-size:10px;
            font-weight:bold;
            text-transform:uppercase;
            letter-spacing:2px;
          "
        >
          Invited Email
        </div>

        <div
          style="
            margin-top:7px;
            color:#063d43;
            font-size:15px;
            font-weight:bold;
          "
        >
          ${email}
        </div>

      </td>
    </tr>
  </table>

  <div style="text-align:center;margin-top:30px;">

    <a
      href="${inviteUrl}"
      style="
        display:inline-block;
        background:#063d43;
        color:#ffffff;
        text-decoration:none;
        padding:15px 30px;
        border-radius:10px;
        font-size:14px;
        font-weight:bold;
      "
    >
      Accept Admin Invitation
    </a>

  </div>

  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
      margin-top:30px;
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
          Invitation Expiration
        </div>

        <div
          style="
            color:#796d52;
            font-size:12px;
            line-height:20px;
          "
        >
          This invitation is valid for 24 hours only.
          After that, the invitation link will expire and
          can no longer be used.
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
    Haikal Tours Admin
  </div>

  <div
    style="
      margin-top:7px;
      color:#8a9697;
      font-size:11px;
      line-height:18px;
    "
  >
    If you did not expect this invitation,
    you can safely ignore this email.
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
      result.error.message || "Failed to send admin invitation"
    );
  }

  return result;
}