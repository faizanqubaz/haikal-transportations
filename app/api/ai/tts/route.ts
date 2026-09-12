import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const TTS_MODEL = "gemini-3.1-flash-tts-preview";
const VOICE_NAME = "Kore";

const ai = GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
    })
  : null;

function pcmToWav(
  pcmBase64: string,
  sampleRate = 24000,
  channels = 1,
  bitsPerSample = 16
): Buffer {
  const pcm = Buffer.from(pcmBase64, "base64");

  const byteRate =
    sampleRate *
    channels *
    (bitsPerSample / 8);

  const blockAlign =
    channels *
    (bitsPerSample / 8);

  const buffer = Buffer.alloc(
    44 + pcm.length
  );

  buffer.write("RIFF", 0);

  buffer.writeUInt32LE(
    36 + pcm.length,
    4
  );

  buffer.write("WAVE", 8);

  buffer.write("fmt ", 12);

  buffer.writeUInt32LE(
    16,
    16
  );

  // PCM
  buffer.writeUInt16LE(
    1,
    20
  );

  buffer.writeUInt16LE(
    channels,
    22
  );

  buffer.writeUInt32LE(
    sampleRate,
    24
  );

  buffer.writeUInt32LE(
    byteRate,
    28
  );

  buffer.writeUInt16LE(
    blockAlign,
    32
  );

  buffer.writeUInt16LE(
    bitsPerSample,
    34
  );

  buffer.write("data", 36);

  buffer.writeUInt32LE(
    pcm.length,
    40
  );

  pcm.copy(
    buffer,
    44
  );

  return buffer;
}

async function generateSpeech(
  urduText: string
): Promise<Buffer> {
  if (!ai) {
    throw new Error(
      "GEMINI_API_KEY is missing."
    );
  }

  const start = Date.now();

  console.log(
    "========== GEMINI TTS =========="
  );

  console.log(
    "Urdu text:",
    urduText
  );

  const response =
    await ai.models.generateContent({
      model: TTS_MODEL,

      contents: [
        {
          role: "user",

          parts: [
            {
              text: `
You are a warm, friendly Pakistani female travel assistant.

Speak the following text in natural Pakistani Urdu.

IMPORTANT:

- Speak in Pakistani Urdu.
- Do not translate.
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

      config: {
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
    });

  const parts =
    response.candidates?.[0]
      ?.content?.parts || [];

  const audioPart = parts.find(
    (part: any) =>
      part.inlineData?.data
  );

  if (
    !audioPart?.inlineData?.data
  ) {
    console.error(
      "Gemini response:",
      JSON.stringify(
        response,
        null,
        2
      )
    );

    throw new Error(
      "Gemini did not return audio."
    );
  }

  const wav =
    pcmToWav(
      audioPart.inlineData.data
    );

  console.log(
    "TTS generation time:",
    `${Date.now() - start}ms`
  );

  console.log(
    "Audio bytes:",
    wav.length
  );

  console.log(
    "================================"
  );

  return wav;
}

export async function POST(
  request: NextRequest
) {
  try {
    if (!GEMINI_API_KEY) {
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

    // Generate Urdu audio directly.
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
      "Gemini TTS error:",
      error
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