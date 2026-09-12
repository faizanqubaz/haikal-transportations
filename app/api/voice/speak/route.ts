import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const TTS_MODEL =
  "gemini-3.1-flash-tts-preview";

const VOICE_NAME = "Kore";

const ai = GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
    })
  : null;

// ============================================================
// PCM → WAV
// ============================================================

function pcmToWav(
  pcmBase64: string,
  sampleRate = 24000,
  channels = 1,
  bitsPerSample = 16
): Buffer {
  const pcmBuffer =
    Buffer.from(
      pcmBase64,
      "base64"
    );

  const byteRate =
    sampleRate *
    channels *
    (bitsPerSample / 8);

  const blockAlign =
    channels *
    (bitsPerSample / 8);

  const wavHeader =
    Buffer.alloc(44);

  wavHeader.write(
    "RIFF",
    0
  );

  wavHeader.writeUInt32LE(
    36 + pcmBuffer.length,
    4
  );

  wavHeader.write(
    "WAVE",
    8
  );

  wavHeader.write(
    "fmt ",
    12
  );

  wavHeader.writeUInt32LE(
    16,
    16
  );

  wavHeader.writeUInt16LE(
    1,
    20
  );

  wavHeader.writeUInt16LE(
    channels,
    22
  );

  wavHeader.writeUInt32LE(
    sampleRate,
    24
  );

  wavHeader.writeUInt32LE(
    byteRate,
    28
  );

  wavHeader.writeUInt16LE(
    blockAlign,
    32
  );

  wavHeader.writeUInt16LE(
    bitsPerSample,
    34
  );

  wavHeader.write(
    "data",
    36
  );

  wavHeader.writeUInt32LE(
    pcmBuffer.length,
    40
  );

  return Buffer.concat([
    wavHeader,
    pcmBuffer,
  ]);
}

// ============================================================
// GEMINI TTS
// ============================================================

async function generateSpeech(
  urduText: string
): Promise<Buffer> {
  if (!ai) {
    throw new Error(
      "Gemini client is not initialized."
    );
  }

  const response =
    await ai.models.generateContent({
      model: TTS_MODEL,

      contents: [
        {
          role: "user",

          parts: [
            {
              text: `
Generate speech audio only.

The spoken language MUST be Pakistani Urdu.

The transcript below is already Urdu.

Do NOT translate it into English.
Do NOT translate it into Hindi.
Do NOT rewrite it.
Do NOT summarize it.
Do NOT answer it.
Do NOT add words.
Do NOT speak these instructions.

Speak ONLY the text between <TRANSCRIPT> and </TRANSCRIPT>.

Voice:
Friendly Pakistani female travel assistant.

Style:
Warm, natural, friendly, conversational,
clear Pakistani Urdu pronunciation,
medium speed,
pleasant tone,
natural pauses,
not theatrical,
not robotic.

<TRANSCRIPT>
${urduText}
</TRANSCRIPT>
`,
            },
          ],
        },
      ],

      config: {
        responseModalities: ["AUDIO"],

        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: VOICE_NAME,
            },
          },
        },
      },
    });

  const audioPart =
    response.candidates?.[0]
      ?.content?.parts
      ?.find(
        (part) =>
          part.inlineData?.data
      );

  const audioBase64 =
    audioPart?.inlineData?.data;

  if (!audioBase64) {
    console.error(
      "Gemini TTS response:",
      response
    );

    throw new Error(
      "Gemini did not return audio."
    );
  }

  return pcmToWav(audioBase64);
}

// ============================================================
// POST
// ============================================================

export async function POST(
  request: NextRequest
) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error:
            "GEMINI_API_KEY is missing.",
        },
        { status: 500 }
      );
    }

    if (!ai) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Gemini client could not be initialized.",
        },
        { status: 500 }
      );
    }

    const body =
      await request.json();

    const text = body?.text;

    if (
      typeof text !== "string" ||
      !text.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Text is required.",
        },
        { status: 400 }
      );
    }

    const cleanText =
      text.trim();

    if (cleanText.length > 5000) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Text is too long for voice generation.",
        },
        { status: 400 }
      );
    }

    console.log(
      "Gemini Urdu TTS:",
      {
        textLength:
          cleanText.length,
        model:
          TTS_MODEL,
        voice:
          VOICE_NAME,
      }
    );

    // DIRECTLY SEND URDU TO TTS
    const audioBuffer =
      await generateSpeech(
        cleanText
      );

    console.log(
      "Gemini TTS generated:",
      {
        bytes:
          audioBuffer.length,
      }
    );

    return new NextResponse(
      new Uint8Array(
        audioBuffer
      ),
      {
        status: 200,

        headers: {
          "Content-Type":
            "audio/wav",

          "Cache-Control":
            "no-store",

          "Content-Length":
            String(
              audioBuffer.length
            ),

          "X-Voice-Language":
            "ur-PK",

          "X-Voice-Provider":
            "gemini",
        },
      }
    );
  } catch (error) {
    console.error(
      "================================="
    );

    console.error(
      "GEMINI VOICE ERROR"
    );

    console.error(
      "================================="
    );

    if (
      error instanceof Error
    ) {
      console.error(
        "Message:",
        error.message
      );

      console.error(
        "Stack:",
        error.stack
      );
    } else {
      console.error(error);
    }

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to generate speech.",
      },
      { status: 500 }
    );
  }
}