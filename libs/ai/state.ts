import {
  Annotation,
  messagesStateReducer,
} from "@langchain/langgraph";

import type { BaseMessage } from "@langchain/core/messages";

export const BookingAssistantState = Annotation.Root({
  /**
   * Complete LangChain/LangGraph conversation.
   *
   * This is persisted by the Postgres checkpointer.
   */
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),

  /**
   * Assistant language.
   */
  language: Annotation<"ur" | 'hi'>({
    reducer: (_, next) => next,
    default: () => "ur",
  }),

  /**
   * Persistent booking workflow state.
   *
   * LangGraph will persist this together with messages.
   */
  booking: Annotation<{
    busId?: string;
    busNumber?: string;

    travelDate?: string;

    pickup?: string;
    dropoff?: string;

    seats?: string[];

    passengerName?: string;
    passengerEmail?: string;
    passengerPhone?: string;

    confirmed?: boolean;

    bookingCreated?: boolean;
    bookingRef?: string;
  }>({
    reducer: (previous, next) => ({
      ...previous,
      ...next,
    }),

    default: () => ({}),
  }),
});

export type BookingAssistantStateType =
  typeof BookingAssistantState.State;