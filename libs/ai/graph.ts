import {
  START,
  END,
  StateGraph,
} from "@langchain/langgraph";

import {
  ToolNode,
  toolsCondition,
} from "@langchain/langgraph/prebuilt";

import {
  BookingAssistantState,
} from "./state";

import {
  callBookingModel,
} from "./node";

import {
  bookingTools,
} from "./booking-tools";

import {
  getCheckpointer,
} from "./checkpointer";


// ============================================================
// TOOL NODE
// ============================================================

const toolNode =
  new ToolNode(
    bookingTools,
    {
      handleToolErrors:
        true,
    }
  );


// ============================================================
// GRAPH
// ============================================================

let graphPromise:
  | ReturnType<typeof buildGraph>
  | undefined;


// ============================================================
// BUILD GRAPH
// ============================================================

async function buildGraph() {
  const checkpointer =
    await getCheckpointer();

  const graph =
    new StateGraph(
      BookingAssistantState
    )
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

      /**
       * If Gemini wants to use a tool:
       *
       * assistant → tools
       *
       * Otherwise:
       *
       * assistant → END
       */
      .addConditionalEdges(
        "assistant",
        toolsCondition
      )

      /**
       * After executing a tool,
       * send the result back to Gemini.
       */
      .addEdge(
        "tools",
        "assistant"
      );

  return graph.compile({
    checkpointer,
  });
}


// ============================================================
// EXPORTED GRAPH
// ============================================================

export async function getBookingAssistant() {
  if (!graphPromise) {
    graphPromise =
      buildGraph();
  }

  return graphPromise;
}