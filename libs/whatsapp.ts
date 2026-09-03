const WHATSAPP_API_VERSION = "v20.0";

/**
 * Sends a free-form WhatsApp text message.
 * NOTE: Meta only allows free-form text within a 24h window after the
 * passenger last messaged your business number. For the very first message
 * to a new passenger, use sendWhatsAppTemplate() with an approved template
 * instead, or this call will fail with error code 131047.
 */
export async function sendWhatsAppText(to: string, body: string) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !token) {
    throw new Error("WhatsApp Cloud API is not configured");
  }

  const res = await fetch(
    `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WhatsApp send failed: ${err}`);
  }

  return res.json();
}

/**
 * Sends a pre-approved WhatsApp message template. Use this for the booking
 * confirmation/rejection notice since it's very likely the first message the
 * business has sent to that passenger.
 * You must create and get the template approved in Meta Business Manager
 * first, then put its exact name/language here.
 */
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  languageCode: string,
  parameters: string[]
) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !token) {
    throw new Error("WhatsApp Cloud API is not configured");
  }

  const res = await fetch(
    `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: templateName,
          language: { code: languageCode },
          components: [
            {
              type: "body",
              parameters: parameters.map((p) => ({ type: "text", text: p })),
            },
          ],
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WhatsApp template send failed: ${err}`);
  }

  return res.json();
}
