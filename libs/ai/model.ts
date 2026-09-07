import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error(
    "GEMINI_API_KEY is missing"
  );
}

export const model = new ChatGoogleGenerativeAI({
  model:
    process.env.MODEL_NAME ||
    "gemini-3.7-flash",

  apiKey: GEMINI_API_KEY,
});