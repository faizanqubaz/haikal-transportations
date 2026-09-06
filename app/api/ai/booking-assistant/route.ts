import { NextRequest, NextResponse } from "next/server";

import {
  HumanMessage,
  AIMessage,
} from "@langchain/core/messages";

import { bookingAssistant } from "@/libs/ai/graph";

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    const language =
      body.language === "ur"
        ? "ur"
        : "en";

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          message: "Message is required.",
        },
        { status: 400 }
      );
    }

    console.log(
      "BOOKING ASSISTANT:",
      {
        message,
        language,
      }
    );

    const result =
      await bookingAssistant.invoke({
        messages: [
          new HumanMessage(message),
        ],

        // Pass language to LangGraph
        language,
      });

    const messages =
      result.messages;

    const lastMessage =
      messages[messages.length - 1];

    let answer = "";

    if (
      lastMessage instanceof AIMessage
    ) {
      if (
        typeof lastMessage.content ===
        "string"
      ) {
        answer =
          lastMessage.content;
      } else {
        answer =
          lastMessage.content
            .map((item: any) => {
              if (
                typeof item ===
                "string"
              ) {
                return item;
              }

              if (
                item?.type ===
                "text"
              ) {
                return item.text;
              }

              return "";
            })
            .filter(Boolean)
            .join("");
      }
    }

    return NextResponse.json({
      success: true,
      answer,
      language,
    });

  } catch (error) {
    console.error(
      "BOOKING ASSISTANT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to process your request.",
      },
      { status: 500 }
    );
  }
}