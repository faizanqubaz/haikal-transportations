import { NextRequest, NextResponse } from "next/server";

import {
  HumanMessage,
  AIMessage,
} from "@langchain/core/messages";
import { getBookingAssistant } from "@/libs/ai/graph";

// ✅ import the graph, not the React component


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const message =
      typeof body.message === "string" ? body.message.trim() : "";

    const threadId =
      typeof body.threadId === "string" ? body.threadId : "";

    if (!message) {
      return NextResponse.json(
        { success: false, message: "پیغام ضروری ہے۔" },
        { status: 400 }
      );
    }

    if (!threadId) {
      return NextResponse.json(
        { success: false, message: "Conversation ID ضروری ہے۔" },
        { status: 400 }
      );
    }

    // ✅ get the compiled graph, then invoke it
    const bookingAssistant = await getBookingAssistant();

    const result = await bookingAssistant.invoke(
      {
        messages: [new HumanMessage(message)],
        language: "en",
      },
      {
        configurable: {
          thread_id: threadId,
        },
      }
    );

    const messages = result.messages;
    const lastMessage = messages[messages.length - 1];

    let answer = "";

    if (lastMessage instanceof AIMessage) {
      if (typeof lastMessage.content === "string") {
        answer = lastMessage.content;
      } else {
        answer = lastMessage.content
          .map((item: any) => {
            if (typeof item === "string") return item;
            if (item?.type === "text") return item.text;
            return "";
          })
          .filter(Boolean)
          .join("");
      }
    }

    return NextResponse.json({
      success: true,
      answer,
      language: "en",
      threadId,
    });
  } catch (error) {
    console.error("BOOKING ASSISTANT ERROR:", error);

    return NextResponse.json(
      { success: false, message: "sorry we can't process your query. " },
      { status: 500 }
    );
  }
}