import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const TTS_MODEL = "gemini-3.1-flash-tts-preview";
const VOICE_NAME = "Kore";

const GEMINI_TTS_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent`;

// ============================================================
// PCM -> WAV
// ============================================================

function pcmToWav(
  pcmBase64: string,
  sampleRate = 24000,
  channels = 1,
  bitsPerSample = 16
): Buffer {
  const pcm = Buffer.from(pcmBase64, "base64");

  const bytesPerSample = bitsPerSample / 8;

  const byteRate =
    sampleRate *
    channels *
    bytesPerSample;

  const blockAlign =
    channels *
    bytesPerSample;

  const wav = Buffer.alloc(
    44 + pcm.length
  );

  // RIFF
  wav.write("RIFF", 0);

  wav.writeUInt32LE(
    36 + pcm.length,
    4
  );

  wav.write("WAVE", 8);

  // fmt
  wav.write("fmt ", 12);

  wav.writeUInt32LE(
    16,
    16
  );

  // Audio format = PCM
  wav.writeUInt16LE(
    1,
    20
  );

  // Channels
  wav.writeUInt16LE(
    channels,
    22
  );

  // Sample rate
  wav.writeUInt32LE(
    sampleRate,
    24
  );

  // Byte rate
  wav.writeUInt32LE(
    byteRate,
    28
  );

  // Block align
  wav.writeUInt16LE(
    blockAlign,
    32
  );

  // Bits per sample
  wav.writeUInt16LE(
    bitsPerSample,
    34
  );

  // data
  wav.write("data", 36);

  wav.writeUInt32LE(
    pcm.length,
    40
  );

  pcm.copy(
    wav,
    44
  );

  return wav;
}

// ============================================================
// GENERATE GEMINI TTS
// ============================================================

async function generateSpeech(
  urduText: string
): Promise<Buffer> {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is missing."
    );
  }

  console.log(
    "========== GEMINI TTS =========="
  );

  console.log(
    "Model:",
    TTS_MODEL
  );

  console.log(
    "Voice:",
    VOICE_NAME
  );

  console.log(
    "Input:",
    urduText
  );

  console.log(
    "API key exists:",
    Boolean(GEMINI_API_KEY)
  );

  console.log(
    "API key length:",
    GEMINI_API_KEY.length
  );

  const start = Date.now();

  // ==========================================================
  // IMPORTANT:
  // Use x-goog-api-key directly.
  // Do NOT send Authorization: Bearer.
  // ==========================================================

  const response = await fetch(
    GEMINI_TTS_URL,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",

        "x-goog-api-key":
          GEMINI_API_KEY,
      },

      body: JSON.stringify({
        contents: [
          {
            role: "user",

            parts: [
              {
                text: `
You are a warm, friendly Pakistani female travel assistant.

Speak the following text naturally in Pakistani Urdu.

IMPORTANT:

- Speak in Pakistani Urdu.
- Do not translate the text.
- Do not change the meaning.
- Do not add information.
- Do not remove information.
- Do not speak English.
- Do not speak Hindi.
- Keep bus numbers exactly as written.
- Keep seat numbers exactly as written.
- Keep booking references exactly as written.
- Keep dates exactly as written.
- Keep prices exactly as written.
- Keep names exactly as written.
- Speak naturally.
- Use a warm conversational tone.
- Medium speaking speed.
- Clear pronunciation.
- Natural pauses.
- Do not sound robotic.
- Do not sound theatrical.

TEXT:

${urduText}
`,
              },
            ],
          },
        ],

        generationConfig: {
          responseModalities: [
            "AUDIO",
          ],

          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName:
                  VOICE_NAME,
              },
            },
          },
        },
      }),
    }
  );

  // ==========================================================
  // READ RESPONSE
  // ==========================================================

  const rawResponse =
    await response.text();

  console.log(
    "Gemini HTTP status:",
    response.status
  );

  if (!response.ok) {
    console.error(
      "Gemini HTTP error:",
      rawResponse
    );

    throw new Error(
      `Gemini TTS failed (${response.status}): ${rawResponse}`
    );
  }

  let data: any;

  try {
    data =
      JSON.parse(rawResponse);
  } catch {
    console.error(
      "Invalid Gemini JSON response:",
      rawResponse
    );

    throw new Error(
      "Gemini returned an invalid JSON response."
    );
  }

  console.log(
    "Gemini response received."
  );

  // ==========================================================
  // FIND AUDIO
  // ==========================================================

  const parts =
    data?.candidates?.[0]
      ?.content?.parts || [];

  const audioPart =
    parts.find(
      (part: any) =>
        part?.inlineData?.data
    );

  if (
    !audioPart?.inlineData?.data
  ) {
    console.error(
      "No audio returned by Gemini:"
    );

    console.error(
      JSON.stringify(
        data,
        null,
        2
      )
    );

    throw new Error(
      "Gemini did not return audio."
    );
  }

  const mimeType =
    audioPart.inlineData
      ?.mimeType || "";

  console.log(
    "Gemini audio MIME:",
    mimeType
  );

  const pcmBase64 =
    audioPart.inlineData.data;

  console.log(
    "PCM base64 length:",
    pcmBase64.length
  );

  // ==========================================================
  // PCM -> WAV
  // ==========================================================

  const wav =
    pcmToWav(
      pcmBase64,
      24000,
      1,
      16
    );

  console.log(
    "TTS generation time:",
    `${Date.now() - start}ms`
  );

  console.log(
    "WAV bytes:",
    wav.length
  );

  console.log(
    "================================"
  );

  return wav;
}

// ============================================================
// POST
// ============================================================

export async function POST(
  request: NextRequest
) {
  try {
    if (!GEMINI_API_KEY) {
      console.error(
        "GEMINI_API_KEY is missing."
      );

      return NextResponse.json(
        {
          error:
            "GEMINI_API_KEY is missing.",
        },
        {
          status: 500,
        }
      );
    }

    const body =
      await request.json();

    const text =
      typeof body?.text === "string"
        ? body.text.trim()
        : "";

    if (!text) {
      return NextResponse.json(
        {
          error:
            "Text is required.",
        },
        {
          status: 400,
        }
      );
    }

    // Prevent extremely large TTS requests.
    if (text.length > 5000) {
      return NextResponse.json(
        {
          error:
            "Text is too long for TTS.",
        },
        {
          status: 400,
        }
      );
    }

    const audio =
      await generateSpeech(
        text
      );

    return new NextResponse(
      new Uint8Array(audio),
      {
        status: 200,

        headers: {
          "Content-Type":
            "audio/wav",

          "Cache-Control":
            "no-store",

          "Content-Length":
            String(audio.length),

          "X-Voice-Language":
            "ur-PK",

          "X-Voice-Provider":
            "gemini",

          "X-Voice-Name":
            VOICE_NAME,
        },
      }
    );
  } catch (error: any) {
    console.error(
      "================================"
    );

    console.error(
      "GEMINI TTS ERROR"
    );

    console.error(
      error
    );

    console.error(
      "================================"
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Gemini TTS failed.",
      },
      {
        status: 500,
      }
    );
  }
}