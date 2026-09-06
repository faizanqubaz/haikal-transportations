import {START,END,StateGraph} from '@langchain/langgraph';
import {
  ToolNode,
  toolsCondition,
} from "@langchain/langgraph/prebuilt";

import {
  BookingAssistantState,
} from "./state";


import {
  bookingTools,
} from "./booking-tools";
import { callBookingModel } from './node';




const toolNode = new ToolNode(
  bookingTools
);


const workflow =
  new StateGraph(BookingAssistantState)

    .addNode(
      "assistant",
      callBookingModel
    )

    .addNode(
      "tools",
      toolNode
    )

    .addEdge(
      START,
      "assistant"
    )

    .addConditionalEdges(
      "assistant",
      toolsCondition,
      {
        tools: "tools",
        __end__: END,
      }
    )

    .addEdge(
      "tools",
      "assistant"
    );

export const bookingAssistant =
  workflow.compile();