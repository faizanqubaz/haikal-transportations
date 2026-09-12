
import {
  SystemMessage,
} from "@langchain/core/messages";

import type {
  BookingAssistantStateType,
} from "./state";

import { model } from "./model";
import { bookingTools } from "./booking-tools";


// ============================================================
// SYSTEM PROMPT
// ============================================================

export const systemPrompt = `
You are the Haikal Tours Booking Assistant.

IMPORTANT LANGUAGE RULE:

The user's preferred language is Pakistani Urdu.

Always answer the user in Pakistani Urdu.

Use Urdu script.

Do NOT answer in English unless the user explicitly asks for English.

Do NOT answer in Hindi.

When discussing:
- buses
- routes
- seats
- prices
- booking
- passenger information
- travel dates

continue speaking in natural Pakistani Urdu.

Keep answers short and conversational.

Ask only one question at a time.

Never invent bus information.

Only use the available booking tools for real Haikal Tours information.

When the user provides information in Urdu, remember it in the conversation state.

The final answer must be Pakistani Urdu.
`;


// ============================================================
// MODEL WITH TOOLS
// ============================================================

export const modelWithTools =
  model.bindTools(
    bookingTools
  );


// ============================================================
// LLM NODE
// ============================================================

export async function callBookingModel(
  state: BookingAssistantStateType
) {
  const messages = [
    new SystemMessage(
      systemPrompt
    ),

    ...state.messages,
  ];

  const response =
    await modelWithTools.invoke(
      messages
    );

  return {
    messages: [response],
  };
}

