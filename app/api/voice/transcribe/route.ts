import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";

const ELEVENLABS_API_KEY =
  'ab7b1ee60a0bc6498899f9c4ac6fd5692b24ad7b93bba171652d718e21df0fef';

if (!ELEVENLABS_API_KEY) {
  console.warn(
    "ELEVENLABS_API_KEY is not configured."
  );
}

export async function POST(
  request: NextRequest
) {
  try {
    if (!ELEVENLABS_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ElevenLabs API key is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    const incomingForm =
      await request.formData();

    const audio =
      incomingForm.get("audio");

    if (!(audio instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Audio file is required.",
        },
        {
          status: 400,
        }
      );
    }

    const elevenForm =
      new FormData();

    elevenForm.append(
      "file",
      audio,
      audio.name || "recording.webm"
    );

    elevenForm.append(
      "model_id",
      "scribe_v2"
    );

    elevenForm.append(
      "language_code",
      "eng"
    );

    const response =
      await fetch(
        "https://api.elevenlabs.io/v1/speech-to-text",
        {
          method: "POST",

          headers: {
            "xi-api-key":
              ELEVENLABS_API_KEY,
          },

          body: elevenForm,

          cache: "no-store",
        }
      );

    const data =
      await response.json();
console.log('elevenlab data',data)
    if (!response.ok) {
      console.error(
        "ELEVENLABS_STT_ERROR:",
        data
      );

      return NextResponse.json(
        {
          success: false,
          error:
            data?.detail ||
            "Speech transcription failed.",
        },
        {
          status: response.status,
        }
      );
    }

    return NextResponse.json({
      success: true,
      text: data?.text || "",
      languageCode:
        data?.language_code || "en",
    });
  } catch (error) {
    console.error(
      "TRANSCRIBE_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to transcribe audio.",
      },
      {
        status: 500,
      }
    );
  }
}